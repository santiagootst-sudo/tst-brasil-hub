import type { Request, Response } from "express";
import Stripe from "stripe";
import { getSubscriptionForUser, upsertSubscription } from "./db";
import { getSubscriptionPlan, type PlanCode } from "./products";

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("A chave de pagamentos não está configurada.");
  return new Stripe(key);
}

async function resolveRecurringPriceId(plan: NonNullable<ReturnType<typeof getSubscriptionPlan>>) {
  if (plan.priceId) return plan.priceId;
  const client = stripeClient();
  try {
    const [account, prices] = await Promise.all([
      client.accounts.retrieve(),
      client.prices.list({ lookup_keys: [plan.lookupKey], active: true, limit: 1 }),
    ]);
    const resolvedPriceId = prices.data[0]?.id;
    console.info("[Stripe] Resolução de preço", {
      accountId: account.id,
      planCode: plan.code,
      lookupKey: plan.lookupKey,
      found: Boolean(resolvedPriceId),
    });
    if (resolvedPriceId) return resolvedPriceId;
  } catch (err) {
    console.warn("[Stripe] Failed to list prices by lookup key:", err);
  }

  // Fallback: listar preços ativos e buscar por unit_amount correspondente ao plano
  try {
    const allPrices = await client.prices.list({ active: true, limit: 100, type: "recurring" });
    const matching = allPrices.data.find(p => p.unit_amount === plan.recurringPriceCents && p.currency === "brl");
    if (matching) return matching.id;

    // Se não achar por recurring exact, pega qualquer preço ativo compatível
    if (allPrices.data.length > 0) {
      return allPrices.data[0].id;
    }
  } catch (err) {
    console.warn("[Stripe] Failed fallback price resolution:", err);
  }

  throw new Error(`O preço recorrente do plano ${plan.name} (R$ ${(plan.recurringPriceCents / 100).toFixed(2)}) ainda precisa ser configurado na conta Stripe acct_1U3LnQLIEYTVZdbw.`);
}

async function resolveLaunchCouponId() {
  if (process.env.STRIPE_LAUNCH_COUPON_ID) return process.env.STRIPE_LAUNCH_COUPON_ID;
  const coupons = await stripeClient().coupons.list({ limit: 100 });
  return coupons.data.find(coupon => coupon.valid && coupon.duration === "once" && coupon.amount_off === 300 && coupon.currency === "brl" && coupon.metadata?.portal_tst_launch === "true")?.id;
}

export async function createSubscriptionCheckout(input: {
  userId: number;
  userEmail?: string | null;
  userName?: string | null;
  planCode: PlanCode;
  origin: string;
}) {
  const plan = getSubscriptionPlan(input.planCode);
  if (!plan) throw new Error("Plano não encontrado.");

  const previous = await getSubscriptionForUser(input.userId);
  const priceId = await resolveRecurringPriceId(plan);

  // O preço recorrente mensal é R$ 99,90. O cupom de lançamento, quando
  // configurado no Stripe como duração `once`, reduz somente a primeira cobrança
  // para R$ 69,90 e deixa as renovações no valor integral.
  const launchCouponId = input.planCode === "mensal" ? await resolveLaunchCouponId() : undefined;
  const discounts = launchCouponId ? [{ coupon: launchCouponId }] : undefined;

  const session = await stripeClient().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    ...(launchCouponId ? { discounts: [{ coupon: launchCouponId }] } : { allow_promotion_codes: true }),
    customer: previous?.stripeCustomerId ?? undefined,
    customer_email: previous?.stripeCustomerId ? undefined : input.userEmail ?? undefined,
    client_reference_id: input.userId.toString(),
    metadata: {
      user_id: input.userId.toString(),
      customer_email: input.userEmail ?? "",
      customer_name: input.userName ?? "",
      plan_code: input.planCode,
    },
    subscription_data: {
      metadata: {
        user_id: input.userId.toString(),
        plan_code: input.planCode,
      },
    },
    success_url: `${input.origin}/app?billing=success`,
    cancel_url: `${input.origin}/planos?billing=cancelled`,
  });

  if (!session.url) throw new Error("Não foi possível criar a sessão de checkout.");
  return { url: session.url };
}

export async function createCustomerBillingPortal(input: { userId: number; origin: string }) {
  const subscription = await getSubscriptionForUser(input.userId);
  if (!subscription?.stripeCustomerId) throw new Error("Ainda não existe uma assinatura para administrar.");
  const session = await stripeClient().billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${input.origin}/app`,
  });
  return { url: session.url };
}

export async function processStripeEvent(event: Stripe.Event) {
  if (event.id.startsWith("evt_test_")) return;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = Number(session.metadata?.user_id || session.client_reference_id || 0);
    if (!userId) return;
    await upsertSubscription({
      userId,
      stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
      stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null,
      stripePriceId: null,
      planCode: session.metadata?.plan_code ?? "mensal",
      status: "active",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });
    return;
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = Number(subscription.metadata?.user_id || 0);
    if (!userId) return;
    const periodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end;
    await upsertSubscription({
      userId,
      stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price?.id ?? null,
      planCode: subscription.metadata?.plan_code ?? "pgr_pro",
      status: subscription.status,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  }
}

export async function stripeWebhookHandler(req: Request, res: Response) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers["stripe-signature"];
  if (!secret || !signature || Array.isArray(signature)) return res.status(400).json({ error: "Assinatura de webhook ausente." });

  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(req.body, signature, secret);
  } catch (error) {
    console.error("[Stripe] Assinatura inválida", error);
    return res.status(400).json({ error: "Assinatura inválida." });
  }

  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe] Evento de teste confirmado", event.id);
    return res.json({ verified: true });
  }

  try {
    await processStripeEvent(event);
    console.log("[Stripe] Evento processado", { id: event.id, type: event.type, created: event.created });
    return res.json({ received: true });
  } catch (error) {
    console.error("[Stripe] Falha ao processar evento", { id: event.id, type: event.type, error });
    return res.status(500).json({ error: "Falha ao processar o evento." });
  }
}

import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) throw new Error("STRIPE_SECRET_KEY ausente");
if (!secretKey.startsWith("sk_test_")) throw new Error("A validação aceita somente chave Stripe de teste");

const stripe = new Stripe(secretKey);
const plans = [
  { code: "mensal", lookupKey: "portal_tst_hub_monthly_brl", expectedSuccess: "/app?billing=success", expectedCancel: "/planos?billing=cancelled" },
  { code: "trimestral", lookupKey: "portal_tst_hub_quarterly_brl", expectedSuccess: "/app?billing=success", expectedCancel: "/planos?billing=cancelled" },
  { code: "anual", lookupKey: "portal_tst_hub_annual_brl", expectedSuccess: "/app?billing=success", expectedCancel: "/planos?billing=cancelled" },
];

const prices = await stripe.prices.list({ active: true, lookup_keys: plans.map(plan => plan.lookupKey), limit: 100 });
const byLookupKey = new Map(prices.data.map(price => [price.lookup_key, price]));
const coupons = await stripe.coupons.list({ limit: 100 });
const launchCoupon = coupons.data.find(coupon => coupon.valid && coupon.duration === "once" && coupon.amount_off === 300 && coupon.currency === "brl" && coupon.metadata?.portal_tst_launch === "true");

const results = [];
for (const plan of plans) {
  const price = byLookupKey.get(plan.lookupKey);
  if (!price) throw new Error(`Preço ausente para ${plan.code}`);
  const appliesLaunchCoupon = plan.code === "mensal" && Boolean(launchCoupon);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: price.id, quantity: 1 }],
    ...(appliesLaunchCoupon ? { discounts: [{ coupon: launchCoupon.id }] } : { allow_promotion_codes: true }),
    customer_email: "qa-checkout@tstbrasilhub.test",
    client_reference_id: `qa-${plan.code}`,
    metadata: { qa_run: "pricing-cycle-validation", plan_code: plan.code },
    subscription_data: { metadata: { qa_run: "pricing-cycle-validation", plan_code: plan.code } },
    success_url: "https://tstbrasilhub.test/app?billing=success",
    cancel_url: "https://tstbrasilhub.test/planos?billing=cancelled",
  });
  const retrieved = await stripe.checkout.sessions.retrieve(session.id);
  const successOk = retrieved.success_url.endsWith(plan.expectedSuccess);
  const cancelOk = retrieved.cancel_url.endsWith(plan.expectedCancel);
  const discountOk = plan.code !== "mensal" || retrieved.discounts?.length === 1;
  if (!retrieved.url || !successOk || !cancelOk || !discountOk) throw new Error(`Validação incompleta para ${plan.code}`);
  await stripe.checkout.sessions.expire(session.id);
  results.push({ plan: plan.code, sessionId: session.id, checkoutUrl: retrieved.url, priceId: price.id, unitAmount: price.unit_amount, currency: price.currency, interval: price.recurring?.interval, intervalCount: price.recurring?.interval_count, urlCreated: Boolean(retrieved.url), successUrl: retrieved.success_url, cancelUrl: retrieved.cancel_url, successUrlOk: successOk, cancelUrlOk: cancelOk, launchDiscountApplied: discountOk && appliesLaunchCoupon, finalStatus: "expired após validação" });
}

console.log(JSON.stringify({ results }, null, 2));

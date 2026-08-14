import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import StripeClient from "stripe";

const db = vi.hoisted(() => ({
  getSubscriptionForUser: vi.fn(),
  upsertSubscription: vi.fn(),
}));

vi.mock("./db", () => db);

import { processStripeEvent, stripeWebhookHandler } from "./stripe";

function createResponse() {
  const response = { status: vi.fn(), json: vi.fn() };
  response.status.mockReturnValue(response);
  return response;
}

describe("processStripeEvent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("persiste uma assinatura ativa após checkout concluído", async () => {
    const event = {
      id: "evt_checkout_123",
      type: "checkout.session.completed",
      data: { object: { metadata: { user_id: "12", plan_code: "mensal" }, customer: "cus_123", subscription: "sub_123" } },
    } as unknown as Stripe.Event;
    await processStripeEvent(event);
    expect(db.upsertSubscription).toHaveBeenCalledWith(expect.objectContaining({
      userId: 12,
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_123",
      planCode: "mensal",
      status: "active",
    }));
  });

  it("persiste cancelamento e período de vigência em evento de assinatura", async () => {
    const event = {
      id: "evt_subscription_123",
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_123", customer: "cus_123", metadata: { user_id: "12", plan_code: "trimestral" }, status: "canceled", current_period_end: 1_789_000_000, cancel_at_period_end: true, items: { data: [{ price: { id: "price_123" } }] } } },
    } as unknown as Stripe.Event;
    await processStripeEvent(event);
    expect(db.upsertSubscription).toHaveBeenCalledWith(expect.objectContaining({
      userId: 12,
      stripeSubscriptionId: "sub_123",
      stripePriceId: "price_123",
      planCode: "trimestral",
      status: "canceled",
      cancelAtPeriodEnd: true,
      currentPeriodEnd: new Date(1_789_000_000_000),
    }));
  });

  it("não persiste eventos internos de teste", async () => {
    const event = { id: "evt_test_manual", type: "checkout.session.completed", data: { object: {} } } as unknown as Stripe.Event;
    await processStripeEvent(event);
    expect(db.upsertSubscription).not.toHaveBeenCalled();
  });

  it("rejeita webhook sem assinatura", async () => {
    const response = createResponse();
    await stripeWebhookHandler({ headers: {}, body: Buffer.from("{}") } as never, response as never);
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({ error: "Assinatura de webhook ausente." });
  });

  it("valida payload assinado e processa evento de checkout", async () => {
    const previousSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const previousKey = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_local_test";
    process.env.STRIPE_SECRET_KEY = "sk_test_local_123";
    const payload = JSON.stringify({
      id: "evt_webhook_123",
      object: "event",
      type: "checkout.session.completed",
      data: { object: { metadata: { user_id: "12", plan_code: "mensal" }, customer: "cus_123", subscription: "sub_123" } },
    });
    const localStripe = new StripeClient(process.env.STRIPE_SECRET_KEY);
    const signature = localStripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET });
    const response = createResponse();
    await stripeWebhookHandler({ headers: { "stripe-signature": signature }, body: Buffer.from(payload) } as never, response as never);
    expect(db.upsertSubscription).toHaveBeenCalledWith(expect.objectContaining({ userId: 12, status: "active", planCode: "mensal" }));
    expect(response.json).toHaveBeenCalledWith({ received: true });
    process.env.STRIPE_WEBHOOK_SECRET = previousSecret;
    process.env.STRIPE_SECRET_KEY = previousKey;
  });
});

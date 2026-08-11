import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ getSubscriptionForUser: vi.fn(), upsertSubscription: vi.fn() }));
const stripe = vi.hoisted(() => ({
  priceList: vi.fn(),
  checkoutCreate: vi.fn(),
  portalCreate: vi.fn(),
}));

vi.mock("./db", () => db);
vi.mock("stripe", () => ({
  default: class StripeMock {
    prices = { list: stripe.priceList };
    checkout = { sessions: { create: stripe.checkoutCreate } };
    billingPortal = { sessions: { create: stripe.portalCreate } };
  },
}));

import { createCustomerBillingPortal, createSubscriptionCheckout } from "./stripe";

describe("checkout e portal de cobrança", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_local_123";
  });

  it("cria checkout recorrente com metadados e URLs de retorno corretos", async () => {
    db.getSubscriptionForUser.mockResolvedValue(undefined);
    stripe.priceList.mockResolvedValue({ data: [{ id: "price_autonomo" }] });
    stripe.checkoutCreate.mockResolvedValue({ url: "https://checkout.example/session" });
    await expect(createSubscriptionCheckout({ userId: 12, userEmail: "tst@example.com", userName: "TST", planCode: "autonomo", origin: "https://portal.example" })).resolves.toEqual({ url: "https://checkout.example/session" });
    expect(stripe.priceList).toHaveBeenCalledWith({ lookup_keys: ["portal_tst_autonomo_monthly_brl"], active: true, limit: 1 });
    expect(stripe.checkoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      mode: "subscription",
      line_items: [{ price: "price_autonomo", quantity: 1 }],
      client_reference_id: "12",
      metadata: expect.objectContaining({ user_id: "12", plan_code: "autonomo" }),
      success_url: "https://portal.example/app?billing=success",
      cancel_url: "https://portal.example/planos?billing=cancelled",
    }));
  });

  it("reutiliza o cliente existente e cria portal de gestão com retorno ao aplicativo", async () => {
    db.getSubscriptionForUser.mockResolvedValue({ stripeCustomerId: "cus_123" });
    stripe.priceList.mockResolvedValue({ data: [{ id: "price_empresa" }] });
    stripe.checkoutCreate.mockResolvedValue({ url: "https://checkout.example/session" });
    stripe.portalCreate.mockResolvedValue({ url: "https://billing.example/session" });
    await createSubscriptionCheckout({ userId: 12, planCode: "empresa", origin: "https://portal.example" });
    await expect(createCustomerBillingPortal({ userId: 12, origin: "https://portal.example" })).resolves.toEqual({ url: "https://billing.example/session" });
    expect(stripe.checkoutCreate).toHaveBeenCalledWith(expect.objectContaining({ customer: "cus_123", customer_email: undefined }));
    expect(stripe.portalCreate).toHaveBeenCalledWith({ customer: "cus_123", return_url: "https://portal.example/app" });
  });
});

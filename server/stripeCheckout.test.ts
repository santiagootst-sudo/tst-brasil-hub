import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ getSubscriptionForUser: vi.fn(), upsertSubscription: vi.fn() }));
const stripe = vi.hoisted(() => ({
  priceList: vi.fn(),
  couponList: vi.fn(),
  checkoutCreate: vi.fn(),
  portalCreate: vi.fn(),
}));

vi.mock("./db", () => db);
vi.mock("stripe", () => ({
  default: class StripeMock {
    prices = { list: stripe.priceList };
    coupons = { list: stripe.couponList };
    checkout = { sessions: { create: stripe.checkoutCreate } };
    billingPortal = { sessions: { create: stripe.portalCreate } };
  },
}));

import { createCustomerBillingPortal, createSubscriptionCheckout } from "./stripe";

describe("checkout e portal de cobrança", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_local_123";
    delete process.env.STRIPE_LAUNCH_COUPON_ID;
    stripe.couponList.mockResolvedValue({ data: [] });
  });

  it("cria checkout mensal recorrente com metadados e URLs corretos", async () => {
    db.getSubscriptionForUser.mockResolvedValue(undefined);
    stripe.priceList.mockResolvedValue({ data: [{ id: "price_monthly" }] });
    stripe.checkoutCreate.mockResolvedValue({ url: "https://checkout.example/session" });

    await expect(createSubscriptionCheckout({ userId: 12, userEmail: "tst@example.com", userName: "TST", planCode: "mensal", origin: "https://portal.example" })).resolves.toEqual({ url: "https://checkout.example/session" });

    expect(stripe.priceList).toHaveBeenCalledWith({ lookup_keys: ["portal_tst_hub_monthly_brl"], active: true, limit: 1 });
    expect(stripe.checkoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      mode: "subscription",
      line_items: [{ price: "price_monthly", quantity: 1 }],
      client_reference_id: "12",
      metadata: expect.objectContaining({ user_id: "12", plan_code: "mensal" }),
      success_url: "https://portal.example/app?billing=success",
      cancel_url: "https://portal.example/planos?billing=cancelled",
    }));
  });

  it("aplica o cupom de lançamento apenas ao checkout mensal quando encontrado", async () => {
    db.getSubscriptionForUser.mockResolvedValue(undefined);
    stripe.priceList.mockResolvedValue({ data: [{ id: "price_monthly" }] });
    stripe.couponList.mockResolvedValue({ data: [{ id: "coupon_launch", valid: true, duration: "once", amount_off: 300, currency: "brl", metadata: { portal_tst_launch: "true" } }] });
    stripe.checkoutCreate.mockResolvedValue({ url: "https://checkout.example/monthly-launch" });

    await createSubscriptionCheckout({ userId: 14, planCode: "mensal", origin: "https://portal.example" });

    expect(stripe.checkoutCreate).toHaveBeenCalledWith(expect.objectContaining({ discounts: [{ coupon: "coupon_launch" }] }));
    expect(stripe.checkoutCreate.mock.calls[0][0]).not.toHaveProperty("allow_promotion_codes");
  });

  it("resolve o preço trimestral pela lookup key correspondente", async () => {
    db.getSubscriptionForUser.mockResolvedValue(undefined);
    stripe.priceList.mockResolvedValue({ data: [{ id: "price_quarterly" }] });
    stripe.checkoutCreate.mockResolvedValue({ url: "https://checkout.example/quarterly" });

    await createSubscriptionCheckout({ userId: 15, planCode: "trimestral", origin: "https://portal.example" });

    expect(stripe.priceList).toHaveBeenCalledWith({ lookup_keys: ["portal_tst_hub_quarterly_brl"], active: true, limit: 1 });
    expect(stripe.checkoutCreate).toHaveBeenCalledWith(expect.objectContaining({ line_items: [{ price: "price_quarterly", quantity: 1 }], metadata: expect.objectContaining({ plan_code: "trimestral" }) }));
  });

  it("reutiliza o cliente existente e cria portal de gestão com retorno ao aplicativo", async () => {
    db.getSubscriptionForUser.mockResolvedValue({ stripeCustomerId: "cus_123" });
    stripe.priceList.mockResolvedValue({ data: [{ id: "price_annual" }] });
    stripe.checkoutCreate.mockResolvedValue({ url: "https://checkout.example/session" });
    stripe.portalCreate.mockResolvedValue({ url: "https://billing.example/session" });

    await createSubscriptionCheckout({ userId: 12, planCode: "anual", origin: "https://portal.example" });
    await expect(createCustomerBillingPortal({ userId: 12, origin: "https://portal.example" })).resolves.toEqual({ url: "https://billing.example/session" });

    expect(stripe.checkoutCreate).toHaveBeenCalledWith(expect.objectContaining({ customer: "cus_123", customer_email: undefined, line_items: [{ price: "price_annual", quantity: 1 }] }));
    expect(stripe.portalCreate).toHaveBeenCalledWith({ customer: "cus_123", return_url: "https://portal.example/app" });
  });
});

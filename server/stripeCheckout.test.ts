import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ getSubscriptionForUser: vi.fn(), upsertSubscription: vi.fn() }));
const stripe = vi.hoisted(() => ({
  constructedWith: vi.fn(),
  accountRetrieve: vi.fn(),
  priceList: vi.fn(),
  couponList: vi.fn(),
  checkoutCreate: vi.fn(),
  portalCreate: vi.fn(),
}));

vi.mock("./db", () => db);
vi.mock("stripe", () => ({
  default: class StripeMock {
    constructor(key: string) {
      stripe.constructedWith(key);
    }
    accounts = { retrieve: stripe.accountRetrieve };
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
    delete process.env.STRIPE_MODE;
    delete process.env.STRIPE_TEST_SECRET_KEY;
    delete process.env.STRIPE_LAUNCH_COUPON_ID;
    stripe.accountRetrieve.mockResolvedValue({ id: "acct_test_checkout" });
    stripe.couponList.mockResolvedValue({ data: [] });
  });

  it("cria checkout mensal recorrente com metadados e URLs corretos", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    db.getSubscriptionForUser.mockResolvedValue(undefined);
    stripe.priceList.mockResolvedValue({ data: [{ id: "price_monthly" }] });
    stripe.checkoutCreate.mockResolvedValue({ id: "cs_monthly", url: "https://checkout.example/session" });

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
    expect(info).toHaveBeenCalledWith("[Stripe] Sessão de checkout criada", expect.objectContaining({
      userId: 12,
      planCode: "mensal",
      priceId: "price_monthly",
      sessionId: "cs_monthly",
    }));
    info.mockRestore();
  });

  it("prioriza a chave segregada de teste quando STRIPE_MODE=test", async () => {
    process.env.STRIPE_MODE = "test";
    process.env.STRIPE_TEST_SECRET_KEY = "sk_test_segregated_456";
    db.getSubscriptionForUser.mockResolvedValue(undefined);
    stripe.priceList.mockResolvedValue({ data: [{ id: "price_monthly" }] });
    stripe.checkoutCreate.mockResolvedValue({ id: "cs_test_mode", url: "https://checkout.example/test-mode" });

    await createSubscriptionCheckout({ userId: 16, planCode: "mensal", origin: "https://portal.example" });

    expect(stripe.constructedWith).toHaveBeenCalledWith("sk_test_segregated_456");
  });

  it("registra a falha de checkout sem expor a credencial Stripe", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    db.getSubscriptionForUser.mockResolvedValue(undefined);
    stripe.priceList.mockResolvedValue({ data: [{ id: "price_annual" }] });
    stripe.checkoutCreate.mockRejectedValue(new Error("Preço inválido"));

    await expect(createSubscriptionCheckout({ userId: 88, planCode: "anual", origin: "https://portal.example" })).rejects.toThrow("Preço inválido");

    expect(error).toHaveBeenCalledWith("[Stripe] Falha ao criar checkout", expect.objectContaining({
      userId: 88,
      planCode: "anual",
      priceId: "price_annual",
      reason: "Preço inválido",
    }));
    expect(JSON.stringify(error.mock.calls)).not.toContain("sk_test_local_123");
    error.mockRestore();
  });

  it("registra a conta e a chave de consulta sem expor a credencial", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    db.getSubscriptionForUser.mockResolvedValue(undefined);
    stripe.priceList.mockResolvedValue({ data: [{ id: "price_monthly" }] });
    stripe.checkoutCreate.mockResolvedValue({ url: "https://checkout.example/session" });

    await createSubscriptionCheckout({ userId: 12, planCode: "mensal", origin: "https://portal.example" });

    expect(info).toHaveBeenCalledWith("[Stripe] Resolução de preço", expect.objectContaining({
      accountId: "acct_test_checkout",
      planCode: "mensal",
      lookupKey: "portal_tst_hub_monthly_brl",
      found: true,
    }));
    expect(JSON.stringify(info.mock.calls)).not.toContain("sk_test_local_123");
    info.mockRestore();
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

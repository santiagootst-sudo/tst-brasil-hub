import { describe, expect, it } from "vitest";
import { getSubscriptionPlan, subscriptionPlans } from "./products";

describe("subscription plans", () => {
  it("mantém três planos mensais com lookup keys distintos", () => {
    expect(subscriptionPlans).toHaveLength(3);
    expect(new Set(subscriptionPlans.map(plan => plan.lookupKey)).size).toBe(subscriptionPlans.length);
    expect(subscriptionPlans.every(plan => plan.lookupKey.startsWith("portal_tst_"))).toBe(true);
  });

  it("resolve planos válidos e rejeita códigos desconhecidos", () => {
    expect(getSubscriptionPlan("pgr_pro")?.name).toBe("PGR Pro");
    expect(getSubscriptionPlan("autonomo")?.featured).toBe(true);
    expect(getSubscriptionPlan("inexistente")).toBeUndefined();
  });
});

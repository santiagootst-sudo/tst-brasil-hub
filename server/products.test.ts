import { describe, expect, it } from "vitest";
import { getSubscriptionPlan, subscriptionPlans } from "./products";

describe("subscription plans", () => {
  it("mantém os três ciclos comerciais com lookup keys distintos", () => {
    expect(subscriptionPlans).toHaveLength(3);
    expect(subscriptionPlans.map(plan => plan.code)).toEqual(["mensal", "trimestral", "anual"]);
    expect(new Set(subscriptionPlans.map(plan => plan.lookupKey)).size).toBe(subscriptionPlans.length);
    expect(subscriptionPlans.every(plan => plan.lookupKey.startsWith("portal_tst_"))).toBe(true);
  });

  it("expõe a oferta de lançamento e as renovações corretas", () => {
    const monthly = getSubscriptionPlan("mensal");
    const quarterly = getSubscriptionPlan("trimestral");
    const annual = getSubscriptionPlan("anual");

    expect(monthly).toMatchObject({ promotionDisplayPrice: "R$ 69,90 no primeiro mês", recurringDisplayPrice: "R$ 99,90/mês", initialPriceCents: 6990, recurringPriceCents: 9990 });
    expect(quarterly).toMatchObject({ promotionDisplayPrice: "R$ 269,70 a cada 3 meses", recurringPriceCents: 26970 });
    expect(annual).toMatchObject({ promotionDisplayPrice: "R$ 898,80 por ano", recurringPriceCents: 89880 });
  });

  it("mantém compatibilidade de leitura com códigos antigos e rejeita códigos desconhecidos", () => {
    expect(getSubscriptionPlan("pgr_pro")?.code).toBe("mensal");
    expect(getSubscriptionPlan("autonomo")?.code).toBe("mensal");
    expect(getSubscriptionPlan("empresa")?.code).toBe("mensal");
    expect(getSubscriptionPlan("inexistente")).toBeUndefined();
  });
});

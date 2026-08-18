const legacyPlanAliases: Record<string, "mensal"> = {
  pgr_pro: "mensal",
  autonomo: "mensal",
  empresa: "mensal",
};

const useStripeTestMode = process.env.STRIPE_MODE?.trim().toLowerCase() === "test";

function stripePriceId(defaultVariable: string, testVariable: string) {
  if (useStripeTestMode) return process.env[testVariable] ?? process.env[defaultVariable] ?? "";
  return process.env[defaultVariable] ?? "";
}

export const subscriptionPlans = [
  {
    code: "mensal",
    name: "Plano Mensal",
    audience: "Flexibilidade para começar sem compromisso anual.",
    billingCycle: "mensal",
    displayPrice: "R$ 69,90 no primeiro mês",
    promotionDisplayPrice: "R$ 69,90 no primeiro mês",
    recurringDisplayPrice: "R$ 99,90/mês",
    initialPriceCents: 6990,
    recurringPriceCents: 9990,
    priceId: stripePriceId("STRIPE_PRICE_MONTHLY", "STRIPE_TEST_PRICE_MONTHLY"),
    lookupKey: process.env.STRIPE_LOOKUP_KEY_MONTHLY ?? "portal_tst_hub_monthly_brl",
    featured: false,
    features: ["Acesso completo ao Portal TST Brasil Hub", "Gerador de PGR e documentos legais", "Controle de EPIs, CIPA e Biblioteca", "Cancelamento pelo portal de cobrança"],
  },
  {
    code: "trimestral",
    name: "Plano Trimestral",
    audience: "Organização para uma rotina de SST com visão de três meses.",
    billingCycle: "trimestral",
    displayPrice: "R$ 269,70 a cada 3 meses",
    promotionDisplayPrice: "R$ 269,70 a cada 3 meses",
    recurringDisplayPrice: "R$ 269,70 a cada 3 meses",
    initialPriceCents: 26970,
    recurringPriceCents: 26970,
    priceId: stripePriceId("STRIPE_PRICE_QUARTERLY", "STRIPE_TEST_PRICE_QUARTERLY"),
    lookupKey: process.env.STRIPE_LOOKUP_KEY_QUARTERLY ?? "portal_tst_hub_quarterly_brl",
    featured: true,
    features: ["Todos os módulos do Portal TST Brasil Hub", "Cobrança única a cada três meses", "Previsibilidade para o ciclo operacional", "Biblioteca, treinamentos e certificados"],
  },
  {
    code: "anual",
    name: "Plano Anual",
    audience: "Continuidade para estruturar a gestão de SST durante todo o ano.",
    billingCycle: "anual",
    displayPrice: "R$ 898,80 por ano",
    promotionDisplayPrice: "R$ 898,80 por ano",
    recurringDisplayPrice: "R$ 898,80 por ano",
    initialPriceCents: 89880,
    recurringPriceCents: 89880,
    priceId: stripePriceId("STRIPE_PRICE_ANNUAL", "STRIPE_TEST_PRICE_ANNUAL"),
    lookupKey: process.env.STRIPE_LOOKUP_KEY_ANNUAL ?? "portal_tst_hub_annual_brl",
    featured: false,
    features: ["Todos os módulos do Portal TST Brasil Hub", "Cobrança única anual", "Continuidade sem reajuste após a promoção", "Prioridade para organizar documentos e rotinas"],
  },
] as const;

export type PlanCode = (typeof subscriptionPlans)[number]["code"];

export function getSubscriptionPlan(code: string) {
  const normalizedCode = legacyPlanAliases[code] ?? code;
  return subscriptionPlans.find(plan => plan.code === normalizedCode);
}

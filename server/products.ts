export const subscriptionPlans = [
  {
    code: "pgr_pro",
    name: "PGR Pro",
    audience: "Para começar pelo Gerador de PGR",
    displayPrice: "R$ 79,90",
    priceId: process.env.STRIPE_PRICE_PGR_PRO ?? "",
    lookupKey: "portal_tst_pgr_pro_monthly_brl",
    featured: false,
    features: ["Gerador de PGR", "Inventário de riscos", "Exportação de documentos", "Biblioteca essencial"],
  },
  {
    code: "autonomo",
    name: "TST Brasil Hub Pro (Lançamento)",
    audience: "Para técnicos e empresas de SST com acesso completo",
    displayPrice: "R$ 69,90 no 1º mês (depois R$ 99,90/mês)",
    priceId: process.env.STRIPE_PRICE_AUTONOMO ?? "",
    lookupKey: "portal_tst_autonomo_monthly_brl",
    featured: true,
    features: ["Acesso completo a todos os módulos", "Gerador de PGR, EPIs, CIPA e Biblioteca", "R$ 69,90 no primeiro mês", "Renovação automática por R$ 99,90/mês"],
  },
] as const;

export type PlanCode = (typeof subscriptionPlans)[number]["code"];

export function getSubscriptionPlan(code: string) {
  return subscriptionPlans.find(plan => plan.code === code);
}

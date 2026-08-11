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
    name: "TST Autônomo",
    audience: "Para prestar serviços e gerir clientes",
    displayPrice: "R$ 149,90",
    priceId: process.env.STRIPE_PRICE_AUTONOMO ?? "",
    lookupKey: "portal_tst_autonomo_monthly_brl",
    featured: true,
    features: ["Tudo do PGR Pro", "Ambientes de clientes", "PGR por empresa", "Materiais e modelos SST"],
  },
  {
    code: "empresa",
    name: "TST Empresa",
    audience: "Para a operação interna do TST CLT",
    displayPrice: "R$ 249,90",
    priceId: process.env.STRIPE_PRICE_EMPRESA ?? "",
    lookupKey: "portal_tst_empresa_monthly_brl",
    featured: false,
    features: ["Tudo do PGR Pro", "Ambiente CLT", "Equipe e treinamentos", "Indicadores e alertas"],
  },
] as const;

export type PlanCode = (typeof subscriptionPlans)[number]["code"];

export function getSubscriptionPlan(code: string) {
  return subscriptionPlans.find(plan => plan.code === code);
}

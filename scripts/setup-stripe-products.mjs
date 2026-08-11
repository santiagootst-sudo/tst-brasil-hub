import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY não está disponível neste ambiente.");
}

const stripe = new Stripe(secretKey);
const plans = [
  { lookupKey: "portal_tst_pgr_pro_monthly_brl", name: "Portal TST — PGR Pro", amount: 7990, description: "Gerador de PGR, inventário de riscos e exportação de documentos." },
  { lookupKey: "portal_tst_autonomo_monthly_brl", name: "Portal TST — TST Autônomo", amount: 14990, description: "Gestão de clientes, empresas e PGRs para TST prestador de serviços." },
  { lookupKey: "portal_tst_empresa_monthly_brl", name: "Portal TST — TST Empresa", amount: 24990, description: "Gestão SST interna para o profissional TST CLT." },
];

for (const plan of plans) {
  const existing = await stripe.prices.list({ lookup_keys: [plan.lookupKey], active: true, limit: 1 });
  if (existing.data[0]) {
    console.log(JSON.stringify({ lookupKey: plan.lookupKey, priceId: existing.data[0].id, reused: true }));
    continue;
  }

  const product = await stripe.products.create({ name: plan.name, description: plan.description, metadata: { portal: "tst_brasil" } });
  const price = await stripe.prices.create({
    product: product.id,
    currency: "brl",
    unit_amount: plan.amount,
    recurring: { interval: "month" },
    lookup_key: plan.lookupKey,
    metadata: { portal: "tst_brasil" },
  });
  console.log(JSON.stringify({ lookupKey: plan.lookupKey, priceId: price.id, productId: product.id, reused: false }));
}

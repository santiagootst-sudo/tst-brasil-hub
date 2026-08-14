import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error("STRIPE_SECRET_KEY ausente");
  process.exit(2);
}
if (!secretKey.startsWith("sk_test_")) {
  console.error("A configuração foi interrompida: este script aceita apenas uma chave Stripe de teste.");
  process.exit(3);
}

const stripe = new Stripe(secretKey);
const lookupKeys = {
  mensal: "portal_tst_hub_monthly_brl",
  trimestral: "portal_tst_hub_quarterly_brl",
  anual: "portal_tst_hub_annual_brl",
};

const priceDefinitions = [
  { code: "mensal", lookupKey: lookupKeys.mensal, unitAmount: 9990, interval: "month", intervalCount: 1 },
  { code: "trimestral", lookupKey: lookupKeys.trimestral, unitAmount: 26970, interval: "month", intervalCount: 3 },
  { code: "anual", lookupKey: lookupKeys.anual, unitAmount: 89880, interval: "year", intervalCount: 1 },
];

const existingProducts = await stripe.products.list({ active: true, limit: 100 });
let product = existingProducts.data.find(item => item.metadata?.portal_tst_billing_product === "true");
if (!product) {
  product = await stripe.products.create({
    name: "TST Brasil Hub",
    description: "Assinatura de acesso ao ecossistema TST Brasil Hub",
    metadata: { portal_tst_billing_product: "true" },
  });
}

const existingPrices = await stripe.prices.list({ active: true, limit: 100 });
const configuredPrices = {};
for (const definition of priceDefinitions) {
  let price = existingPrices.data.find(item => item.lookup_key === definition.lookupKey);
  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      currency: "brl",
      unit_amount: definition.unitAmount,
      recurring: { interval: definition.interval, interval_count: definition.intervalCount },
      lookup_key: definition.lookupKey,
      metadata: { portal_tst_plan_code: definition.code },
    });
  }
  configuredPrices[definition.code] = { id: price.id, lookupKey: price.lookup_key, unitAmount: price.unit_amount, interval: price.recurring?.interval, intervalCount: price.recurring?.interval_count };
}

const coupons = await stripe.coupons.list({ limit: 100 });
let launchCoupon = coupons.data.find(coupon => coupon.valid && coupon.duration === "once" && coupon.amount_off === 300 && coupon.currency === "brl" && coupon.metadata?.portal_tst_launch === "true");
if (!launchCoupon) {
  launchCoupon = await stripe.coupons.create({
    name: "TST Brasil Hub — primeiro mês",
    amount_off: 300,
    currency: "brl",
    duration: "once",
    metadata: { portal_tst_launch: "true", portal_tst_offer: "6990_to_9990" },
  });
}

console.log(JSON.stringify({ product: { id: product.id, name: product.name }, prices: configuredPrices, launchCoupon: { id: launchCoupon.id, amountOff: launchCoupon.amount_off, duration: launchCoupon.duration } }, null, 2));

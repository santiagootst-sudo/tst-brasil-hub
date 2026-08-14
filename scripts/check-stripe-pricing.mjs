import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error("STRIPE_SECRET_KEY ausente");
  process.exit(2);
}

const stripe = new Stripe(secretKey);
const prices = await stripe.prices.list({ active: true, limit: 100, expand: ["data.product"] });
const expected = new Set([
  "portal_tst_hub_monthly_brl",
  "portal_tst_hub_quarterly_brl",
  "portal_tst_hub_annual_brl",
]);
const matches = prices.data
  .filter(price => price.lookup_key && expected.has(price.lookup_key))
  .map(price => ({
    id: price.id,
    lookupKey: price.lookup_key,
    unitAmount: price.unit_amount,
    currency: price.currency,
    interval: price.recurring?.interval,
    intervalCount: price.recurring?.interval_count,
    active: price.active,
  }));
console.log(JSON.stringify({ matches }, null, 2));

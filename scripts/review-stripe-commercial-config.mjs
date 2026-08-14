import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) throw new Error("STRIPE_SECRET_KEY ausente");
if (!secretKey.startsWith("sk_test_")) throw new Error("A revisão aceita somente chave Stripe de teste");

const stripe = new Stripe(secretKey);
const lookupKeys = ["portal_tst_hub_monthly_brl", "portal_tst_hub_quarterly_brl", "portal_tst_hub_annual_brl"];
const [products, prices, account] = await Promise.all([
  stripe.products.list({ active: true, limit: 100 }),
  stripe.prices.list({ active: true, lookup_keys: lookupKeys, limit: 100 }),
  stripe.accounts.retrieve(),
]);
let taxSettings = null;
let taxReviewNote = "";
try {
  taxSettings = await stripe.tax.settings.retrieve();
} catch (error) {
  taxReviewNote = error instanceof Error ? error.message : "Stripe Tax indisponível para consulta";
}
const product = products.data.find(item => item.metadata?.portal_tst_billing_product === "true");
const accountSettings = account.settings ?? {};
const paymentsSettings = accountSettings.payments ?? {};
const cardSettings = accountSettings.card_payments ?? {};

console.log(JSON.stringify({
  product: product ? { id: product.id, name: product.name, description: product.description, active: product.active, statementDescriptor: product.metadata?.statement_descriptor ?? null } : null,
  prices: prices.data.map(price => ({ lookupKey: price.lookup_key, id: price.id, unitAmount: price.unit_amount, currency: price.currency, recurring: price.recurring ? { interval: price.recurring.interval, intervalCount: price.recurring.interval_count } : null, active: price.active })),
  account: { id: account.id, country: account.country, defaultCurrency: account.default_currency, businessProfile: account.business_profile ? { name: account.business_profile.name, url: account.business_profile.url, supportEmail: account.business_profile.support_email, supportPhone: account.business_profile.support_phone } : null, statementDescriptor: paymentsSettings.statement_descriptor ?? null, statementDescriptorPrefix: cardSettings.statement_descriptor_prefix ?? null },
  tax: taxSettings ? { status: taxSettings.status, active: taxSettings.active, defaults: taxSettings.defaults ?? null, headOffice: taxSettings.head_office ?? null, note: taxReviewNote } : { available: false, note: taxReviewNote },
  review: {
    commercialTextsPresent: Boolean(product?.name && product?.description),
    allPricesPresent: prices.data.length === 3,
    receiptDescriptorPresent: Boolean(paymentsSettings.statement_descriptor || cardSettings.statement_descriptor_prefix),
    taxConfigurationPresent: Boolean(taxSettings?.active && taxSettings.defaults?.tax_code),
    taxReviewNote,
  },
}, null, 2));

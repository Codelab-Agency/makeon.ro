export function cmsConfigured() {
  return Boolean(
    process.env.DATABASE_URL && (process.env.PAYLOAD_SECRET?.length ?? 0) >= 32,
  );
}

/** Fail closed unless payments, signed webhooks and an explicit shipping amount are configured. */
export function checkoutConfigured() {
  return (
    cmsConfigured() &&
    Boolean(
      process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      process.env.APP_URL,
    ) &&
    /^\d+$/.test(process.env.SHIPPING_PRICE_BANI ?? "")
  );
}

export function requireCMS() {
  if (!cmsConfigured())
    throw new Error(
      "Configure DATABASE_URL and PAYLOAD_SECRET before starting commerce.",
    );
}

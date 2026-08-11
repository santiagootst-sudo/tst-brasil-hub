export const activeSubscriptionStatuses = new Set(["active", "trialing"]);

export function canUsePaidApps(input: { userRole?: string | null; subscriptionStatus?: string | null }) {
  if (input.userRole === "admin") return true;
  return Boolean(input.subscriptionStatus && activeSubscriptionStatuses.has(input.subscriptionStatus));
}

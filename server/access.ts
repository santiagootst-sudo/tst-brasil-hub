export const activeSubscriptionStatuses = new Set(["active", "trialing"]);

export type AdministrativeAccessInput = {
  userRole?: string | null;
  accessStatus?: string | null;
  accessExpiresAt?: Date | null;
  now?: Date;
};

export function hasAdministrativeAccess(input: AdministrativeAccessInput) {
  if (input.userRole === "admin") return true;
  if (input.accessStatus === "suspended") return false;
  if (input.accessExpiresAt && input.accessExpiresAt.getTime() <= (input.now ?? new Date()).getTime()) return false;
  return true;
}

export function canUsePaidApps(input: AdministrativeAccessInput & { subscriptionStatus?: string | null }) {
  if (!hasAdministrativeAccess(input)) return false;
  if (input.userRole === "admin") return true;
  return Boolean(input.subscriptionStatus && activeSubscriptionStatuses.has(input.subscriptionStatus));
}

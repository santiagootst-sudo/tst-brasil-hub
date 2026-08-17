export type PortalAccessAction =
  | { kind: "route"; href: string }
  | { kind: "login" };

export type PlanSelectionAction =
  | { kind: "checkout" }
  | { kind: "login" }
  | { kind: "contact"; href: string };

export function getPortalAccessAction(isAuthenticated: boolean, oauthConfigured: boolean): PortalAccessAction {
  if (isAuthenticated) return { kind: "route", href: "/app" };
  if (oauthConfigured) return { kind: "login" };
  return { kind: "route", href: "/app" };
}

export function getPlanSelectionAction(
  isAuthenticated: boolean,
  oauthConfigured: boolean,
  planCode: string,
): PlanSelectionAction {
  if (isAuthenticated) return { kind: "checkout" };
  if (oauthConfigured) return { kind: "login" };
  return { kind: "login" };
}

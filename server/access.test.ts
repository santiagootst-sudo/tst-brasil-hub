import { describe, expect, it } from "vitest";
import { canUsePaidApps } from "./access";

describe("canUsePaidApps", () => {
  it("permite o administrador mesmo sem assinatura", () => {
    expect(canUsePaidApps({ userRole: "admin", subscriptionStatus: null })).toBe(true);
  });

  it("permite assinaturas ativas e em período de teste", () => {
    expect(canUsePaidApps({ userRole: "user", subscriptionStatus: "active" })).toBe(true);
    expect(canUsePaidApps({ userRole: "user", subscriptionStatus: "trialing" })).toBe(true);
  });

  it("bloqueia estados de cobrança sem acesso", () => {
    expect(canUsePaidApps({ userRole: "user", subscriptionStatus: "past_due" })).toBe(false);
    expect(canUsePaidApps({ userRole: "user", subscriptionStatus: "canceled" })).toBe(false);
  });
});

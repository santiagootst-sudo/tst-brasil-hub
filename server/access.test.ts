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

  it("bloqueia suspensão e validade expirada antes da assinatura", () => {
    const now = new Date("2026-08-12T00:00:00.000Z");
    expect(canUsePaidApps({ userRole: "user", accessStatus: "suspended", subscriptionStatus: "active", now })).toBe(false);
    expect(canUsePaidApps({ userRole: "user", accessExpiresAt: new Date("2026-08-11T23:59:59.000Z"), subscriptionStatus: "active", now })).toBe(false);
    expect(canUsePaidApps({ userRole: "user", accessExpiresAt: new Date("2026-09-11T23:59:59.000Z"), subscriptionStatus: null, now })).toBe(true);
    expect(canUsePaidApps({ userRole: "admin", accessStatus: "suspended", subscriptionStatus: null, now })).toBe(true);
  });
});

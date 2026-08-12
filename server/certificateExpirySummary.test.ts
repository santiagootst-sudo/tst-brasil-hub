import { describe, expect, it } from "vitest";
import { certificateExpirySummary } from "../client/src/lib/certificateExpirySummary";

describe("certificateExpirySummary", () => {
  const reference = new Date("2026-08-12T12:00:00.000Z");

  it("consolida apenas os certificados válidos da empresa e classifica vencidos e próximos", () => {
    const summary = certificateExpirySummary([
      { companyId: 1, expiresAt: new Date("2026-08-10T12:00:00.000Z") },
      { companyId: 1, expiresAt: new Date("2026-08-30T12:00:00.000Z") },
      { companyId: 1, expiresAt: new Date("2026-10-20T12:00:00.000Z") },
      { companyId: 2, expiresAt: new Date("2026-08-20T12:00:00.000Z") },
      { companyId: 1, expiresAt: null },
    ], 1, reference);
    expect(summary).toEqual({ total: 3, expired: 1, expiring: 1 });
  });
});

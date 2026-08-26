import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createPgrGheInput, importPgrGhesInput } from "@shared/contracts/portal";
import { normalizePgrGheKey } from "./db";

describe("PGR GHE migration", () => {
  it("normalizes whitespace, unicode composition, and case for deduplication", () => {
    expect(normalizePgrGheKey("  GHE Operacional / Produção  ")).toBe("ghe operacional / produção");
    expect(normalizePgrGheKey("GHE  Operacional / Produção")).toBe("ghe operacional / produção");
  });

  it("accepts a valid AI GHE payload", () => {
    const result = createPgrGheInput.safeParse({
      workspaceId: 30001,
      projectId: 30001,
      name: "GHE Operacional / Produção",
      description: "Atividades produtivas.",
      suggestedHazards: ["Ruído"],
      suggestedMeasures: ["Uso de EPI"],
      employeeCount: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an oversized local import", () => {
    const result = importPgrGhesInput.safeParse({
      workspaceId: 30001,
      projectId: 30001,
      ghes: Array.from({ length: 501 }, (_, index) => ({ name: `GHE ${index}` })),
    });
    expect(result.success).toBe(false);
  });

  it("mantém o script SQL aditivo e idempotente", () => {
    const migration = readFileSync(new URL("../scripts/migrate-pgr-ghes.ts", import.meta.url), "utf8");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS pgr_ghe_groups");
    expect(migration).toContain("UNIQUE KEY pgr_ghe_project_dedupe_unique");
    expect(migration).not.toMatch(/\\b(DROP|TRUNCATE|DELETE)\\b/i);
  });
});

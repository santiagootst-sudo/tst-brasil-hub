import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const layoutSource = readFileSync(new URL("../client/src/components/DashboardLayout.tsx", import.meta.url), "utf8");
const chartsSource = readFileSync(new URL("../client/src/components/DashboardCharts.tsx", import.meta.url), "utf8");

describe("dashboard interaction contracts", () => {
  it("exposes a quick profile switch and clears the remembered profile before returning to the picker", () => {
    expect(layoutSource).toContain("Trocar perfil");
    expect(layoutSource).toContain("clearRememberedProfile(window.localStorage)");
    expect(layoutSource).toContain("setLocation(\"/app\")");
  });

  it("keeps the dashboard pulse based on real execution and alert aggregates", () => {
    expect(chartsSource).toContain("Pulso do ambiente");
    expect(chartsSource).toContain("safeCompletionRate(completedExecution, totalExecution)");
    expect(chartsSource).toContain("const alertTotal = totalOf(alertData)");
    expect(chartsSource).toContain("RadialBarChart");
  });
});

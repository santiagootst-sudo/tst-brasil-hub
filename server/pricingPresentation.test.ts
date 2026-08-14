import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pricingPage = readFileSync(resolve(process.cwd(), "client/src/pages/Pricing.tsx"), "utf8");
const globalStyles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

describe("destaque comercial do plano anual", () => {
  it("exibe equivalente mensal e economia no card anual", () => {
    expect(pricingPage).toContain("Equivale a R$ 74,90/mês — economia de R$ 25,00 por mês");
    expect(pricingPage).toContain("pricing-badge-pulse");
    expect(pricingPage).toContain("Melhor Opção");
  });

  it("desativa o pulso quando o usuário prefere movimento reduzido", () => {
    expect(globalStyles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(globalStyles).toContain(".pricing-badge-pulse");
    expect(globalStyles).toContain("animation: none;");
  });
});

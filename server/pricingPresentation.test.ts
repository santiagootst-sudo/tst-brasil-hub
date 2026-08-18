import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pricingPage = readFileSync(resolve(process.cwd(), "client/src/pages/Pricing.tsx"), "utf8");
const globalStyles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

describe("destaque comercial do plano anual", () => {
  it("exibe investimento mensal e economia anual no card anual", () => {
    expect(pricingPage).toContain('monthly: "R$ 74,90"');
    expect(pricingPage).toContain("Economize R$ 300 no ano versus o mensal");
    expect(pricingPage).toContain("pricing-badge-pulse");
    expect(pricingPage).toContain("Melhor opção");
  });

  it("desativa o pulso quando o usuário prefere movimento reduzido", () => {
    expect(globalStyles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(globalStyles).toContain(".pricing-badge-pulse");
    expect(globalStyles).toContain("animation: none;");
  });

  it("preserva os valores e encaminha a escolha de cada ciclo ao WhatsApp", () => {
    expect(pricingPage).toContain('const whatsappNumber = "5554999097610"');
    expect(pricingPage).toContain('mensal: "R$ 69,90 no primeiro mês e R$ 99,90/mês após a oferta"');
    expect(pricingPage).toContain('trimestral: "R$ 269,70 a cada 3 meses"');
    expect(pricingPage).toContain('anual: "R$ 898,80 por ano"');
    expect(pricingPage).toContain("https://wa.me/${whatsappNumber}");
    expect(pricingPage).toContain("Quero o plano");
  });
});

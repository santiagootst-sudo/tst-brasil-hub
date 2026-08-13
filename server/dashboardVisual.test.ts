import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/pages/WorkspaceOverview.tsx"), "utf8");
const chartsSource = readFileSync(resolve(process.cwd(), "client/src/components/DashboardCharts.tsx"), "utf8");

describe("direção visual do dashboard", () => {
  it("usa superfícies claras distintas para os contextos", () => {
    expect(source).toContain('color: "bg-gradient-to-br from-[#effbf7] via-white to-[#dff5ee] border-[#cfe7df]"');
    expect(source).toContain('color: "bg-gradient-to-br from-[#f3f8fd] via-white to-[#e1effb] border-[#d3e4f0]"');
  });

  it("mantém contraste explícito no título e nos indicadores", () => {
    expect(source).toContain("text-[#173b43]");
    expect(source).toContain("text-[#668087]");
    expect(source).toContain("bg-white/55");
  });

  it("evita a superfície tracejada no estado vazio principal", () => {
    expect(source).toContain("Escolha o ambiente para começar.");
    expect(source).not.toContain("border-dashed border-[#bddbd5]");
  });

  it("mantém o Controle de EPIs explícito no contexto Empresa", () => {
    expect(source).toContain('title: "Controle de EPIs"');
    expect(source).toContain('text: "Estoque, CA, fichas de entrega e validade"');
    expect(chartsSource).toContain('title="Central de Pendências"');
    expect(chartsSource).toContain('Prioridade operacional');
  });
});

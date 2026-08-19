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

  it("estrutura o resumo CLT como Centro de Comando com decisões acionáveis", () => {
    expect(source).toContain('if (!isAutonomo && activeDashboard === "resumo")');
    expect(source).toContain("Prioridades de hoje");
    expect(source).toContain("Ações em aberto");
    expect(source).toContain("Execução do período");
    expect(source).toContain("Atividade recente");
    expect(source).toContain("Resolver agora");
  });

  it("estrutura o resumo Prestador como uma carteira operacional ampla e orientada por dados reais", () => {
    expect(source).toContain('if (isAutonomo && activeDashboard === "resumo")');
    expect(source).toContain('max-w-[1600px]');
    expect(source).toContain("Visão da carteira");
    expect(source).toContain("Comando da carteira");
    expect(source).toContain("Prioridades de hoje");
    expect(source).toContain("Linha do tempo da carteira");
    expect(source).toContain("Documentação em dia para o período selecionado.");
  });

  it("não inventa agenda comercial e usa visitas, retornos e projetos PGR vinculados", () => {
    expect(source).toContain("const nextVisit");
    expect(source).toContain("const nextFollowUp");
    expect(source).toContain("const nextPgrProject");
    expect(source).toContain("companiesById");
    expect(source).toContain("Nenhuma visita agendada");
    expect(source).toContain("Nenhum retorno programado");
  });

  it("mantém o mesmo shell visual ao alternar entre as abas do Prestador", () => {
    expect(source).toContain("function PrestadorDashboardShell");
    expect(source).toContain('activeDashboard === "cipa"');
    expect(source).toContain('activeDashboard === "epis"');
    expect(source).toContain('activeDashboard === "inspecoes"');
    expect(source).toContain('activeDashboard === "documentos"');
    expect(source).toContain("Seções do dashboard Prestador");
    expect(source).toContain("border-b-[3px]");
  });
});

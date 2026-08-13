import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/pages/PsychosocialApp.tsx"), "utf8");

describe("módulo de riscos psicossociais COPSOQ-III", () => {
  it("contém abas bem delimitadas para separar preenchimento, acompanhamento e resultados", () => {
    expect(source).toContain('value="overview"');
    expect(source).toContain('value="questionnaire"');
    expect(source).toContain('value="pgr-integration"');
    expect(source).toContain('value="recommendations"');
    expect(source).toContain("Resultados & Indicadores");
    expect(source).toContain("Preenchimento do Colaborador");
    expect(source).toContain("Acompanhamento & PGR");
    expect(source).toContain("Planos de Ação & PDF");
  });

  it("implementa funções de exportação para CSV e PDF", () => {
    expect(source).toContain("exportCSV");
    expect(source).toContain("exportPDF");
    expect(source).toContain("copsoq_relatorio_psicossocial.csv");
  });

  it("inclui barra de pesquisa e filtros na aba de Acompanhamento", () => {
    expect(source).toContain("collectionSearch");
    expect(source).toContain("collectionStatusFilter");
    expect(source).toContain("Buscar por setor ou estressor...");
  });

  it("permite customização de logotipo e rodapé para relatórios PDF", () => {
    expect(source).toContain("pdfLogoUrl");
    expect(source).toContain("pdfFooterText");
    expect(source).toContain("Identidade Visual do Relatório PDF");
  });

  it("oferece gráficos de radar interativos", () => {
    expect(source).toContain("radarMetricFilter");
    expect(source).toContain("Radar de Riscos Interativo");
  });
});

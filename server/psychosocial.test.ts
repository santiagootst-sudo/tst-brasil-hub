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
});

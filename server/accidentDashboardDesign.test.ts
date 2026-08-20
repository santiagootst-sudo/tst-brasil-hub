import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const accidentsPage = readFileSync(resolve(process.cwd(), "client/src/pages/Accidents.tsx"), "utf8");

describe("dashboard de Acidentes e Lesões", () => {
  it("organiza o módulo em painel analítico branco com abas de trabalho", () => {
    expect(accidentsPage).toContain('bg-[#f7f9fc]');
    expect(accidentsPage).toContain('bg-white');
    expect(accidentsPage).toContain('bg-[#0d4d87]');
    expect(accidentsPage).toContain('label: "Painel"');
    expect(accidentsPage).toContain('label: "Nova ocorrência"');
    expect(accidentsPage).toContain('label: "Lesões e mapa corporal"');
    expect(accidentsPage).toContain('label: "Histórico"');
    expect(accidentsPage).toContain('label: "Indicadores"');
  });

  it("mantém indicadores, mapa corporal e cadastro funcional no novo desenho", () => {
    expect(accidentsPage).toContain('Acidentes por setor');
    expect(accidentsPage).toContain('Acidentes por mês');
    expect(accidentsPage).toContain('Classificação por impacto');
    expect(accidentsPage).toContain('AccidentBodyMapSummary');
    expect(accidentsPage).toContain('AnatomicalBodyMap');
    expect(accidentsPage).toContain('Salvar ocorrência');
    expect(accidentsPage).toContain('createAccident.mutate');
  });
});

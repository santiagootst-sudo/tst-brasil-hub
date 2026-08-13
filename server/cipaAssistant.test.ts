import { describe, expect, it } from "vitest";
import { buildCipaDocuments, emptyCipaForm, suggestCipaComposition, validateCipaForm } from "../client/src/lib/cipaAssistant";

describe("Assistant CIPA", () => {
  it("indica revisão de enquadramento para empresas com menos de 20 empregados", () => {
    const result = suggestCipaComposition(3, 19);
    expect(result.obrigatoria).toBe(false);
    expect(result.titularesEmpregados).toBe(0);
    expect(result.mensagem).toContain("menos de 20");
  });

  it("sugere composição inicial por faixa de empregados e grau de risco", () => {
    const result = suggestCipaComposition(3, 85);
    expect(result.obrigatoria).toBe(true);
    expect(result.titularesEmpregador).toBe(1);
    expect(result.suplentesEmpregador).toBe(1);
    expect(result.titularesEmpregados).toBe(1);
    expect(result.suplentesEmpregados).toBe(1);
  });

  it("gera pacote de documentos sem salvar dados fictícios", () => {
    const data = {
      ...emptyCipaForm,
      empresa: "Empresa de Homologação",
      cnpj: "00.000.000/0001-00",
      cidade: "Curitiba/PR",
      empregados: 24,
      dataInicioInscricao: "2026-09-01",
      dataVotacao: "2026-09-15",
      localVotacao: "Auditório",
      representanteLegal: "Responsável Legal",
      titularesEmpregador: 1,
      titularesEmpregados: 1,
    };
    const documents = buildCipaDocuments(data);
    expect(documents).toHaveLength(8);
    expect(documents.map(document => document.id)).toContain("edital-convocacao");
    expect(documents.find(document => document.id === "edital-convocacao")?.content).toContain("15/09/2026");
  });

  it("valida dados mínimos do processo antes da geração", () => {
    expect(validateCipaForm(emptyCipaForm)).toEqual([
      "Informe o nome da empresa.",
      "Informe a cidade/UF para assinatura dos documentos.",
      "Informe as datas de inscrição e votação.",
    ]);
  });
});

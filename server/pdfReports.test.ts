import { describe, expect, it } from "vitest";
import { buildInspectionReportPdf, buildPgrReportPdf, safeFileName } from "../client/src/lib/pdfReports";

describe("relatórios PDF do Portal TST", () => {
  it("gera um arquivo PDF de PGR com uma página e identificação do projeto", () => {
    const pdf = buildPgrReportPdf({ workspaceName: "Ambiente Autônomo", companyName: "Empresa Alfa", projectName: "PGR Unidade Centro", projectId: 42, generatedAt: new Date("2026-08-12T12:00:00Z") });
    const buffer = pdf.output("arraybuffer");
    expect(buffer.byteLength).toBeGreaterThan(1000);
    expect(pdf.getNumberOfPages()).toBe(1);
  });

  it("gera relatório de inspeções com inspeções e ações reais", () => {
    const pdf = buildInspectionReportPdf({
      workspaceName: "Operação CLT",
      companyName: "Empresa Beta",
      inspections: [{ title: "Verificação de máquinas", status: "planned", dueAt: new Date("2026-09-01T12:00:00Z"), notes: "Revisar proteções." }],
      actionItems: [{ title: "Ajustar sinalização", status: "in_progress", dueAt: new Date("2026-09-05T12:00:00Z"), description: "Registrar evidência após a correção." }],
    });
    const buffer = pdf.output("arraybuffer");
    expect(buffer.byteLength).toBeGreaterThan(1000);
    expect(pdf.getNumberOfPages()).toBe(1);
  });

  it("normaliza nomes de arquivo sem acentos ou caracteres inválidos", () => {
    expect(safeFileName("Inspeção — Área 01")).toBe("inspecao-area-01");
    expect(safeFileName("  ")).toBe("relatorio-sst");
  });
});

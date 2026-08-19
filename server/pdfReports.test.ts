import { describe, expect, it } from "vitest";
import { buildInspectionReportPdf, buildPgrReportPdf, preparePgrPdfWithEmbeddedAttachments, safeFileName } from "../client/src/lib/pdfReports";

describe("relatórios PDF do Portal TST", () => {
  it("gera um arquivo PDF de PGR profissional com capa, sumário, matriz e plano de ação", () => {
    const pdf = buildPgrReportPdf({ workspaceName: "Ambiente Autônomo", companyName: "Empresa Alfa", projectName: "PGR Unidade Centro", projectId: 42, generatedAt: new Date("2026-08-12T12:00:00Z") });
    const buffer = pdf.output("arraybuffer");
    expect(buffer.byteLength).toBeGreaterThan(1000);
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(2);
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

  it("incorpora laudo ou certificado disponível como anexo de arquivo no PDF do PGR", async () => {
    const pdf = buildPgrReportPdf({ workspaceName: "Ambiente Autônomo", companyName: "Empresa Alfa", projectName: "PGR Unidade Centro", projectId: 42 });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52]), { headers: { "content-type": "application/pdf" } });
    try {
      const prepared = await preparePgrPdfWithEmbeddedAttachments(pdf, {
        workspaceName: "Ambiente Autônomo",
        companyName: "Empresa Alfa",
        projectName: "PGR Unidade Centro",
        projectId: 42,
        attachments: [{ title: "Certificado de calibração", category: "certificate", fileUrl: "https://files.example.com/calibracao.pdf" }],
      });
      expect(prepared.embedded).toBe(1);
      expect(prepared.unavailable).toBe(0);
      expect(prepared.bytes.byteLength).toBeGreaterThan(1000);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

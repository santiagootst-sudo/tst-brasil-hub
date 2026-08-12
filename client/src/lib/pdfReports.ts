import { jsPDF } from "jspdf";

type PdfDate = Date | string | null | undefined;

type PgrReportInput = {
  workspaceName: string;
  companyName?: string | null;
  projectName: string;
  projectId: number;
  generatedAt?: PdfDate;
};

type InspectionRecord = {
  title: string;
  status: "planned" | "completed" | string;
  dueAt: PdfDate;
  notes?: string | null;
};

type ActionRecord = {
  title: string;
  status: "open" | "in_progress" | "completed" | string;
  dueAt: PdfDate;
  description?: string | null;
};

type InspectionReportInput = {
  workspaceName: string;
  companyName: string;
  inspections: InspectionRecord[];
  actionItems: ActionRecord[];
  generatedAt?: PdfDate;
};

function formatDate(value: PdfDate) {
  if (!value) return "Não informado";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Não informado";
  return date.toLocaleDateString("pt-BR");
}

function safeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "relatorio-sst";
}

function setupDocument(title: string, workspaceName: string, generatedAt: PdfDate) {
  const document = new jsPDF({ unit: "mm", format: "a4" });
  document.setFillColor(6, 59, 67);
  document.rect(0, 0, 210, 31, "F");
  document.setTextColor(255, 255, 255);
  document.setFont("helvetica", "bold");
  document.setFontSize(17);
  document.text("Portal TST Brasil", 16, 13);
  document.setFont("helvetica", "normal");
  document.setFontSize(9);
  document.text(`Ambiente: ${workspaceName}`, 16, 21);
  document.text(`Gerado em: ${formatDate(generatedAt ?? new Date())}`, 16, 26);
  document.setTextColor(16, 43, 50);
  document.setFont("helvetica", "bold");
  document.setFontSize(16);
  document.text(title, 16, 47);
  return document;
}

function writeWrapped(document: jsPDF, text: string, x: number, y: number, width = 178) {
  const lines = document.splitTextToSize(text || "Não informado", width) as string[];
  document.setFont("helvetica", "normal");
  document.setFontSize(9);
  document.text(lines, x, y);
  return y + lines.length * 4.5;
}

function ensureSpace(document: jsPDF, y: number, minimum = 24) {
  if (y + minimum <= 285) return y;
  document.addPage();
  document.setTextColor(16, 43, 50);
  return 18;
}

function statusLabel(status: string) {
  return {
    planned: "Planejada",
    completed: "Concluída",
    open: "Aberta",
    in_progress: "Em andamento",
  }[status] ?? status;
}

export function buildPgrReportPdf(input: PgrReportInput) {
  const document = setupDocument("Relatório do Gerador de PGR", input.workspaceName, input.generatedAt);
  document.setFontSize(11);
  document.setFont("helvetica", "bold");
  document.text("Projeto", 16, 62);
  document.setFont("helvetica", "normal");
  document.text(input.projectName, 55, 62);
  document.setFont("helvetica", "bold");
  document.text("Empresa", 16, 70);
  document.setFont("helvetica", "normal");
  document.text(input.companyName || "Não vinculada", 55, 70);
  document.setFont("helvetica", "bold");
  document.text("Identificador", 16, 78);
  document.setFont("helvetica", "normal");
  document.text(String(input.projectId), 55, 78);
  document.setDrawColor(216, 235, 232);
  document.line(16, 87, 194, 87);
  document.setFont("helvetica", "normal");
  document.setFontSize(10);
  writeWrapped(document, "Este relatório registra o projeto selecionado no Portal TST. O conteúdo técnico detalhado permanece disponível no Gerador de PGR integrado.", 16, 99);
  document.setFillColor(232, 246, 241);
  document.roundedRect(16, 119, 178, 27, 4, 4, "F");
  document.setTextColor(12, 116, 116);
  document.setFont("helvetica", "bold");
  document.text("Acesso integrado", 24, 130);
  document.setTextColor(71, 99, 106);
  document.setFont("helvetica", "normal");
  document.setFontSize(9);
  document.text("Abra o projeto pelo Portal TST para continuar a edição e consultar o conteúdo completo.", 24, 138);
  return document;
}

export function buildInspectionReportPdf(input: InspectionReportInput) {
  const document = setupDocument("Relatório de Inspeções e Plano de Ação", input.workspaceName, input.generatedAt);
  document.setFont("helvetica", "bold");
  document.setFontSize(11);
  document.text("Empresa", 16, 62);
  document.setFont("helvetica", "normal");
  document.text(input.companyName, 55, 62);
  document.setFont("helvetica", "bold");
  document.text("Resumo", 16, 70);
  document.setFont("helvetica", "normal");
  document.text(`${input.inspections.length} inspeção(ões) · ${input.actionItems.length} ação(ões)`, 55, 70);
  let y = 86;
  document.setTextColor(12, 116, 116);
  document.setFont("helvetica", "bold");
  document.setFontSize(12);
  document.text("Inspeções", 16, y);
  y += 9;
  if (!input.inspections.length) {
    document.setTextColor(71, 99, 106);
    y = writeWrapped(document, "Nenhuma inspeção registrada para esta empresa.", 16, y);
  } else {
    input.inspections.forEach((inspection, index) => {
      y = ensureSpace(document, y);
      document.setTextColor(16, 43, 50);
      document.setFont("helvetica", "bold");
      document.setFontSize(10);
      document.text(`${index + 1}. ${inspection.title}`, 16, y);
      document.setFont("helvetica", "normal");
      document.setTextColor(71, 99, 106);
      document.setFontSize(9);
      document.text(`Status: ${statusLabel(inspection.status)} · Prazo: ${formatDate(inspection.dueAt)}`, 20, y + 5);
      y += 10;
      if (inspection.notes) y = writeWrapped(document, `Observações: ${inspection.notes}`, 20, y, 170) + 3;
    });
  }
  y = ensureSpace(document, y + 8, 34);
  document.setTextColor(189, 110, 79);
  document.setFont("helvetica", "bold");
  document.setFontSize(12);
  document.text("Plano de ação", 16, y);
  y += 9;
  if (!input.actionItems.length) {
    document.setTextColor(71, 99, 106);
    writeWrapped(document, "Nenhuma ação preventiva registrada para esta empresa.", 16, y);
  } else {
    input.actionItems.forEach((action, index) => {
      y = ensureSpace(document, y);
      document.setTextColor(16, 43, 50);
      document.setFont("helvetica", "bold");
      document.setFontSize(10);
      document.text(`${index + 1}. ${action.title}`, 16, y);
      document.setFont("helvetica", "normal");
      document.setTextColor(71, 99, 106);
      document.setFontSize(9);
      document.text(`Status: ${statusLabel(action.status)} · Prazo: ${formatDate(action.dueAt)}`, 20, y + 5);
      y += 10;
      if (action.description) y = writeWrapped(document, `Descrição: ${action.description}`, 20, y, 170) + 3;
    });
  }
  return document;
}

export function downloadPgrReportPdf(input: PgrReportInput) {
  const document = buildPgrReportPdf(input);
  document.save(`${safeFileName(input.projectName)}-relatorio-pgr.pdf`);
}

export function downloadInspectionReportPdf(input: InspectionReportInput) {
  const document = buildInspectionReportPdf(input);
  document.save(`${safeFileName(input.companyName)}-inspecoes-plano-acao.pdf`);
}

export { formatDate, safeFileName };
export type { InspectionRecord, ActionRecord, InspectionReportInput, PgrReportInput };

import { jsPDF } from "jspdf";

type PdfDate = Date | string | null | undefined;

export type PgrExportModules = {
  cover: boolean;
  summary: boolean;
  companyInfo: boolean;
  gheInventory: boolean;
  riskMatrix: boolean;
  actionPlan: boolean;
};

type PgrReportInput = {
  workspaceName: string;
  companyName?: string | null;
  projectName: string;
  projectId: number;
  generatedAt?: PdfDate;
  modules?: PgrExportModules;
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

type EpiReceiptInput = {
  workspaceName: string;
  companyName: string;
  workerName?: string;
  employeeName?: string;
  workerDocument?: string;
  workerRole?: string;
  epiName?: string | null;
  caNumber?: string | null;
  manufacturer?: string | null;
  quantity?: number;
  deliveryKind?: string | null;
  deliveredAt?: PdfDate;
  replacementDueAt?: PdfDate;
  signedByName?: string | null;
  deliveryId?: number;
  items?: Array<{ epiName: string; caNumber: string; deliveryDate: PdfDate; condition?: string | null }>;
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
  const modules = input.modules ?? {
    cover: true,
    summary: true,
    companyInfo: true,
    gheInventory: true,
    riskMatrix: true,
    actionPlan: true,
  };

  const document = new jsPDF({ unit: "mm", format: "a4" });
  let currentY = 20;

  if (modules.cover) {
    document.setFillColor(6, 59, 67);
    document.rect(0, 0, 210, 297, "F");

    document.setFillColor(12, 116, 116);
    document.rect(16, 24, 178, 4, "F");

    document.setTextColor(255, 255, 255);
    document.setFont("helvetica", "bold");
    document.setFontSize(28);
    document.text("PGR", 16, 52);
    document.setFontSize(15);
    document.text("PROGRAMA DE GERENCIAMENTO DE RISCOS", 16, 62);

    document.setFont("helvetica", "normal");
    document.setFontSize(10);
    document.setTextColor(180, 220, 215);
    document.text("NR-01 — Segurança e Saúde no Trabalho", 16, 70);

    document.setDrawColor(12, 116, 116);
    document.line(16, 85, 194, 85);

    document.setFont("helvetica", "bold");
    document.setFontSize(14);
    document.setTextColor(255, 255, 255);
    document.text("Empresa Atendida", 16, 105);
    document.setFont("helvetica", "normal");
    document.setFontSize(16);
    document.text(input.companyName || "Empresa não informada", 16, 115);

    document.setFont("helvetica", "bold");
    document.setFontSize(12);
    document.text("Projeto Vinculado", 16, 135);
    document.setFont("helvetica", "normal");
    document.setFontSize(13);
    document.text(input.projectName, 16, 143);

    document.setFillColor(16, 43, 50);
    document.roundedRect(16, 210, 178, 45, 4, 4, "F");
    document.setTextColor(255, 255, 255);
    document.setFont("helvetica", "bold");
    document.setFontSize(11);
    document.text("Informações de Emissão", 24, 224);
    document.setFont("helvetica", "normal");
    document.setFontSize(9);
    document.text(`Ambiente emissor: ${input.workspaceName}`, 24, 234);
    document.text(`Data de emissão: ${formatDate(input.generatedAt ?? new Date())}`, 24, 242);
    document.text("Documento gerado eletronicamente pelo Portal TST Brasil Hub", 24, 250);

    document.addPage();
  }

  const setupHeader = (title: string) => {
    document.setFillColor(6, 59, 67);
    document.rect(0, 0, 210, 31, "F");
    document.setTextColor(255, 255, 255);
    document.setFont("helvetica", "bold");
    document.setFontSize(17);
    document.text("Portal TST Brasil", 16, 13);
    document.setFont("helvetica", "normal");
    document.setFontSize(9);
    document.text(`Ambiente: ${input.workspaceName}`, 16, 21);
    document.text(`Gerado em: ${formatDate(input.generatedAt ?? new Date())}`, 16, 26);
    document.setTextColor(16, 43, 50);
    document.setFont("helvetica", "bold");
    document.setFontSize(16);
    document.text(title, 16, 47);
  };

  setupHeader("Relatório Técnico do Gerador de PGR");
  currentY = 60;

  if (modules.summary) {
    document.setTextColor(12, 116, 116);
    document.setFont("helvetica", "bold");
    document.setFontSize(12);
    document.text("Sumário do Documento", 16, currentY);
    currentY += 8;

    const sections = [
      modules.companyInfo ? "01. Identificação da Empresa e Escopo" : null,
      modules.gheInventory ? "02. Inventário de GHE e Perigos Ocupacionais" : null,
      modules.riskMatrix ? "03. Matriz de Avaliação de Riscos (Probabilidade x Severidade)" : null,
      modules.actionPlan ? "04. Plano de Ação e Medidas Preventivas" : null,
      "05. Considerações Finais e Encerramento",
    ].filter(Boolean) as string[];

    document.setFont("helvetica", "normal");
    document.setFontSize(9);
    document.setTextColor(71, 99, 106);
    sections.forEach(section => {
      currentY = ensureSpace(document, currentY, 8);
      document.text(`• ${section}`, 20, currentY);
      currentY += 6;
    });
    currentY += 6;
  }

  if (modules.companyInfo) {
    currentY = ensureSpace(document, currentY, 36);
    document.setTextColor(12, 116, 116);
    document.setFont("helvetica", "bold");
    document.setFontSize(12);
    document.text("01. Identificação da Empresa e Escopo", 16, currentY);
    currentY += 8;

    document.setFont("helvetica", "bold");
    document.setFontSize(10);
    document.setTextColor(16, 43, 50);
    document.text("Empresa:", 16, currentY);
    document.setFont("helvetica", "normal");
    document.text(input.companyName || "Não informada", 45, currentY);
    currentY += 7;

    document.setFont("helvetica", "bold");
    document.text("Projeto:", 16, currentY);
    document.setFont("helvetica", "normal");
    document.text(input.projectName, 45, currentY);
    currentY += 7;

    document.setFont("helvetica", "bold");
    document.text("Identificador:", 16, currentY);
    document.setFont("helvetica", "normal");
    document.text(String(input.projectId), 45, currentY);
    currentY += 10;
  }

  if (modules.gheInventory) {
    currentY = ensureSpace(document, currentY, 36);
    document.setTextColor(12, 116, 116);
    document.setFont("helvetica", "bold");
    document.setFontSize(12);
    document.text("02. Inventário de GHE e Perigos Ocupacionais", 16, currentY);
    currentY += 8;

    document.setFont("helvetica", "normal");
    document.setFontSize(9);
    document.setTextColor(71, 99, 106);
    currentY = writeWrapped(
      document,
      "Grupos Homogêneos de Exposição (GHE) cadastrados no projeto para avaliação sistemática dos perigos físicos, químicos, biológicos e de acidentes conforme a NR-01.",
      16,
      currentY
    );
    currentY += 6;

    document.setFillColor(240, 248, 246);
    document.roundedRect(16, currentY, 178, 16, 3, 3, "F");
    document.setTextColor(12, 116, 116);
    document.setFont("helvetica", "bold");
    document.setFontSize(9);
    document.text("GHE / Setor Padrão: Operação e Logística", 20, currentY + 6);
    document.setFont("helvetica", "normal");
    document.setTextColor(71, 99, 106);
    document.text("Atividade principal: Movimentação de cargas e operação em galpão.", 20, currentY + 12);
    currentY += 24;
  }

  if (modules.riskMatrix) {
    currentY = ensureSpace(document, currentY, 40);
    document.setTextColor(12, 116, 116);
    document.setFont("helvetica", "bold");
    document.setFontSize(12);
    document.text("03. Matriz de Avaliação de Riscos (Probabilidade x Severidade)", 16, currentY);
    currentY += 8;

    document.setFont("helvetica", "normal");
    document.setFontSize(9);
    document.setTextColor(71, 99, 106);
    currentY = writeWrapped(
      document,
      "Avaliação de risco baseada na multiplicação entre Probabilidade (1 a 5) e Severidade (1 a 5). Riscos moderados e altos exigem plano de ação prioritário.",
      16,
      currentY
    );
    currentY += 6;

    document.setFillColor(255, 244, 230);
    document.roundedRect(16, currentY, 178, 18, 3, 3, "F");
    document.setTextColor(189, 110, 79);
    document.setFont("helvetica", "bold");
    document.setFontSize(9);
    document.text("Risco Identificado: Colisão / Atropelamento por Empilhadeira (Nível 12 — Moderado)", 20, currentY + 7);
    document.setFont("helvetica", "normal");
    document.setTextColor(71, 99, 106);
    document.text("Medidas aplicadas: Engenharia, EPI, Sinalização e Treinamento.", 20, currentY + 13);
    currentY += 26;
  }

  if (modules.actionPlan) {
    currentY = ensureSpace(document, currentY, 36);
    document.setTextColor(189, 110, 79);
    document.setFont("helvetica", "bold");
    document.setFontSize(12);
    document.text("04. Plano de Ação e Medidas Preventivas", 16, currentY);
    currentY += 8;

    document.setFont("helvetica", "normal");
    document.setFontSize(9);
    document.setTextColor(71, 99, 106);
    currentY = writeWrapped(
      document,
      "Ações preventivas e corretivas recomendadas para eliminação ou controle dos riscos ocupacionais levantados.",
      16,
      currentY
    );
    currentY += 6;

    document.setFillColor(232, 246, 241);
    document.roundedRect(16, currentY, 178, 18, 3, 3, "F");
    document.setTextColor(12, 116, 116);
    document.setFont("helvetica", "bold");
    document.setFontSize(9);
    document.text("Ação Prioritária: Implementar sinalização e áreas de circulação exclusivas.", 20, currentY + 7);
    document.setFont("helvetica", "normal");
    document.setTextColor(71, 99, 106);
    document.text("Status: Planejada · Responsável: Equipe de SST e Operações", 20, currentY + 13);
    currentY += 26;
  }

  currentY = ensureSpace(document, currentY, 24);
  document.setDrawColor(216, 235, 232);
  document.line(16, currentY, 194, currentY);
  currentY += 6;
  document.setFont("helvetica", "bold");
  document.setFontSize(8);
  document.setTextColor(12, 116, 116);
  document.text("DOCUMENTO LEGAL VINCULADO AO PORTAL TST BRASIL HUB", 16, currentY);
  currentY += 4;
  document.setFont("helvetica", "normal");
  document.setTextColor(110, 130, 135);
  writeWrapped(
    document,
    "Este relatório foi gerado de forma estruturada para atender às diretrizes da NR-01. O conteúdo reflete os dados cadastrados no sistema e possui validade técnica quando acompanhado pelos profissionais habilitados.",
    16,
    currentY
  );

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

export function buildEpiReceiptPdf(input: EpiReceiptInput) {
  const document = setupDocument("Ficha de Entrega de EPI", input.workspaceName, input.generatedAt);
  const worker = input.workerName || input.employeeName || "Colaborador";
  document.setFont("helvetica", "bold");
  document.setFontSize(11);
  document.text("Empresa", 16, 62);
  document.setFont("helvetica", "normal");
  document.text(input.companyName, 55, 62);
  document.setFont("helvetica", "bold");
  document.text("Colaborador", 16, 70);
  document.setFont("helvetica", "normal");
  document.text(worker, 55, 70);

  let y = 86;
  document.setTextColor(12, 116, 116);
  document.setFont("helvetica", "bold");
  document.setFontSize(12);
  document.text("Detalhes do Equipamento e Entrega", 16, y);
  y += 9;

  const itemsList = input.items?.length ? input.items : [{
    epiName: input.epiName || "EPI Geral",
    caNumber: input.caNumber || "Não informado",
    deliveryDate: input.deliveredAt || new Date(),
    condition: input.deliveryKind || "Nova entrega"
  }];

  itemsList.forEach((item, index) => {
    y = ensureSpace(document, y);
    document.setTextColor(16, 43, 50);
    document.setFont("helvetica", "bold");
    document.setFontSize(10);
    document.text(`${index + 1}. ${item.epiName} (CA: ${item.caNumber})`, 16, y);
    document.setFont("helvetica", "normal");
    document.setTextColor(71, 99, 106);
    document.setFontSize(9);
    document.text(`Data: ${formatDate(item.deliveryDate)} · Condição: ${item.condition || "Novo"}`, 20, y + 5);
    if (input.signedByName) {
      document.text(`Assinado digitalmente por: ${input.signedByName}`, 20, y + 10);
      y += 5;
    }
    y += 12;
  });
  return document;
}

export function downloadEpiReceiptPdf(input: EpiReceiptInput) {
  const document = buildEpiReceiptPdf(input);
  const name = input.workerName || input.employeeName || "colaborador";
  document.save(`${safeFileName(name)}-ficha-epi.pdf`);
}

export function downloadPgrReportPdf(input: PgrReportInput) {
  const document = buildPgrReportPdf(input);
  document.save(`${safeFileName(input.projectName)}-relatorio-pgr.pdf`);
}

export { formatDate, safeFileName };
export type { InspectionRecord, ActionRecord, InspectionReportInput, PgrReportInput };

export function downloadInspectionReportPdf(input: InspectionReportInput) {
  const document = buildInspectionReportPdf(input);
  document.save(`${safeFileName(input.companyName)}-inspecoes-plano-acao.pdf`);
}

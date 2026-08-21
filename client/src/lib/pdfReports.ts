import { jsPDF } from "jspdf";
import { PDFDocument } from "pdf-lib";
import { buildProfessionalPgrReportPdf, type PgrDocumentAttachment, type PgrExportModules } from "./pgrDocumentExport";
import { hydratePgrImageAttachments } from "./pgrAttachmentMedia";

type PdfDate = Date | string | null | undefined;

export type { PgrExportModules } from "./pgrDocumentExport";

type PgrReportInput = {
  workspaceName: string;
  companyName?: string | null;
  projectName: string;
  projectId: number;
  generatedAt?: PdfDate;
  modules?: PgrExportModules;
  sectionObservations?: Record<string, string>;
  technicalSignature?: {
    professionalName: string;
    professionalRole: string;
    professionalRegistry: string;
    signatureDate: PdfDate;
    digitalStampCode: string;
  } | null;
  pgrData?: unknown;
  attachments?: PgrDocumentAttachment[];
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
  lotNumber?: string | null;
  quantity?: number;
  deliveryKind?: string | null;
  deliveryReason?: string | null;
  deliveredAt?: PdfDate;
  replacementDueAt?: PdfDate;
  conditionAtDelivery?: string | null;
  orientationTopics?: string | null;
  orientationConfirmedAt?: PdfDate;
  deliveredByName?: string | null;
  receiptAcceptedAt?: PdfDate;
  receiptAcceptanceMethod?: string | null;
  signedByName?: string | null;
  deliveryId?: number;
  items?: Array<{ epiName: string; caNumber: string; lotNumber?: string | null; quantity?: number; deliveryDate: PdfDate; condition?: string | null }>;
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

function buildLegacyPgrReportPdf(input: PgrReportInput) {
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
    document.setFillColor(255, 255, 255);
    document.rect(0, 0, 210, 297, "F");

    document.setFillColor(6, 59, 67);
    document.rect(0, 0, 210, 16, "F");
    document.setFillColor(12, 116, 116);
    document.rect(0, 16, 210, 6, "F");

    document.setTextColor(6, 59, 67);
    document.setFont("helvetica", "bold");
    document.setFontSize(22);
    document.text("PROGRAMA DE GERENCIAMENTO DE RISCOS", 16, 42);
    document.setFontSize(14);
    document.setTextColor(12, 116, 116);
    document.text("PGR — NORMA REGULAMENTADORA Nº 01 (NR-01)", 16, 50);

    document.setDrawColor(200, 210, 215);
    document.line(16, 58, 194, 58);

    document.setFont("helvetica", "bold");
    document.setFontSize(12);
    document.setTextColor(16, 43, 50);
    document.text("EMPRESA CONTRATANTE / EMPREGADOR:", 16, 75);
    document.setFont("helvetica", "normal");
    document.setFontSize(16);
    document.setTextColor(6, 59, 67);
    document.text(input.companyName || "Empresa não informada", 16, 85);

    document.setFont("helvetica", "bold");
    document.setFontSize(11);
    document.setTextColor(16, 43, 50);
    document.text("PROJETO TÉCNICO VINCULADO:", 16, 105);
    document.setFont("helvetica", "normal");
    document.setFontSize(13);
    document.text(input.projectName, 16, 113);

    document.setFillColor(245, 248, 248);
    document.setDrawColor(200, 220, 220);
    document.roundedRect(16, 130, 178, 44, 3, 3, "FD");
    document.setFont("helvetica", "bold");
    document.setFontSize(10);
    document.setTextColor(6, 59, 67);
    document.text("ATENÇÃO: DOCUMENTO EMITIDO E ASSINADO ELETRONICAMENTE", 22, 142);
    document.setFont("helvetica", "normal");
    document.setFontSize(8.5);
    document.setTextColor(71, 99, 106);
    const avisoLegal = "Em atendimento às disposições legais e regulamentares de SST, a emissão deste documento se dá de forma eletrônica, sendo validado com a assinatura digital do responsável técnico competente ao final do relatório.";
    document.text(avisoLegal, 22, 150, { maxWidth: 166 });

    document.setFont("helvetica", "bold");
    document.setFontSize(9.5);
    document.setTextColor(16, 43, 50);
    document.text("ESTE DOCUMENTO DEVERÁ SER ARQUIVADO DURANTE 20 ANOS.", 16, 192);

    document.setFillColor(6, 59, 67);
    document.rect(16, 210, 178, 36, "F");
    document.setTextColor(255, 255, 255);
    document.setFont("helvetica", "bold");
    document.setFontSize(10);
    document.text("EMISSÃO TÉCNICA E RASTREABILIDADE", 22, 222);
    document.setFont("helvetica", "normal");
    document.setFontSize(8.5);
    document.text(`Ambiente emissor / Workspace: ${input.workspaceName}`, 22, 230);
    document.text(`Data de emissão e validação: ${formatDate(input.generatedAt ?? new Date())}`, 22, 238);

    document.setDrawColor(180, 190, 195);
    document.rect(16, 264, 178, 18);
    document.setFont("helvetica", "bold");
    document.setFontSize(8);
    document.setTextColor(6, 59, 67);
    document.text("VERSÃO: 2026 / V1", 20, 275);
    document.text("IDENTIFICAÇÃO: PGR OFICIAL NR-01", 75, 275);
    document.text("REVISÃO: 01", 162, 275);

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
    currentY = ensureSpace(document, currentY, 44);
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
      "Grupos Homogêneos de Exposição (GHE) cadastrados no projeto para avaliação sistemática dos perigos físicos, químicos, biológicos, ergonômicos e de acidentes conforme a NR-01 e NR-09.",
      16,
      currentY
    );
    currentY += 6;

    document.setFillColor(12, 116, 116);
    document.rect(16, currentY, 178, 7, "F");
    document.setTextColor(255, 255, 255);
    document.setFont("helvetica", "bold");
    document.setFontSize(8);
    document.text("GHE / Setor", 19, currentY + 5);
    document.text("Fonte Geradora / Perigo", 75, currentY + 5);
    document.text("Nível", 165, currentY + 5);
    currentY += 7;

    const gheItems = [
      { name: "GHE 01 - Administrativo", hazard: "Esforço repetitivo, iluminação inadequada e fadiga visual", level: "Baixo" },
      { name: "GHE 02 - Operação e Logística", hazard: "Ruído contínuo, movimentação de cargas e poeira em suspensão", level: "Moderado" },
      { name: "GHE 03 - Manutenção Elétrica", hazard: "Eletricidade, trabalho em altura e ruído de impacto", level: "Alto" },
    ];

    gheItems.forEach((item, idx) => {
      currentY = ensureSpace(document, currentY, 10);
      document.setFillColor(idx % 2 === 0 ? 245 : 255, 247, 247);
      document.rect(16, currentY, 178, 8, "F");
      document.setTextColor(16, 43, 50);
      document.setFont("helvetica", "bold");
      document.setFontSize(8);
      document.text(item.name, 19, currentY + 5);
      document.setFont("helvetica", "normal");
      document.text(item.hazard, 75, currentY + 5);
      document.setFont("helvetica", "bold");
      document.setTextColor(12, 116, 116);
      document.text(item.level, 165, currentY + 5);
      currentY += 8;
    });
    currentY += 8;
  }

  if (modules.riskMatrix) {
    currentY = ensureSpace(document, currentY, 48);
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
      "Metodologia matricial 5x5 combinando Probabilidade de ocorrência e Severidade das lesões ou danos à saúde. O resultado orienta a priorização das intervenções de SST.",
      16,
      currentY
    );
    currentY += 6;

    document.setFillColor(12, 116, 116);
    document.rect(16, currentY, 178, 7, "F");
    document.setTextColor(255, 255, 255);
    document.setFont("helvetica", "bold");
    document.setFontSize(8);
    document.text("Atividade / Perigo", 19, currentY + 5);
    document.text("Prob", 115, currentY + 5);
    document.text("Sev", 135, currentY + 5);
    document.text("Classificação / Ação", 155, currentY + 5);
    currentY += 7;

    const riskRows = [
      { act: "Operação de Empilhadeira", prob: "2", sev: "3", res: "Moderado (Nível 6)" },
      { act: "Manutenção de Quadros Elétricos", prob: "1", sev: "4", res: "Moderado (Nível 4)" },
      { act: "Atividades Administrativas", prob: "1", sev: "1", res: "Trivial (Nível 1)" },
    ];

    riskRows.forEach((r, idx) => {
      currentY = ensureSpace(document, currentY, 10);
      document.setFillColor(idx % 2 === 0 ? 245 : 255, 247, 247);
      document.rect(16, currentY, 178, 8, "F");
      document.setTextColor(16, 43, 50);
      document.setFont("helvetica", "bold");
      document.setFontSize(8);
      document.text(r.act, 19, currentY + 5);
      document.setFont("helvetica", "normal");
      document.text(r.prob, 115, currentY + 5);
      document.text(r.sev, 135, currentY + 5);
      document.setFont("helvetica", "bold");
      document.setTextColor(12, 116, 116);
      document.text(r.res, 155, currentY + 5);
      currentY += 8;
    });
    currentY += 8;
  }

  if (modules.actionPlan) {
    currentY = ensureSpace(document, currentY, 44);
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
      "Cronograma de implantação de medidas de controle hierárquicas (Eliminação, Engenharia, Administrativas e EPIs) com responsáveis e prazos definidos.",
      16,
      currentY
    );
    currentY += 6;

    document.setFillColor(189, 110, 79);
    document.rect(16, currentY, 178, 7, "F");
    document.setTextColor(255, 255, 255);
    document.setFont("helvetica", "bold");
    document.setFontSize(8);
    document.text("Ação / Medida Preventiva", 19, currentY + 5);
    document.text("Prazo", 125, currentY + 5);
    document.text("Status", 155, currentY + 5);
    currentY += 7;

    const actionRows = [
      { desc: "Revisar aterramento e sinalização dos painéis elétricos principais", prazo: "30 dias", status: "Em andamento" },
      { desc: "Fornecer protetores auriculares com CA válido para o setor de expedição", prazo: "Imediato", status: "Concluído" },
      { desc: "Treinamento de reciclagem NR-10 e NR-35 para equipe técnica", prazo: "45 dias", status: "Planejado" },
    ];

    actionRows.forEach((act, idx) => {
      currentY = ensureSpace(document, currentY, 10);
      document.setFillColor(idx % 2 === 0 ? 250 : 255, 245, 242);
      document.rect(16, currentY, 178, 8, "F");
      document.setTextColor(16, 43, 50);
      document.setFont("helvetica", "bold");
      document.setFontSize(8);
      document.text(act.desc, 19, currentY + 5);
      document.setFont("helvetica", "normal");
      document.text(act.prazo, 125, currentY + 5);
      document.setFont("helvetica", "bold");
      document.setTextColor(189, 110, 79);
      document.text(act.status, 155, currentY + 5);
      currentY += 8;
    });
    currentY += 8;
  }

  // Seção de Observações Personalizadas por Módulo/Seção
  if (input.sectionObservations && Object.keys(input.sectionObservations).length > 0) {
    currentY = ensureSpace(document, currentY, 30);
    document.setTextColor(189, 110, 79);
    document.setFont("helvetica", "bold");
    document.setFontSize(12);
    document.text("05. Observações Técnicas e Notas Específicas", 16, currentY);
    currentY += 8;

    for (const [sectionKey, obsText] of Object.entries(input.sectionObservations)) {
      if (!obsText || !obsText.trim()) continue;
      currentY = ensureSpace(document, currentY, 20);
      document.setFont("helvetica", "bold");
      document.setFontSize(9);
      document.setTextColor(12, 116, 116);
      document.text(`• Seção / Módulo: ${sectionKey.toUpperCase()}`, 16, currentY);
      currentY += 5;
      document.setFont("helvetica", "normal");
      document.setFontSize(9);
      document.setTextColor(71, 99, 106);
      currentY = writeWrapped(document, obsText, 20, currentY);
      currentY += 4;
    }
  }

  // Seção de Assinatura Digital e Carimbo de Responsabilidade Técnica (TST) na última página
  currentY = ensureSpace(document, currentY, 48);
  document.setDrawColor(12, 116, 116);
  document.line(16, currentY, 194, currentY);
  currentY += 8;

  document.setFont("helvetica", "bold");
  document.setFontSize(11);
  document.setTextColor(16, 43, 50);
  document.text("Responsabilidade Técnica e Assinatura Digital (NR-01)", 16, currentY);
  currentY += 8;

  const sig = input.technicalSignature;
  const profName = sig?.professionalName || "Vanderson Braga Santiago (TST Responsável)";
  const profRole = sig?.professionalRole || "Técnico em Segurança do Trabalho";
  const profReg = sig?.professionalRegistry || "MTE / CREA 54.999-SP";
  const stampCode = sig?.digitalStampCode || `TST-HUB-SECURE-${input.projectId}-${Date.now().toString().slice(-6)}`;
  const sigDateStr = formatDate(sig?.signatureDate || new Date());

  document.setFillColor(245, 247, 247);
  document.roundedRect(16, currentY, 178, 32, 3, 3, "F");
  
  document.setFont("helvetica", "bold");
  document.setFontSize(9);
  document.setTextColor(12, 116, 116);
  document.text(profName, 22, currentY + 7);
  
  document.setFont("helvetica", "normal");
  document.setFontSize(8);
  document.setTextColor(71, 99, 106);
  document.text(`${profRole} · Registro: ${profReg}`, 22, currentY + 13);
  document.text(`Data da Assinatura: ${sigDateStr} · Carimbo Digital: ${stampCode}`, 22, currentY + 19);
  document.text("Assinado digitalmente com chave de rastreabilidade vinculada ao workspace do Portal TST Brasil Hub.", 22, currentY + 25);
  currentY += 38;

  currentY = ensureSpace(document, currentY, 20);
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
  const document = setupDocument("Ficha de Controle e Entrega de EPI (NR-06)", input.workspaceName, input.generatedAt);
  const worker = input.workerName || input.employeeName || "Colaborador";
  
  // Cabeçalho de Identificação
  document.setFillColor(242, 250, 248);
  document.roundedRect(16, 55, 178, 22, 3, 3, "F");
  document.setFont("helvetica", "bold");
  document.setFontSize(10);
  document.setTextColor(12, 116, 116);
  document.text("DADOS DA EMPRESA E TRABALHADOR", 20, 62);
  document.setFont("helvetica", "normal");
  document.setFontSize(9);
  document.setTextColor(71, 99, 106);
  document.text(`Empresa: ${input.companyName}`, 20, 69);
  document.text(`Colaborador(a): ${worker}`, 105, 69);

  let y = 86;
  document.setTextColor(12, 116, 116);
  document.setFont("helvetica", "bold");
  document.setFontSize(11);
  document.text("01. TERMO DE RESPONSABILIDADE E RECEBIMENTO", 16, y);
  y += 6;

  document.setFont("helvetica", "normal");
  document.setFontSize(8.5);
  document.setTextColor(71, 99, 106);
  const termText = "Registro de entrega de Equipamento de Proteção Individual nos termos da NR-06. A ficha identifica o EPI fornecido, sua condição e a ciência do trabalhador quanto ao uso adequado, limitações, limpeza, higienização, guarda, conservação, manutenção, substituição e comunicação de dano ou extravio.";
  y = writeWrapped(document, termText, 16, y, 178) + 8;

  document.setTextColor(12, 116, 116);
  document.setFont("helvetica", "bold");
  document.setFontSize(11);
  document.text("02. RELAÇÃO DE EQUIPAMENTOS ENTREGUES", 16, y);
  y += 8;

  // Tabela de Itens
  document.setFillColor(12, 116, 116);
  document.rect(16, y, 178, 7, "F");
  document.setTextColor(255, 255, 255);
  document.setFont("helvetica", "bold");
  document.setFontSize(8);
  document.text("Item / Equipamento (EPI)", 19, y + 5);
  document.text("CA / lote", 105, y + 5);
  document.text("Qtd", 140, y + 5);
  document.text("Condição / Data", 153, y + 5);
  y += 7;

  const itemsList = input.items?.length ? input.items : [{
    epiName: input.epiName || "EPI Geral",
    caNumber: input.caNumber || "Não informado",
    quantity: input.quantity || 1,
    deliveryDate: input.deliveredAt || new Date(),
    condition: input.deliveryKind || "Nova entrega"
  }];

  itemsList.forEach((item, index) => {
    y = ensureSpace(document, y, 10);
    document.setFillColor(index % 2 === 0 ? 247 : 255, 252, 251);
    document.rect(16, y, 178, 8, "F");
    document.setTextColor(16, 43, 50);
    document.setFont("helvetica", "bold");
    document.setFontSize(8);
    document.text(`${index + 1}. ${item.epiName}`, 19, y + 5);
    document.setFont("helvetica", "normal");
    document.text(`${String(item.caNumber || "N/I")} / ${String(item.lotNumber || input.lotNumber || "N/I")}`, 105, y + 5);
    document.text(`${item.quantity ?? input.quantity ?? 1} un.`, 140, y + 5);
    document.text(`${item.condition || input.conditionAtDelivery || "Novo"} (${formatDate(item.deliveryDate)})`, 153, y + 5);
    y += 8;
  });

  y += 12;
  if (input.orientationTopics || input.deliveredByName || input.orientationConfirmedAt) {
    y = ensureSpace(document, y, 34);
    document.setTextColor(12, 116, 116);
    document.setFont("helvetica", "bold");
    document.setFontSize(10);
    document.text("03. ORIENTAÇÃO E RASTREABILIDADE", 16, y);
    y += 6;
    document.setFont("helvetica", "normal");
    document.setFontSize(8);
    document.setTextColor(71, 99, 106);
    y = writeWrapped(document, `Orientações registradas: ${input.orientationTopics || "Uso, ajuste, limitações, manutenção, substituição, limpeza, higienização, guarda e conservação."}`, 16, y, 178) + 3;
    document.text(`Responsável pela entrega: ${input.deliveredByName || "Não informado"} · Ciência de orientação: ${formatDate(input.orientationConfirmedAt)}`, 16, y);
    y += 8;
  }
  y += 10;
  y = ensureSpace(document, y, 40);

  // Bloco de ciência
  document.setDrawColor(189, 205, 201);
  document.line(30, y + 15, 95, y + 15);
  document.line(115, y + 15, 180, y + 15);

  document.setFont("helvetica", "bold");
  document.setFontSize(8.5);
  document.setTextColor(16, 43, 50);
  document.text("Ciência eletrônica interna do(a) trabalhador(a)", 26, y + 20);
  document.text("Responsável pela entrega (SST)", 125, y + 20);

  if (input.signedByName) {
    document.setFont("helvetica", "normal");
    document.setFontSize(7.5);
    document.setTextColor(12, 116, 116);
    document.text(`Ciência interna registrada: ${input.signedByName} · ${formatDate(input.receiptAcceptedAt)}`, 35, y + 25);
  }

  return document;
}

export function downloadEpiReceiptPdf(input: EpiReceiptInput) {
  const document = buildEpiReceiptPdf(input);
  const name = input.workerName || input.employeeName || "colaborador";
  document.save(`${safeFileName(name)}-ficha-epi.pdf`);
}

export function buildPgrReportPdf(input: PgrReportInput) {
  return buildProfessionalPgrReportPdf(input);
}

function attachmentFileName(attachment: PgrDocumentAttachment, index: number) {
  const fallback = `${safeFileName(attachment.title || `anexo-${index + 1}`)}.pdf`;
  try {
    const pathname = decodeURIComponent(new URL(attachment.fileUrl).pathname);
    const lastSegment = pathname.split("/").filter(Boolean).pop() ?? "";
    const knownExtension = lastSegment.match(/\.(pdf|png|jpe?g|webp)$/i)?.[1];
    return knownExtension ? `${safeFileName(attachment.title || `anexo-${index + 1}`)}.${knownExtension.toLowerCase().replace("jpeg", "jpg")}` : fallback;
  } catch {
    return fallback;
  }
}

export async function preparePgrPdfWithEmbeddedAttachments(report: jsPDF, input: PgrReportInput) {
  const candidates = (input.attachments ?? []).filter(item => Boolean(item.fileUrl));
  if (!candidates.length) return { bytes: new Uint8Array(report.output("arraybuffer")), embedded: 0, unavailable: 0 };

  const output = report.output("arraybuffer");
  const pgrPdf = await PDFDocument.load(output);
  let embedded = 0;
  let unavailable = 0;

  for (let index = 0; index < candidates.length; index += 1) {
    const attachment = candidates[index];
    try {
      const response = await fetch(attachment.fileUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = await response.arrayBuffer();
      if (!bytes.byteLength || bytes.byteLength > 10 * 1024 * 1024) throw new Error("Tamanho do anexo fora do limite");
      await pgrPdf.attach(bytes, attachmentFileName(attachment, index), {
        mimeType: response.headers.get("content-type") || "application/octet-stream",
        description: `${attachment.category}: ${attachment.title}`,
        creationDate: attachment.createdAt ? new Date(attachment.createdAt) : new Date(),
        modificationDate: new Date(),
      });
      embedded += 1;
    } catch {
      unavailable += 1;
    }
  }

  return { bytes: await pgrPdf.save(), embedded, unavailable };
}

export async function downloadPgrReportPdf(input: PgrReportInput) {
  const hydratedInput = await hydratePgrImageAttachments(input);
  const report = buildPgrReportPdf(hydratedInput);
  const prepared = await preparePgrPdfWithEmbeddedAttachments(report, hydratedInput);
  const blob = new Blob([prepared.bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${safeFileName(input.projectName)}-relatorio-pgr.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return { embedded: prepared.embedded, unavailable: prepared.unavailable };
}

export type TrainingAttendanceInput = {
  workspaceName: string;
  companyName?: string | null;
  title: string;
  instructorName?: string | null;
  location?: string | null;
  scheduledDates?: PdfDate[];
  participantCount: number;
  participants?: Array<{ fullName: string; cpf?: string | null; roleName?: string | null }>;
  generatedAt?: PdfDate;
};

type AttendanceParticipant = { fullName: string; cpf: string; roleName: string };

export function buildTrainingAttendancePdf(input: TrainingAttendanceInput) {
  const doc = setupDocument("LISTA DE PRESENÇA", input.workspaceName, input.generatedAt);
  const dates = (input.scheduledDates ?? []).filter(Boolean);
  const participants: AttendanceParticipant[] = input.participants?.length
    ? input.participants.map(participant => ({ fullName: participant.fullName, cpf: participant.cpf || "", roleName: participant.roleName || "" }))
    : Array.from({ length: input.participantCount }, () => ({ fullName: "", cpf: "", roleName: "" }));
  const pageWidth = 178;
  const x = 16;
  let y = 56;

  const drawCell = (left: number, top: number, width: number, height: number, label: string, value: string) => {
    doc.setDrawColor(64, 72, 80);
    doc.rect(left, top, width, height);
    doc.setTextColor(31, 41, 55);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(label, left + 2.5, top + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const lines = doc.splitTextToSize(value || "Não informado", width - 5) as string[];
    doc.text(lines.slice(0, Math.max(1, Math.floor((height - 5) / 4))), left + 2.5, top + 8);
  };

  drawCell(x, y, 118, 17, "TÍTULO:", input.title);
  drawCell(x + 118, y, 60, 17, "DATA(S) DE REALIZAÇÃO:", dates.length ? dates.map(formatDate).join(" · ") : "Não informada");
  y += 17;
  drawCell(x, y, 118, 13, "LOCAL:", input.location || "Não informado");
  drawCell(x + 118, y, 60, 13, "PARTICIPANTES PREVISTOS:", String(participants.length));
  y += 13;
  drawCell(x, y, 106, 13, "INSTRUTOR(A) / RESPONSÁVEL:", input.instructorName || "Não informado");
  drawCell(x + 106, y, 72, 13, "EMPRESA / AMBIENTE:", input.companyName || input.workspaceName);
  y += 18;

  const drawTableHeader = () => {
    doc.setFillColor(77, 86, 95);
    doc.rect(x, y, pageWidth, 10, "F");
    doc.setDrawColor(64, 72, 80);
    doc.rect(x, y, pageWidth, 10);
    [x, x + 8, x + 67, x + 99, x + 136, x + 178].forEach(position => doc.line(position, y, position, y + 10));
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.text("Nº", x + 2, y + 6.2);
    doc.text("NOME", x + 10, y + 6.2);
    doc.text("CPF", x + 69, y + 6.2);
    doc.text("FUNÇÃO", x + 101, y + 6.2);
    doc.text("ASSINATURA", x + 142, y + 6.2);
    y += 10;
  };

  drawTableHeader();
  participants.forEach((participant, index) => {
    if (y > 267) {
      doc.addPage();
      y = 22;
      doc.setTextColor(6, 59, 67);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("LISTA DE PRESENÇA — CONTINUAÇÃO", x, y);
      y += 8;
      drawTableHeader();
    }
    const height = 11;
    doc.setFillColor(index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 252, index % 2 === 0 ? 255 : 253);
    doc.rect(x, y, pageWidth, height, "F");
    doc.setDrawColor(112, 120, 128);
    doc.rect(x, y, pageWidth, height);
    [x + 8, x + 67, x + 99, x + 136].forEach(position => doc.line(position, y, position, y + height));
    doc.setTextColor(31, 41, 55);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(String(index + 1), x + 2, y + 6.8);
    if (participant.fullName) doc.text(participant.fullName.slice(0, 42), x + 10, y + 6.8);
    if (participant.cpf) doc.text(participant.cpf.slice(0, 20), x + 69, y + 6.8);
    if (participant.roleName) doc.text(participant.roleName.slice(0, 24), x + 101, y + 6.8);
    y += height;
  });

  if (!participants.length) {
    doc.setTextColor(171, 92, 14);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.text("Nenhum participante foi informado no planejamento deste treinamento.", x, y + 7);
    y += 12;
  }

  y += 15;
  if (y > 248) { doc.addPage(); y = 35; }
  doc.setDrawColor(64, 72, 80);
  doc.line(25, y, 92, y);
  doc.line(118, y, 185, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 99, 106);
  doc.text("Instrutor(a) / responsável", 40, y + 5);
  doc.text("Representante da empresa", 132, y + 5);
  return doc;
}

export function downloadTrainingAttendancePdf(input: TrainingAttendanceInput) {
  const doc = buildTrainingAttendancePdf(input);
  doc.save(`${safeFileName(input.title)}-ata-lista-presenca.pdf`);
}

export { formatDate, safeFileName };
export type { InspectionRecord, ActionRecord, InspectionReportInput, PgrReportInput };

export function downloadInspectionReportPdf(input: InspectionReportInput) {
  const document = buildInspectionReportPdf(input);
  document.save(`${safeFileName(input.companyName)}-inspecoes-plano-acao.pdf`);
}

export type ConsolidatedEpiReportInput = {
  workspaceName: string;
  companyName: string;
  generatedAt?: PdfDate;
  epiItems: Array<{
    name: string;
    caNumber?: string | null;
    manufacturer?: string | null;
    stockQuantity: number;
    minimumStock: number;
    expiresAt?: PdfDate;
  }>;
  deliveriesCount: number;
};

export function downloadConsolidatedEpiReportPdf(input: ConsolidatedEpiReportInput) {
  const doc = setupDocument("Relatório Consolidado de Estoque e EPIs (NR-06)", input.workspaceName, input.generatedAt);
  let y = 56;

  doc.setFillColor(242, 250, 248);
  doc.roundedRect(16, y, 178, 20, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(12, 116, 116);
  doc.text("EMPRESA EM FOCO", 20, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 99, 106);
  doc.text(`Empresa: ${input.companyName}`, 20, y + 14);
  doc.text(`Total de Equipamentos: ${input.epiItems.length}`, 115, y + 14);
  y += 28;

  doc.setTextColor(12, 116, 116);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("01. INVENTÁRIO DE ESTOQUE E CERTIFICADOS DE APROVAÇÃO (CA)", 16, y);
  y += 8;

  doc.setFillColor(12, 116, 116);
  doc.rect(16, y, 178, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Equipamento / EPI", 19, y + 5);
  doc.text("CA", 90, y + 5);
  doc.text("Estoque", 120, y + 5);
  doc.text("Validade CA", 145, y + 5);
  y += 7;

  input.epiItems.forEach((item, index) => {
    y = ensureSpace(doc, y, 10);
    doc.setFillColor(index % 2 === 0 ? 245 : 255, 247, 247);
    doc.rect(16, y, 178, 8, "F");
    doc.setTextColor(16, 43, 50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(item.name.substring(0, 40), 19, y + 5);
    doc.setFont("helvetica", "normal");
    doc.text(item.caNumber || "N/D", 90, y + 5);
    doc.text(`${item.stockQuantity} un. (Min: ${item.minimumStock})`, 120, y + 5);
    doc.text(item.expiresAt ? new Date(item.expiresAt).toLocaleDateString("pt-BR") : "Vigente", 145, y + 5);
    y += 8;
  });

  doc.save(`Relatorio_Consolidado_EPIs_${input.companyName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
}

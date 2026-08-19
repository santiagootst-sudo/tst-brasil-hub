import { jsPDF } from "jspdf";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  PageBreak,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { hydratePgrImageAttachments } from "./pgrAttachmentMedia";

export type PgrExportModules = {
  cover: boolean;
  summary: boolean;
  companyInfo: boolean;
  gheInventory: boolean;
  riskMatrix: boolean;
  actionPlan: boolean;
  attachments?: boolean;
};

export type PgrDocumentAttachment = {
  title: string;
  category: string;
  fileUrl: string;
  createdAt?: Date | string | null;
  mimeType?: string;
  inlineDataUrl?: string;
};

export type PgrReportInput = {
  workspaceName: string;
  companyName?: string | null;
  projectName: string;
  projectId: number;
  generatedAt?: Date | string | null;
  modules?: PgrExportModules;
  pgrData?: unknown;
  attachments?: PgrDocumentAttachment[];
};

type RecordValue = Record<string, unknown>;

type NormalizedGhe = {
  name: string;
  sector: string;
  description: string;
  workers: string;
  workday: string;
  process: string;
};

type NormalizedRisk = {
  ghe: string;
  category: string;
  hazard: string;
  source: string;
  probability?: number;
  severity?: number;
  classification: string;
  controls: string;
  exposure: string;
  healthEffects: string;
  exposedGroup: string;
  methodology: string;
  measurementLimit: string;
  measurementResult: string;
  monitoring: string;
  controlHierarchy: string;
  responsible: string;
};

type NormalizedAction = {
  description: string;
  responsible: string;
  deadline: string;
  status: string;
  legalBasis: string;
  evidenceLocation: string;
  implementationMethod: string;
  cost: string;
  priority: string;
  followUp: string;
};

type NormalizedAttachment = {
  title: string;
  category: string;
  url: string;
  createdAt: string;
  inlineDataUrl?: string;
};

type NormalizedPgrData = {
  company: {
    legalName: string;
    cnpj: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    activity: string;
    riskLevel: string;
    processDescription: string;
    employees: string;
    cnae: string;
    establishment: string;
    responsibleName: string;
    responsibleRole: string;
    responsibleRegistry: string;
    validityStart: string;
    validityEnd: string;
    revision: string;
  };
  ghes: NormalizedGhe[];
  risks: NormalizedRisk[];
  actions: NormalizedAction[];
  mapImage?: string;
  mapPoints: Array<{ color: string; description: string }>;
  signature?: { name: string; registry: string; title: string; date: string };
  revisions: Array<{ date: string; version: string; description: string; responsible: string }>;
  inspectionNotes: string;
  responsibilities: Array<{ subject: string; description: string; responsible: string }>;
  measurements: Array<{ ghe: string; agent: string; result: string; limit: string; method: string; equipment: string; date: string; status: string }>;
  inspections: Array<{ date: string; description: string; responsible: string; status: string }>;
  changes: Array<{ date: string; description: string; impact: string; responsible: string }>;
  trainings: Array<{ title: string; date: string; instructor: string; nr: string; periodicity: string }>;
  attachments: NormalizedAttachment[];
  emergency: { responsible: string; resources: string; routes: string; periodicity: string; nextDrill: string };
};

const PALETTE = {
  navy: "063B43",
  teal: "0C7474",
  ink: "102B32",
  muted: "5D7479",
  line: "CFE3DE",
  soft: "F4F9F8",
  white: "FFFFFF",
  green: "15803D",
  amber: "C87810",
  orange: "C85F1A",
  red: "B42318",
};

const DEFAULT_MODULES: PgrExportModules = {
  cover: true,
  summary: true,
  companyInfo: true,
  gheInventory: true,
  riskMatrix: true,
  actionPlan: true,
  attachments: true,
};

function asRecord(value: unknown): RecordValue {
  return value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
}

function asArray(value: unknown): RecordValue[] {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (Array.isArray(value)) {
      const joined = value.filter(item => typeof item === "string" && item.trim()).map(item => String(item).trim()).join(" · ");
      if (joined) return joined;
    }
  }
  return "";
}

function asNumber(...values: unknown[]) {
  for (const value of values) {
    const parsed = typeof value === "number" ? value : Number(String(value ?? "").replace(",", "."));
    if (Number.isFinite(parsed) && parsed > 0) return Math.max(1, Math.min(5, Math.round(parsed)));
  }
  return undefined;
}

function display(value: string, fallback = "Não informado") {
  return value.trim() || fallback;
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return new Date().toLocaleDateString("pt-BR");
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "Não informado" : date.toLocaleDateString("pt-BR");
}

function normalizePgrData(input: PgrReportInput): NormalizedPgrData {
  const raw = asRecord(input.pgrData);
  const company = asRecord(raw.empresa);
  const signature = asRecord(raw.assinatura);
  const technical = asRecord(raw.responsavelTecnico ?? raw.responsavel ?? raw.elaborador);
  const map = asRecord(raw.mapaRisco);
  const ghes = asArray(raw.ghes).map(item => ({
    name: firstText(item.funcao, item.nome, item.name, item.ghe, item.titulo),
    sector: firstText(item.setor, item.area, item.department),
    description: firstText(item.descricao, item.description, item.atividades),
    workers: firstText(item.quantidade, item.funcionarios, item.workers),
    workday: firstText(item.jornada, item.horario, item.turno),
    process: firstText(item.processo, item.processoTrabalho, item.atividade),
  })).filter(item => item.name || item.sector || item.description);
  const risks = asArray(raw.riscos).map(item => ({
    ghe: firstText(item.ghe, item.funcao, item.setor, item.area),
    category: firstText(item.categoria, item.tipo, item.category),
    hazard: firstText(item.risco, item.perigo, item.tipo, item.agente, item.hazard, item.descricao),
    source: firstText(item.fonte, item.fonteGeradora, item.agenteNocivo, item.atividade, item.origem),
    probability: asNumber(item.probabilidade, item.prob, item.p),
    severity: asNumber(item.severidade, item.sev, item.s),
    classification: firstText(item.classificacao, item.nivel, item.resultado),
    controls: firstText(item.medidas, item.medida, item.controle, item.controles, item.medidasControle, item.recomendacoes),
    exposure: firstText(item.exposicao, item.frequencia, item.tempoExposicao),
    healthEffects: firstText(item.lesoes, item.agravos, item.danos, item.danosSaude, item.consequencias),
    exposedGroup: firstText(item.grupoExposto, item.trabalhadoresExpostos, item.funcao, item.ghe),
    methodology: firstText(item.metodologia, item.criterio, item.metodo),
    measurementLimit: firstText(item.limite, item.tolerancia, item.valorReferencia),
    measurementResult: firstText(item.encontrado, item.resultadoMedicao, item.medicao, item.valorEncontrado),
    monitoring: firstText(item.monitoramento, item.acompanhamento, item.evidencia),
    controlHierarchy: firstText(item.hierarquia, item.hierarquiaControle),
    responsible: firstText(item.responsavel, item.responsible),
  })).filter(item => item.hazard || item.ghe || item.category);
  const actions = asArray(raw.acoes).map(item => ({
    description: firstText(item.descricao, item.acao, item.medida, item.what, item.titulo, item.title),
    responsible: firstText(item.responsavel, item.responsible, item.resp, item.who),
    deadline: firstText(item.prazo, item.data, item.dueDate, item.previsao, item.when),
    status: firstText(item.status, item.situacao),
    legalBasis: firstText(item.norma, item.fundamento, item.porque, item.why),
    evidenceLocation: firstText(item.onde, item.where, item.localComprovacao, item.comprovacao, item.evidencia),
    implementationMethod: firstText(item.comoSeraFeito, item.comoFazer, item.how, item.metodo, item.implementacao),
    cost: firstText(item.custo, item.custoTotal, item.orcamento),
    priority: firstText(item.prioridade, item.nivelRisco, item.classificacao),
    followUp: firstText(item.acompanhamento, item.verificacao, item.afericao),
  })).filter(item => item.description || item.responsible || item.deadline);
  const mapPoints = asArray(map.circulos ?? raw.mapaCirculos).map(item => ({
    color: firstText(item.cor, item.color, "verde"),
    description: firstText(item.descricao, item.risco, item.label, "Ponto de risco"),
  }));
  const mapImage = firstText(map.imagem, raw.mapaImagemData, raw.mapaImagemCache);
  const revisions = asArray(raw.revisoes ?? raw.historicoRevisoes).map(item => ({
    date: firstText(item.data, item.date),
    version: firstText(item.versao, item.version, item.revisao),
    description: firstText(item.descricao, item.alteracao, item.motivo),
    responsible: firstText(item.responsavel, item.elaboradoPor, item.author),
  })).filter(item => item.date || item.version || item.description);
  const rights = asRecord(raw.direitos);
  const responsibilities = [
    ...asArray(raw.responsabilidades).map(item => ({
      subject: firstText(item.area, item.tipo, item.cargo, item.titulo, "Responsabilidade registrada"),
      description: firstText(item.descricao, item.responsabilidade, item.atividade, item.texto),
      responsible: firstText(item.responsavel, item.nome, item.responsible),
    })),
    ...(firstText(rights.deveresEmpregador) ? [{ subject: "Responsabilidades da organização", description: firstText(rights.deveresEmpregador), responsible: "Organização" }] : []),
    ...(firstText(rights.deveresEmpregado) ? [{ subject: "Responsabilidades dos trabalhadores", description: firstText(rights.deveresEmpregado), responsible: "Trabalhadores" }] : []),
  ].filter(item => item.description || item.responsible);
  const measurements = asArray(raw.medicoes).map(item => ({
    ghe: firstText(item.ghe, item.setor, item.area),
    agent: firstText(item.agenteNome, item.agenteNocivo, item.agente, item.risco),
    result: firstText(item.valor, item.resultado, item.medicao, item.unidade),
    limit: firstText(item.limite, item.limiteTolerancia, item.nivelAcao),
    method: firstText(item.tecnica, item.metodo, item.metodologia),
    equipment: firstText(item.equipamento),
    date: firstText(item.data, item.dataMedicao),
    status: firstText(item.status, item.conclusao),
  })).filter(item => item.agent || item.result || item.ghe);
  const inspections = asArray(asRecord(raw.inspecoes).historico ?? raw.inspecoes).map(item => ({
    date: firstText(item.data, item.date),
    description: firstText(item.descricao, item.observacao, item.title, item.titulo),
    responsible: firstText(item.responsavel, item.responsible),
    status: firstText(item.status, item.situacao),
  })).filter(item => item.date || item.description);
  const changes = asArray(raw.mudancas).map(item => ({
    date: firstText(item.data, item.date),
    description: firstText(item.descricao, item.mudanca, item.title),
    impact: firstText(item.impacto, item.avaliacao, item.risco),
    responsible: firstText(item.responsavel, item.responsible),
  })).filter(item => item.date || item.description);
  const trainings = asArray(raw.treinamentos).map(item => ({
    title: firstText(item.titulo, item.nome, item.title),
    date: firstText(item.data, item.date),
    instructor: firstText(item.instrutor, item.responsavel),
    nr: firstText(item.nr, item.norma),
    periodicity: firstText(item.periodicidade),
  })).filter(item => item.title || item.date);
  const attachments = [
    ...(input.attachments ?? []).map(item => ({ title: item.title, category: item.category, url: item.fileUrl, createdAt: firstText(item.createdAt), inlineDataUrl: item.inlineDataUrl })),
    ...asArray(raw.documentos).map(item => ({ title: firstText(item.nome, item.titulo, item.descricao, "Documento técnico cadastrado"), category: firstText(item.tipo, "other"), url: firstText(item.arquivoUrl, item.url), createdAt: firstText(item.data, item.dataCriacao), inlineDataUrl: firstText(item.imagemData, item.previewDataUrl) || undefined })),
    ...asArray(raw.laudos).map(item => ({ title: firstText(item.nome, item.titulo, item.descricao, "Laudo técnico cadastrado"), category: "laudo", url: firstText(item.arquivoUrl, item.url), createdAt: firstText(item.data, item.dataCriacao), inlineDataUrl: firstText(item.imagemData, item.previewDataUrl) || undefined })),
  ].filter(item => item.title || item.url);
  const emergency = asRecord(raw.emergencias);

  return {
    company: {
      legalName: firstText(company.razaoSocial, company.nome, input.companyName),
      cnpj: firstText(company.cnpj),
      address: firstText(company.endereco),
      city: firstText(company.cidade),
      phone: firstText(company.telefone),
      email: firstText(company.email),
      activity: firstText(company.ramoAtividade, company.cnae, company.atividade),
      riskLevel: firstText(company.grauRisco),
      processDescription: firstText(company.descricaoProcesso),
      employees: firstText(company.numFuncionarios),
      cnae: firstText(company.cnae),
      establishment: firstText(company.estabelecimento, company.unidade, company.localAtividade),
      responsibleName: firstText(technical.nome, company.responsavel, raw.responsavelPgr),
      responsibleRole: firstText(technical.titulo, technical.funcao, technical.cargo),
      responsibleRegistry: firstText(technical.crea, technical.registro, technical.mte),
      validityStart: firstText(company.vigenciaInicial, company.inicioVigencia, raw.vigenciaInicial),
      validityEnd: firstText(company.vigenciaFinal, company.fimVigencia, raw.vigenciaFinal),
      revision: firstText(company.revisao, raw.revisao, raw.versao),
    },
    ghes,
    risks,
    actions,
    mapImage: mapImage || undefined,
    mapPoints,
    signature: firstText(signature.nome, signature.crea, signature.titulo, signature.data)
      ? { name: firstText(signature.nome), registry: firstText(signature.crea, signature.registro), title: firstText(signature.titulo), date: firstText(signature.data) }
      : undefined,
    revisions,
    inspectionNotes: firstText(raw.observacoesGerais, raw.inspecaoGeral, raw.notasInspecao),
    responsibilities,
    measurements,
    inspections,
    changes,
    trainings,
    attachments,
    emergency: {
      responsible: firstText(emergency.responsavel_ps, emergency.responsavel_enc, emergency.responsavel_abandono),
      resources: firstText(emergency.recursos_ps, emergency.recursos_enc),
      routes: firstText(emergency.rotas_fuga),
      periodicity: firstText(emergency.periodicidade),
      nextDrill: firstText(emergency.proximo_simulado),
    },
  };
}

function safeFileName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "relatorio-pgr";
}

function riskTone(score: number) {
  if (score <= 4) return { color: PALETTE.green, label: "Baixo" };
  if (score <= 9) return { color: "D59A00", label: "Moderado" };
  if (score <= 16) return { color: PALETTE.orange, label: "Alto" };
  return { color: PALETTE.red, label: "Crítico" };
}

function riskScore(risk: NormalizedRisk) {
  return risk.probability && risk.severity ? risk.probability * risk.severity : undefined;
}

function workplacePresentation(data: NormalizedPgrData) {
  const environmentCount = data.ghes.length;
  const workerText = data.company.employees || data.ghes.reduce((total, ghe) => total + (Number(ghe.workers) || 0), 0).toString();
  const unit = [data.company.establishment, data.company.address, data.company.city].filter(Boolean).join(" · ");
  const process = display(data.company.processDescription, "O processo de trabalho deve ser descrito no cadastro do projeto.");
  return [
    `O presente PGR refere-se ao estabelecimento ${display(data.company.legalName)}${unit ? `, localizado em ${unit}` : ""}.`,
    `A atividade econômica informada é ${display(data.company.activity || data.company.cnae)}. O projeto registra ${environmentCount ? `${environmentCount} grupo(s) de exposição, cargo(s) ou ambiente(s)` : "ainda não registra grupos de exposição ou ambientes"}${workerText ? ` e ${workerText} trabalhador(es) informados` : ""}.`,
    `O processo de trabalho apresentado para esta emissão é: ${process}`,
  ];
}

function methodologyRows(data: NormalizedPgrData) {
  const hasMeasurement = data.risks.some(risk => risk.measurementLimit || risk.measurementResult);
  const explicitMethods = Array.from(new Set(data.risks.map(risk => risk.methodology).filter(Boolean)));
  return [
    ["Caracterização do ambiente", "Consolidação dos processos, ambientes, atividades, cargos e grupos de exposição registrados no projeto."],
    ["Identificação de perigos", "Leitura dos perigos, fontes ou circunstâncias, exposição, possíveis agravos e controles cadastrados em cada risco."],
    ["Agrupamento de exposição", "Organização do inventário por GHE, cargo ou setor informado para relacionar risco, atividade e grupo exposto."],
    ["Avaliação qualitativa", "Classificação dos riscos a partir de probabilidade, severidade e controles declarados no inventário."],
    ["Avaliação quantitativa / monitoramento", hasMeasurement ? "Limites de referência, resultados e monitoramentos cadastrados são apresentados nos respectivos riscos." : "Não há resultados quantitativos cadastrados nesta emissão. Quando aplicável, os dados de medição devem ser incluídos no risco correspondente."],
    ["Métodos específicos declarados", explicitMethods.length ? explicitMethods.join(" · ") : "Nenhum método específico foi informado nos riscos cadastrados."],
    ["Priorização e plano de ação", "A matriz P × S e o plano 5W2H apoiam a priorização, a definição de responsáveis, prazos e o acompanhamento das medidas."],
  ];
}

function recordAndDisclosureRows(data: NormalizedPgrData) {
  return [
    ["Registro", "Os dados usados nesta emissão permanecem vinculados ao projeto PGR correspondente e à sua data de geração."],
    ["Atualização", "O inventário e o plano de ação devem ser revisados quando houver alterações relevantes nos processos, ambientes, riscos ou medidas de prevenção."],
    ["Manutenção", `Esta emissão contém ${data.revisions.length || 1} registro(s) de revisão. O histórico deve ser preservado conforme a política documental aplicável.`],
    ["Divulgação", "A organização deve definir a forma de disponibilização das informações aos trabalhadores, representantes e fiscalização, conforme seus procedimentos e requisitos aplicáveis."],
  ];
}

function attachmentCategoryLabel(category: string) {
  const normalized = category.toLocaleLowerCase();
  if (normalized === "laudo") return "Laudo técnico";
  if (normalized === "certificate" || normalized === "certificado") return "Certificado / calibração";
  if (normalized === "art" || normalized === "rrt") return "ART / RRT";
  if (normalized === "photo" || normalized === "foto") return "Registro fotográfico";
  return "Documento operacional";
}

function attachmentRows(data: NormalizedPgrData) {
  return data.attachments.map(item => [
    attachmentCategoryLabel(item.category),
    display(item.title),
    display(item.createdAt, "Data não informada"),
    item.url || "Vinculado ao projeto sem endereço eletrônico disponível",
  ]);
}

function visualAttachmentRows(data: NormalizedPgrData) {
  return data.attachments.filter(item => Boolean(item.inlineDataUrl));
}

function pdfText(doc: jsPDF, text: string, x: number, y: number, width: number, size = 9, color = PALETTE.muted, bold = false) {
  doc.setTextColor(color);
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(size);
  const lines = doc.splitTextToSize(display(text), width) as string[];
  doc.text(lines, x, y);
  return y + Math.max(1, lines.length) * (size * 0.48);
}

function pdfHeader(doc: jsPDF, input: PgrReportInput, section: string) {
  doc.setFillColor(PALETTE.navy);
  doc.rect(0, 0, 210, 24, "F");
  doc.setFillColor(PALETTE.teal);
  doc.rect(0, 24, 210, 3, "F");
  doc.setTextColor(PALETTE.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("PGR · PROGRAMA DE GERENCIAMENTO DE RISCOS", 16, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(`${input.projectName} · ${input.workspaceName}`, 16, 18);
  doc.setTextColor(PALETTE.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(section, 16, 39);
}

function pdfFooter(doc: jsPDF, input: PgrReportInput) {
  const page = doc.getNumberOfPages();
  doc.setDrawColor(PALETTE.line);
  doc.line(16, 286, 194, 286);
  doc.setTextColor(PALETTE.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`Projeto ${input.projectId} · Emissão ${formatDate(input.generatedAt)}`, 16, 291);
  doc.text(`Página ${page}`, 194, 291, { align: "right" });
}

function pdfNewPage(doc: jsPDF, input: PgrReportInput, title: string) {
  pdfFooter(doc, input);
  doc.addPage();
  pdfHeader(doc, input, title);
  return 50;
}

function pdfTable(doc: jsPDF, input: PgrReportInput, y: number, headers: string[], widths: number[], rows: string[][], title: string) {
  const x = 16;
  const tableWidth = widths.reduce((sum, value) => sum + value, 0);
  const headerHeight = 8;
  const drawHead = () => {
    doc.setFillColor(PALETTE.teal);
    doc.rect(x, y, tableWidth, headerHeight, "F");
    let cursor = x;
    headers.forEach((header, index) => {
      pdfText(doc, header, cursor + 2, y + 5.3, widths[index] - 4, 7, PALETTE.white, true);
      cursor += widths[index];
    });
    y += headerHeight;
  };
  drawHead();
  if (!rows.length) {
    doc.setFillColor("F8FBFA");
    doc.rect(x, y, tableWidth, 13, "F");
    pdfText(doc, "Nenhum registro cadastrado neste projeto.", x + 3, y + 7, tableWidth - 6, 8, PALETTE.muted);
    return y + 16;
  }
  rows.forEach((row, rowIndex) => {
    const lineGroups = row.map((cell, index) => doc.splitTextToSize(display(cell, "—"), widths[index] - 4) as string[]);
    const maxLines = Math.max(...lineGroups.map(lines => lines.length));
    const height = Math.max(9, maxLines * 4.2 + 4);
    if (y + height > 278) {
      y = pdfNewPage(doc, input, title);
      drawHead();
    }
    doc.setFillColor(rowIndex % 2 === 0 ? "F8FBFA" : PALETTE.white);
    doc.rect(x, y, tableWidth, height, "F");
    doc.setDrawColor(PALETTE.line);
    doc.rect(x, y, tableWidth, height);
    let cursor = x;
    row.forEach((cell, index) => {
      doc.setFont("helvetica", index === 0 ? "bold" : "normal");
      doc.setTextColor(PALETTE.ink);
      doc.setFontSize(7.4);
      doc.text(lineGroups[index], cursor + 2, y + 4.8);
      cursor += widths[index];
    });
    y += height;
  });
  return y + 6;
}

function drawRiskMatrix(doc: jsPDF, data: NormalizedPgrData, x: number, y: number) {
  const cell = 22;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(PALETTE.ink);
  doc.text("SEVERIDADE →", x + 28, y - 5);
  doc.text("PROBABILIDADE", x - 1, y + cell * 2.5, { angle: 90 });
  const counts = new Map<string, number>();
  data.risks.forEach(risk => {
    if (risk.probability && risk.severity) {
      const key = `${risk.probability}-${risk.severity}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  });
  for (let severity = 1; severity <= 5; severity += 1) {
    doc.setTextColor(PALETTE.muted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(String(severity), x + 11 + (severity - 1) * cell, y - 1, { align: "center" });
  }
  for (let probability = 5; probability >= 1; probability -= 1) {
    const row = 5 - probability;
    doc.setTextColor(PALETTE.muted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(String(probability), x - 6, y + row * cell + 13, { align: "center" });
    for (let severity = 1; severity <= 5; severity += 1) {
      const tone = riskTone(probability * severity);
      const cellX = x + (severity - 1) * cell;
      const cellY = y + row * cell;
      const rgb = tone.color.match(/.{1,2}/g)?.map(part => Number.parseInt(part, 16)) ?? [200, 200, 200];
      doc.setFillColor(rgb[0], rgb[1], rgb[2]);
      doc.rect(cellX, cellY, cell, cell, "F");
      doc.setDrawColor(PALETTE.white);
      doc.rect(cellX, cellY, cell, cell);
      const total = counts.get(`${probability}-${severity}`) ?? 0;
      doc.setTextColor(PALETTE.white);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(total ? 10 : 7);
      doc.text(total ? String(total) : String(probability * severity), cellX + cell / 2, cellY + 13, { align: "center" });
    }
  }
  doc.setTextColor(PALETTE.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Cada célula mostra a pontuação P × S; números maiores indicam registros reais posicionados no inventário.", x, y + cell * 5 + 8);
}

function imageType(dataUrl: string) {
  const match = /^data:image\/(png|jpeg|jpg|webp);/i.exec(dataUrl);
  return (match?.[1] ?? "png").toUpperCase() as "PNG" | "JPEG" | "WEBP";
}

function buildPgrReportV1(input: PgrReportInput) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const modules = { ...DEFAULT_MODULES, ...input.modules };
  const data = normalizePgrData(input);
  let y = 18;

  if (modules.cover) {
    doc.setFillColor(PALETTE.navy);
    doc.rect(0, 0, 210, 297, "F");
    doc.setFillColor(PALETTE.teal);
    doc.rect(0, 0, 210, 12, "F");
    doc.setTextColor(PALETTE.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("DOCUMENTO TÉCNICO DE SST", 16, 32);
    doc.setFontSize(23);
    doc.text("PROGRAMA DE", 16, 62);
    doc.text("GERENCIAMENTO", 16, 73);
    doc.text("DE RISCOS", 16, 84);
    doc.setTextColor("8EDEC7");
    doc.setFontSize(12);
    doc.text("PGR · NR-01", 16, 98);
    doc.setDrawColor("5AA39A");
    doc.line(16, 112, 194, 112);
    doc.setTextColor(PALETTE.white);
    doc.setFontSize(10);
    doc.text("EMPRESA", 16, 132);
    doc.setFontSize(16);
    doc.text(display(data.company.legalName, "Empresa não identificada"), 16, 143, { maxWidth: 178 });
    doc.setFontSize(9);
    doc.setTextColor("D7ECE8");
    doc.text(`Projeto: ${input.projectName}`, 16, 162);
    doc.text(`Ambiente: ${input.workspaceName}`, 16, 169);
    doc.text(`Emissão: ${formatDate(input.generatedAt)}`, 16, 176);
    doc.setFillColor(PALETTE.white);
    doc.roundedRect(16, 220, 178, 38, 3, 3, "F");
    doc.setTextColor(PALETTE.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("ESCOPO DOCUMENTAL", 23, 233);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const scope = "Identificação da empresa, inventário de riscos, matriz de avaliação, mapa de risco e plano de ação. Os registros refletem exclusivamente o conteúdo preenchido neste projeto.";
    doc.text(doc.splitTextToSize(scope, 158), 23, 242);
    pdfFooter(doc, input);
    doc.addPage();
  }

  pdfHeader(doc, input, "Relatório técnico consolidado");
  y = 51;
  if (modules.summary) {
    doc.setTextColor(PALETTE.teal);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Sumário executivo", 16, y);
    y += 8;
    const items = [
      modules.companyInfo && "01. Identificação e escopo",
      modules.gheInventory && "02. Inventário de GHEs e perigos",
      modules.riskMatrix && "03. Matriz de riscos e mapa visual",
      modules.actionPlan && "04. Plano de ação",
      "05. Rastreabilidade e responsabilidade técnica",
    ].filter(Boolean) as string[];
    items.forEach((item, index) => {
      doc.setFillColor("E8F6F1");
      doc.circle(20, y - 1.5, 2.4, "F");
      pdfText(doc, item, 27, y, 150, 9, PALETTE.ink, index === 0);
      y += 7;
    });
    y += 4;
  }

  if (modules.companyInfo) {
    doc.setTextColor(PALETTE.teal);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("01. Identificação e escopo", 16, y);
    y += 8;
    y = pdfTable(doc, input, y, ["Campo", "Informação registrada"], [55, 123], [
      ["Razão social", data.company.legalName],
      ["CNPJ", data.company.cnpj],
      ["Endereço", [data.company.address, data.company.city].filter(Boolean).join(" · ")],
      ["Contato", [data.company.phone, data.company.email].filter(Boolean).join(" · ")],
      ["Atividade / CNAE", data.company.activity],
      ["Grau de risco", data.company.riskLevel],
      ["Trabalhadores", data.company.employees],
    ], "01. Identificação e escopo");
    y = pdfText(doc, `Processo produtivo: ${display(data.company.processDescription, "Não informado no projeto.")}`, 16, y, 178, 8.5, PALETTE.muted) + 6;
  }

  if (modules.gheInventory) {
    if (y > 230) y = pdfNewPage(doc, input, "02. Inventário de GHEs e perigos");
    doc.setTextColor(PALETTE.teal);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("02. Inventário de GHEs e perigos", 16, y);
    y += 8;
    y = pdfTable(doc, input, y, ["GHE / cargo", "Setor", "Atividade / descrição", "Trab."], [42, 32, 84, 20], data.ghes.map(ghe => [ghe.name, ghe.sector, ghe.description, ghe.workers]), "02. Inventário de GHEs e perigos");
    y = pdfTable(doc, input, y, ["GHE / setor", "Categoria e perigo", "Fonte / atividade", "Controle registrado"], [36, 52, 40, 50], data.risks.map(risk => [risk.ghe, [risk.category, risk.hazard].filter(Boolean).join(" · "), risk.source, risk.controls]), "02. Inventário de GHEs e perigos");
  }

  if (modules.riskMatrix) {
    y = pdfNewPage(doc, input, "03. Matriz de riscos e mapa visual");
    doc.setTextColor(PALETTE.teal);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("03. Matriz de avaliação de riscos", 16, y);
    y += 7;
    pdfText(doc, "Matriz 5 × 5 construída a partir das probabilidades e severidades registradas no inventário do projeto. Não há riscos exemplificativos nesta emissão.", 16, y, 178, 8.5);
    y += 12;
    drawRiskMatrix(doc, data, 48, y);
    y += 128;
    y = pdfTable(doc, input, y, ["Perigo", "P", "S", "Resultado", "Classificação"], [78, 16, 16, 30, 38], data.risks.map(risk => {
      const score = riskScore(risk);
      return [risk.hazard, risk.probability ? String(risk.probability) : "—", risk.severity ? String(risk.severity) : "—", score ? String(score) : "—", risk.classification || (score ? riskTone(score).label : "Não avaliada")];
    }), "03. Matriz de riscos e mapa visual");
    if (data.mapImage || data.mapPoints.length) {
      if (y > 190) y = pdfNewPage(doc, input, "03. Matriz de riscos e mapa visual");
      doc.setTextColor(PALETTE.teal);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Mapa de risco", 16, y);
      y += 7;
      if (data.mapImage) {
        try {
          doc.addImage(data.mapImage, imageType(data.mapImage), 20, y, 170, 92);
          y += 98;
        } catch {
          y = pdfText(doc, "A imagem do mapa foi cadastrada, mas não pôde ser incorporada a esta cópia. Reabra o PGR e salve o mapa antes de emitir novamente.", 16, y, 178, 8.5, PALETTE.red) + 5;
        }
      }
      if (data.mapPoints.length) {
        y = pdfTable(doc, input, y, ["Ponto", "Classificação visual", "Descrição"], [20, 46, 112], data.mapPoints.map((point, index) => [String(index + 1), point.color, point.description]), "03. Matriz de riscos e mapa visual");
      }
    } else {
      y = pdfText(doc, "Mapa de risco ainda não cadastrado neste projeto. A emissão preserva esta informação em vez de criar uma planta ou pontos fictícios.", 16, y, 178, 8.5, PALETTE.muted) + 5;
    }
  }

  if (modules.actionPlan) {
    y = pdfNewPage(doc, input, "04. Plano de ação");
    doc.setTextColor(PALETTE.orange);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("04. Plano de ação e medidas preventivas", 16, y);
    y += 8;
    y = pdfTable(doc, input, y, ["Ação / medida", "Responsável", "Prazo", "Status"], [88, 35, 25, 30], data.actions.map(action => [action.description, action.responsible, action.deadline, action.status]), "04. Plano de ação");
  }

  if (y > 230) y = pdfNewPage(doc, input, "05. Rastreabilidade e responsabilidade técnica");
  doc.setDrawColor(PALETTE.line);
  doc.line(16, y, 194, y);
  y += 10;
  doc.setTextColor(PALETTE.teal);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("05. Rastreabilidade e responsabilidade técnica", 16, y);
  y += 8;
  y = pdfText(doc, `Este relatório foi emitido em ${formatDate(input.generatedAt)} a partir dos dados efetivamente registrados no projeto “${input.projectName}”. A validação e assinatura técnica devem ser atribuídas somente ao profissional legalmente habilitado responsável.`, 16, y, 178, 8.5) + 5;
  if (data.signature) {
    doc.setFillColor(PALETTE.soft);
    doc.roundedRect(16, y, 178, 26, 3, 3, "F");
    doc.setTextColor(PALETTE.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(display(data.signature.name), 22, y + 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text([data.signature.title, data.signature.registry].filter(Boolean).join(" · "), 22, y + 14);
    doc.text(data.signature.date ? `Data registrada: ${data.signature.date}` : "Assinatura registrada no projeto", 22, y + 20);
  }
  pdfFooter(doc, input);
  return doc;
}

function pdfSectionHeading(doc: jsPDF, title: string, subtitle?: string) {
  doc.setFillColor("E8F1EE");
  doc.rect(16, 43, 178, 10, "F");
  doc.setDrawColor(PALETTE.teal);
  doc.setLineWidth(0.6);
  doc.line(16, 43, 16, 53);
  doc.setTextColor(PALETTE.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(title.toUpperCase(), 20, 49.4);
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(PALETTE.muted);
    doc.text(subtitle, 20, 59);
    return 66;
  }
  return 61;
}

function formalPdfHeader(doc: jsPDF, input: PgrReportInput, company: NormalizedPgrData["company"], section: string) {
  doc.setFillColor(PALETTE.white);
  doc.rect(0, 0, 210, 297, "F");
  doc.setDrawColor(PALETTE.line);
  doc.setLineWidth(0.4);
  doc.line(16, 17, 194, 17);
  doc.setTextColor(PALETTE.teal);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("PGR · PROGRAMA DE GERENCIAMENTO DE RISCOS", 16, 11.5);
  doc.setTextColor(PALETTE.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.text(display(company.legalName, input.companyName ?? "Empresa não identificada"), 194, 11.5, { align: "right" });
  doc.setFontSize(7.2);
  doc.text(section, 16, 27);
}

function formalPdfFooter(doc: jsPDF, input: PgrReportInput, company: NormalizedPgrData["company"]) {
  const page = doc.getNumberOfPages();
  doc.setDrawColor(PALETTE.line);
  doc.setLineWidth(0.3);
  doc.line(16, 282, 194, 282);
  doc.setTextColor(PALETTE.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.text(`PGR · ${display(company.legalName, input.companyName ?? "Empresa")}`, 16, 287);
  doc.text(`Projeto ${input.projectId} · emissão ${formatDate(input.generatedAt)} · página ${page}`, 194, 287, { align: "right" });
}

function formalPdfNewPage(doc: jsPDF, input: PgrReportInput, company: NormalizedPgrData["company"], section: string) {
  formalPdfFooter(doc, input, company);
  doc.addPage();
  formalPdfHeader(doc, input, company, section);
  return pdfSectionHeading(doc, section);
}

function riskRecordRows(risk: NormalizedRisk) {
  const score = riskScore(risk);
  return [
    ["Exposição", risk.exposure],
    ["Perigos, fontes e circunstâncias", [risk.source, risk.hazard].filter(Boolean).join(" · ")],
    ["Metodologia de avaliação", risk.methodology],
    ["Possíveis lesões ou agravos à saúde", risk.healthEffects],
    ["Grupo exposto", risk.exposedGroup || risk.ghe],
    ["Probabilidade / severidade / nível", [risk.probability ? `P ${risk.probability}` : "", risk.severity ? `S ${risk.severity}` : "", risk.classification || (score ? riskTone(score).label : "")].filter(Boolean).join(" · ")],
    ["Medições e referências", [risk.measurementLimit && `Limite: ${risk.measurementLimit}`, risk.measurementResult && `Resultado: ${risk.measurementResult}`].filter(Boolean).join(" · ")],
    ["Medidas de prevenção implementadas ou necessárias", risk.controls],
    ["Hierarquia de controle", risk.controlHierarchy],
    ["Responsável pelo acompanhamento", risk.responsible],
    ["Monitoramento / acompanhamento", risk.monitoring],
  ];
}

function riskRecordTitle(risk: NormalizedRisk) {
  return [risk.category, risk.hazard].filter(Boolean).join(" · ") || "Risco ocupacional registrado";
}

function riskScoreLabel(risk: NormalizedRisk) {
  const score = riskScore(risk);
  return score ? `${risk.classification || riskTone(score).label} · P ${risk.probability} × S ${risk.severity} = ${score}` : display(risk.classification, "Classificação pendente");
}

export function buildProfessionalPgrReportPdf(input: PgrReportInput) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const modules = { ...DEFAULT_MODULES, ...input.modules };
  const data = normalizePgrData(input);
  const companyName = display(data.company.legalName, input.companyName ?? "Empresa não identificada");
  const reviews = data.revisions.length ? data.revisions : [{ date: formatDate(input.generatedAt), version: data.company.revision || "01", description: "Emissão inicial do documento", responsible: data.signature?.name || data.company.responsibleName }];

  if (modules.cover) {
    doc.setFillColor(PALETTE.white);
    doc.rect(0, 0, 210, 297, "F");
    doc.setFillColor(PALETTE.navy);
    doc.rect(0, 0, 210, 8, "F");
    doc.setDrawColor(PALETTE.teal);
    doc.setLineWidth(1.2);
    doc.line(16, 53, 194, 53);
    doc.setTextColor(PALETTE.teal);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("DOCUMENTO TÉCNICO DE SST", 16, 35);
    doc.setTextColor(PALETTE.ink);
    doc.setFontSize(22);
    doc.text("PGR", 16, 76);
    doc.setFontSize(16);
    doc.text("PROGRAMA DE GERENCIAMENTO DE RISCOS", 16, 88);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(PALETTE.muted);
    doc.text("Gerenciamento de Riscos Ocupacionais · NR-01", 16, 101);
    doc.setTextColor(PALETTE.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(companyName, 16, 133, { maxWidth: 178 });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(PALETTE.muted);
    doc.text(`CNPJ: ${display(data.company.cnpj)}`, 16, 146);
    doc.text(`Projeto: ${input.projectName}`, 16, 153);
    doc.text(`Vigência: ${display(data.company.validityStart, formatDate(input.generatedAt))} a ${display(data.company.validityEnd, "A definir")}`, 16, 160);
    doc.text(`Revisão: ${display(data.company.revision, reviews[0]?.version || "01")}`, 16, 167);
    doc.setFillColor(PALETTE.soft);
    doc.rect(16, 212, 178, 44, "F");
    doc.setTextColor(PALETTE.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("CONTROLE DO DOCUMENTO", 22, 225);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const coverInfo = [
      `Estabelecimento: ${display(data.company.establishment, [data.company.address, data.company.city].filter(Boolean).join(" · "))}`,
      `Atividade / CNAE: ${display(data.company.activity || data.company.cnae)}`,
      `Responsável técnico: ${display(data.signature?.name || data.company.responsibleName)}`,
      `Registro profissional: ${display(data.signature?.registry || data.company.responsibleRegistry)}`,
    ];
    coverInfo.forEach((line, index) => doc.text(line, 22, 235 + index * 5.2, { maxWidth: 165 }));
    doc.setFontSize(7);
    doc.setTextColor(PALETTE.muted);
    doc.text("Documento gerado a partir de dados registrados no projeto. A emissão deve ser validada e assinada pelo responsável técnico habilitado.", 16, 276, { maxWidth: 175 });
    formalPdfFooter(doc, input, data.company);
    doc.addPage();
  }

  formalPdfHeader(doc, input, data.company, "Controle e estrutura do documento");
  let y = pdfSectionHeading(doc, "01 - Registro das revisões do PGR", "Histórico de versões e responsáveis pelo documento");
  y = pdfTable(doc, input, y, ["Data", "Versão", "Alteração", "Responsável"], [28, 24, 82, 44], reviews.map(item => [item.date, item.version, item.description, item.responsible]), "01 - Registro das revisões do PGR");
  y += 5;
  doc.setTextColor(PALETTE.teal);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("ESTRUTURA DO RELATÓRIO", 16, y);
  y += 8;
  const contents = [
    "02 - Identificação da empresa e do estabelecimento",
    "03 - Qualificação dos profissionais responsáveis",
    "04 - Introdução e apresentação do ambiente do PGR",
    "05 - Objetivos do programa",
    "06 - Gerenciamento de riscos ocupacionais",
    "07 - Definições de risco e prevenção",
    "08 - Estratégia e metodologia de ação",
    "09 - Registro, manutenção e divulgação de dados",
    "10 - Critérios de classificação de riscos",
    "11 - Matriz de risco utilizada",
    "12 - Ambientes, grupos expostos e inventário de riscos",
    "Cronograma de prioridades e adequação",
    "Garantia de implementação e considerações finais",
    "Anexos operacionais e mapa de risco",
  ];
  contents.forEach((item, index) => {
    doc.setFillColor(index % 2 ? "FFFFFF" : "F5FAF8");
    doc.rect(16, y - 4.4, 178, 7, "F");
    pdfText(doc, item, 21, y, 164, 8.4, PALETTE.ink, index < 2);
    y += 7;
  });

  y = formalPdfNewPage(doc, input, data.company, "02 - Identificação da empresa e do estabelecimento");
  y = pdfTable(doc, input, y, ["Campo", "Informação"], [58, 120], [
    ["Razão social", companyName],
    ["CNPJ", data.company.cnpj],
    ["Endereço / município", [data.company.address, data.company.city].filter(Boolean).join(" · ")],
    ["Estabelecimento / unidade", data.company.establishment],
    ["Telefone e e-mail", [data.company.phone, data.company.email].filter(Boolean).join(" · ")],
    ["Atividade econômica / CNAE", data.company.activity || data.company.cnae],
    ["Grau de risco", data.company.riskLevel],
    ["Número de trabalhadores", data.company.employees],
    ["Descrição do processo", data.company.processDescription],
  ], "02 - Identificação da empresa e do estabelecimento");

  y = formalPdfNewPage(doc, input, data.company, "03 - Qualificação dos profissionais responsáveis");
  y = pdfTable(doc, input, y, ["Responsabilidade", "Nome", "Qualificação / registro"], [45, 63, 70], [
    ["Elaboração / responsabilidade técnica", data.signature?.name || data.company.responsibleName, [data.signature?.title || data.company.responsibleRole, data.signature?.registry || data.company.responsibleRegistry].filter(Boolean).join(" · ")],
    ["Implantação do programa", data.company.responsibleName, data.company.responsibleRole],
  ], "03 - Qualificação dos profissionais responsáveis");
  y += 8;
  y = pdfText(doc, "A assinatura, a avaliação técnica e a responsabilidade pela implementação devem ser atribuídas somente aos profissionais e representantes efetivamente indicados neste projeto.", 16, y, 178, 8.3) + 6;

  y = formalPdfNewPage(doc, input, data.company, "04 - Introdução e apresentação do ambiente do PGR");
  y = pdfText(doc, "Este Programa de Gerenciamento de Riscos consolida os dados cadastrados para o estabelecimento e apoia a identificação de perigos, a avaliação de riscos ocupacionais, a priorização de medidas de prevenção e o acompanhamento das ações definidas.", 16, y, 178, 9, PALETTE.ink) + 6;
  workplacePresentation(data).forEach(paragraph => {
    y = pdfText(doc, paragraph, 16, y, 178, 8.5) + 4;
  });
  y = pdfText(doc, "O escopo do documento corresponde aos processos, ambientes, grupos de exposição, riscos e ações efetivamente registrados no projeto. Informações não cadastradas são identificadas como pendentes, sem substituição por dados ilustrativos.", 16, y, 178, 8.5) + 8;
  y = pdfTable(doc, input, y, ["Elemento de escopo", "Registro do projeto"], [58, 120], [
    ["Processos e ambientes", data.company.processDescription],
    ["Grupos de exposição", data.ghes.length ? `${data.ghes.length} grupo(s) / cargo(s) registrado(s)` : "Não informado"],
    ["Riscos avaliados", data.risks.length ? `${data.risks.length} risco(s) ocupacional(is)` : "Não informado"],
    ["Ações previstas", data.actions.length ? `${data.actions.length} ação(ões) de prevenção` : "Não informado"],
  ], "04 - Introdução e apresentação do ambiente do PGR");

  y = formalPdfNewPage(doc, input, data.company, "05 - Objetivos do programa");
  y = pdfText(doc, "Os objetivos abaixo orientam o uso do PGR como documento de gestão e devem ser aplicados de acordo com as condições reais do estabelecimento e as avaliações técnicas necessárias.", 16, y, 178, 8.5, PALETTE.ink) + 7;
  y = pdfTable(doc, input, y, ["Objetivo", "Aplicação no PGR"], [58, 120], [
    ["Identificar perigos", "Registrar fontes, circunstâncias e possíveis agravos à saúde relacionados ao trabalho."],
    ["Avaliar riscos", "Indicar probabilidade, severidade e classificação para orientar a necessidade de prevenção."],
    ["Planejar prevenção", "Definir medidas a introduzir, aprimorar ou manter, com responsáveis e cronograma."],
    ["Acompanhar controles", "Registrar evidências, inspeções e revisões necessárias para avaliar a efetividade das medidas."],
  ], "05 - Objetivos do programa");

  y = formalPdfNewPage(doc, input, data.company, "06 - Gerenciamento de riscos ocupacionais");
  y = pdfText(doc, "O gerenciamento de riscos ocupacionais organiza a identificação de perigos, a avaliação dos riscos, a definição de medidas de prevenção e o acompanhamento das ações. Nesta emissão, a análise é apresentada a partir do conteúdo efetivamente cadastrado no projeto PGR.", 16, y, 178, 8.7, PALETTE.ink) + 7;
  y = pdfTable(doc, input, y, ["Etapa", "Aplicação nesta emissão"], [54, 124], [
    ["Identificação", "Fontes, circunstâncias, exposição, agravos, grupos expostos e controles são exibidos quando registrados."],
    ["Avaliação", "Probabilidade, severidade, medições e classificação são consolidadas no inventário e na matriz."],
    ["Prevenção", "As medidas existentes e as ações de melhoria são apresentadas com base nos registros do projeto."],
    ["Acompanhamento", "Responsáveis, prazos, evidências e acompanhamento do plano são informados quando cadastrados."],
  ], "06 - Gerenciamento de riscos ocupacionais");

  y = formalPdfNewPage(doc, input, data.company, "07 - Definições de risco e prevenção");
  y = pdfTable(doc, input, y, ["Termo", "Apresentação no PGR"], [54, 124], [
    ["Perigo", "Fonte, situação ou circunstância com potencial de causar lesão ou agravo à saúde."],
    ["Risco ocupacional", "Combinação entre a probabilidade de ocorrência e a severidade das possíveis consequências."],
    ["Grupo exposto", "Trabalhadores vinculados ao GHE, cargo, setor ou atividade cadastrada no projeto."],
    ["Medida de prevenção", "Ação de eliminação, redução, controle, organização do trabalho, proteção coletiva ou proteção individual conforme aplicável."],
    ["Monitoramento", "Registro de verificação, medição, inspeção ou acompanhamento que apoie a avaliação da efetividade das medidas."],
  ], "07 - Definições de risco e prevenção");

  y = formalPdfNewPage(doc, input, data.company, "08 - Estratégia e metodologia de ação");
  y = pdfText(doc, "A estratégia da emissão é apresentar, antes do inventário, como o ambiente foi caracterizado e como os registros existentes serão utilizados para a avaliação. Métodos específicos, medições e evidências só são atribuídos aos riscos quando constam no cadastro do projeto.", 16, y, 178, 8.6, PALETTE.ink) + 7;
  y = pdfTable(doc, input, y, ["Método / fonte", "Aplicação"], [54, 124], methodologyRows(data), "08 - Estratégia e metodologia de ação");

  y = formalPdfNewPage(doc, input, data.company, "09 - Registro, manutenção e divulgação de dados");
  y = pdfTable(doc, input, y, ["Tema", "Procedimento documental"], [54, 124], recordAndDisclosureRows(data), "09 - Registro, manutenção e divulgação de dados");

  y = formalPdfNewPage(doc, input, data.company, "10 - Definições e critérios de riscos");
  y = pdfText(doc, "A classificação apresentada na matriz utiliza a combinação entre probabilidade e severidade registradas no inventário. A graduação abaixo organiza a leitura da escala de 1 a 5 e não substitui a avaliação técnica do profissional responsável.", 16, y, 178, 8.5, PALETTE.ink) + 7;
  y = pdfTable(doc, input, y, ["Escala", "Probabilidade", "Severidade"], [24, 77, 77], [
    ["1", "Rara ou pouco provável conforme exposição e controles registrados.", "Leve: consequência limitada ou reversível."],
    ["2", "Pouco provável: controles presentes com necessidade de acompanhamento.", "Baixa: lesão ou agravo sério reversível."],
    ["3", "Possível: exposição ou controle exige atenção e acompanhamento.", "Moderada: consequência crítica que pode limitar a capacidade funcional."],
    ["4", "Provável: controle deficiente ou exposição relevante registrada.", "Alta: consequência incapacitante ou grave."],
    ["5", "Muito provável: ausência ou inadequação relevante de controle.", "Extrema: consequência grave ou múltipla."],
  ], "10 - Definições e critérios de riscos");

  if (modules.riskMatrix) {
    y = formalPdfNewPage(doc, input, data.company, "11 - Matriz de risco utilizada");
    y = pdfText(doc, "A matriz 5 × 5 abaixo apresenta a combinação de probabilidade e severidade dos riscos registrados. Cada célula traz a pontuação P × S e destaca a quantidade de riscos posicionados na combinação correspondente.", 16, y, 178, 8.6) + 10;
    drawRiskMatrix(doc, data, 48, y);
    y += 128;
    y = pdfTable(doc, input, y, ["Classificação", "Tratamento e decisão"], [50, 128], [
      ["Trivial", "Manter as medidas registradas e acompanhar sua efetividade."],
      ["Tolerável", "Avaliar necessidade de melhoria e manter o acompanhamento previsto."],
      ["Moderado", "Definir medidas de prevenção e formalizar o acompanhamento necessário."],
      ["Substancial", "Priorizar a ação de controle, com responsável, prazo e verificação da execução."],
      ["Intolerável", "Adotar controle prioritário e reavaliar o risco antes da continuidade da condição de trabalho."],
    ], "11 - Matriz de risco utilizada");
  }

  if (modules.gheInventory) {
    y = formalPdfNewPage(doc, input, data.company, "12 - Ambientes, cargos e inventário de riscos ocupacionais");
    if (!data.ghes.length) {
      y = pdfText(doc, "Nenhum grupo homogêneo de exposição, cargo ou ambiente foi registrado neste projeto. Cadastre os dados antes de emitir a versão final do PGR.", 16, y, 178, 8.5, PALETTE.red) + 7;
    }
    data.ghes.forEach((ghe, index) => {
      if (y > 215) y = formalPdfNewPage(doc, input, data.company, "12 - Ambientes, cargos e inventário de riscos ocupacionais");
      doc.setFillColor("EDF6F3");
      doc.rect(16, y, 178, 8, "F");
      doc.setTextColor(PALETTE.ink);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text(`GHE ${index + 1} · ${display(ghe.name)}`, 20, y + 5.4);
      y += 11;
      y = pdfTable(doc, input, y, ["Campo", "Registro"], [48, 130], [
        ["Setor / ambiente", ghe.sector],
        ["Atividades", ghe.description],
        ["Processo", ghe.process],
        ["Jornada / turno", ghe.workday],
        ["Trabalhadores", ghe.workers],
      ], "12 - Ambientes, cargos e inventário de riscos ocupacionais");
      const groupRisks = data.risks.filter(risk => !risk.ghe || risk.ghe === ghe.name || risk.ghe === ghe.sector);
      if (!groupRisks.length) {
        y = pdfText(doc, "Nenhum risco vinculado a este grupo foi registrado no projeto.", 16, y, 178, 8.2, PALETTE.muted) + 5;
      }
      groupRisks.forEach((risk, riskIndex) => {
        if (y > 188) y = formalPdfNewPage(doc, input, data.company, "12 - Ambientes, cargos e inventário de riscos ocupacionais");
        doc.setFillColor("F8FBFA");
        doc.rect(16, y, 178, 8, "F");
        doc.setTextColor(PALETTE.ink);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text(`${index + 1}.${riskIndex + 1} · ${riskRecordTitle(risk)}`, 20, y + 5.4, { maxWidth: 135 });
        doc.setTextColor(PALETTE.teal);
        doc.setFontSize(7.2);
        doc.text(riskScoreLabel(risk), 190, y + 5.4, { align: "right", maxWidth: 54 });
        y += 8;
        y = pdfTable(doc, input, y, ["Campo", "Informação registrada"], [55, 123], riskRecordRows(risk), "12 - Ambientes, cargos e inventário de riscos ocupacionais");
      });
      y += 3;
    });
    const ungroupedRisks = data.risks.filter(risk => !data.ghes.some(ghe => risk.ghe === ghe.name || risk.ghe === ghe.sector));
    if (ungroupedRisks.length) {
      if (y > 195) y = formalPdfNewPage(doc, input, data.company, "12 - Ambientes, cargos e inventário de riscos ocupacionais");
      doc.setTextColor(PALETTE.ink);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("RISCOS SEM VÍNCULO ESPECÍFICO DE GHE", 16, y);
      y += 5;
      ungroupedRisks.forEach((risk, index) => {
        if (y > 188) y = formalPdfNewPage(doc, input, data.company, "12 - Ambientes, cargos e inventário de riscos ocupacionais");
        y = pdfTable(doc, input, y, ["Campo", "Informação registrada"], [55, 123], [["Risco", riskRecordTitle(risk)], ...riskRecordRows(risk)], "12 - Ambientes, cargos e inventário de riscos ocupacionais");
      });
    }
  }

  if (modules.riskMatrix) {
    y = formalPdfNewPage(doc, input, data.company, "Anexo I - Mapa de risco");
    y = pdfText(doc, "O mapa de risco é incorporado quando uma planta ou imagem é cadastrada no projeto. Os pontos abaixo são exibidos a partir dos registros reais do mapa.", 16, y, 178, 8.5) + 7;
    if (data.mapImage) {
      try {
        doc.addImage(data.mapImage, imageType(data.mapImage), 20, y, 170, 92);
        y += 98;
      } catch {
        y = pdfText(doc, "A imagem do mapa foi cadastrada, mas não pôde ser incorporada nesta emissão. Reabra o projeto e salve o mapa antes de gerar novamente.", 16, y, 178, 8.4, PALETTE.red) + 6;
      }
    }
    y = pdfTable(doc, input, y, ["Ponto", "Classificação visual", "Descrição"], [20, 46, 112], data.mapPoints.map((point, index) => [String(index + 1), point.color, point.description]), "Anexo I - Mapa de risco");
  }

  if (modules.actionPlan) {
    y = formalPdfNewPage(doc, input, data.company, "Cronograma de prioridades e adequação");
    y = pdfText(doc, "As ações devem refletir as medidas de prevenção a introduzir, aprimorar ou manter. Os campos abaixo são preenchidos somente com os dados efetivamente registrados no projeto.", 16, y, 178, 8.5) + 7;
    if (!data.actions.length) y = pdfText(doc, "Nenhuma ação foi cadastrada neste projeto. Registre as medidas, responsáveis, prazos e formas de acompanhamento antes da emissão final.", 16, y, 178, 8.5, PALETTE.red) + 7;
    if (data.actions.length) y = pdfTable(doc, input, y, ["Ação", "Prioridade", "Prazo", "Responsável", "Situação"], [72, 25, 27, 30, 24], data.actions.map(action => [action.description, action.priority, action.deadline, action.responsible, action.status]), "Cronograma de prioridades e adequação");
    data.actions.forEach((action, index) => {
      if (y > 178) y = formalPdfNewPage(doc, input, data.company, "Cronograma de prioridades e adequação");
      doc.setFillColor("EDF6F3");
      doc.rect(16, y, 178, 8, "F");
      doc.setTextColor(PALETTE.ink);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.8);
      doc.text(`AÇÃO ${String(index + 1).padStart(2, "0")} · ${display(action.priority, "Prioridade não informada")}`, 20, y + 5.3);
      y += 8;
      y = pdfTable(doc, input, y, ["Campo", "Registro"], [48, 130], [
        ["Ação", action.description],
        ["Fundamento / motivo", action.legalBasis],
        ["Local de comprovação", action.evidenceLocation],
        ["Como será realizada", action.implementationMethod],
        ["Responsável", action.responsible],
        ["Prazo / implantação", action.deadline],
        ["Custo", action.cost],
        ["Status", action.status],
        ["Acompanhamento e aferição", action.followUp],
      ], "Cronograma de prioridades e adequação");
      y += 3;
    });
  }

  y = formalPdfNewPage(doc, input, data.company, "13 - Responsabilidades e monitoramento do PGR");
  y = pdfText(doc, "As responsabilidades e os registros de acompanhamento abaixo são consolidados a partir do que está cadastrado no projeto. A ausência de dados é mantida como pendência documental, sem atribuição automática de deveres ou responsáveis.", 16, y, 178, 8.5, PALETTE.ink) + 7;
  y = pdfTable(doc, input, y, ["Tema", "Descrição", "Responsável"], [42, 100, 36], data.responsibilities.map(item => [item.subject, item.description, item.responsible]), "13 - Responsabilidades e monitoramento do PGR");
  if (y > 185) y = formalPdfNewPage(doc, input, data.company, "13 - Responsabilidades e monitoramento do PGR");
  doc.setTextColor(PALETTE.teal);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("REGISTROS DE MONITORAMENTO", 16, y);
  y += 7;
  y = pdfTable(doc, input, y, ["Data", "Registro", "Responsável", "Situação"], [25, 92, 35, 26], [
    ...data.inspections.map(item => [item.date, `Inspeção: ${item.description}`, item.responsible, item.status]),
    ...data.changes.map(item => [item.date, `Mudança: ${item.description}${item.impact ? ` · Impacto: ${item.impact}` : ""}`, item.responsible, "Registrada"]),
  ], "13 - Responsabilidades e monitoramento do PGR");

  if (modules.attachments) {
    y = formalPdfNewPage(doc, input, data.company, "14 - Anexos operacionais, laudos e calibração");
    y = pdfText(doc, "Os documentos abaixo estão vinculados ao projeto PGR e identificam laudos, certificados de calibração, ARTs, registros fotográficos e outras evidências disponíveis. A relação não substitui a análise do conteúdo do documento técnico pelo profissional responsável.", 16, y, 178, 8.5, PALETTE.ink) + 7;
    y = pdfTable(doc, input, y, ["Categoria", "Documento", "Data", "Referência"], [32, 56, 28, 62], attachmentRows(data), "14 - Anexos operacionais, laudos e calibração");
    const visualAttachments = visualAttachmentRows(data);
    if (visualAttachments.length) {
      y = formalPdfNewPage(doc, input, data.company, "Anexo II - Evidências visuais anexadas");
      y = pdfText(doc, "As imagens abaixo foram anexadas ao projeto e são reproduzidas nesta emissão com sua identificação. Arquivos técnicos não visuais permanecem relacionados no Anexo 14 e incorporados ao PDF quando disponíveis.", 16, y, 178, 8.5, PALETTE.ink) + 7;
      visualAttachments.forEach((attachment, index) => {
        if (y > 155) y = formalPdfNewPage(doc, input, data.company, "Anexo II - Evidências visuais anexadas");
        doc.setFillColor("EDF6F3");
        doc.rect(16, y, 178, 8, "F");
        doc.setTextColor(PALETTE.ink);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(`EVIDÊNCIA ${String(index + 1).padStart(2, "0")} · ${attachmentCategoryLabel(attachment.category)}`, 20, y + 5.3);
        y += 12;
        try {
          doc.addImage(attachment.inlineDataUrl!, imageType(attachment.inlineDataUrl!), 24, y, 162, 91);
          y += 96;
        } catch {
          y = pdfText(doc, "A imagem foi vinculada ao projeto, mas não pôde ser renderizada nesta cópia. O arquivo permanece listado entre os anexos técnicos.", 20, y, 170, 8.2, PALETTE.red) + 7;
        }
        y = pdfText(doc, `${attachment.title} · ${display(attachment.createdAt, "Data não informada")}`, 20, y, 166, 8.2, PALETTE.muted, true) + 7;
      });
    }
    if (y > 188) y = formalPdfNewPage(doc, input, data.company, "14 - Anexos operacionais, laudos e calibração");
    doc.setTextColor(PALETTE.teal);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("MEDIÇÕES E CERTIFICADOS DE CALIBRAÇÃO RELACIONADOS", 16, y);
    y += 7;
    y = pdfTable(doc, input, y, ["GHE / área", "Agente", "Resultado", "Limite / nível de ação", "Método / equipamento"], [32, 34, 30, 37, 45], data.measurements.map(item => [item.ghe, item.agent, item.result, item.limit, [item.method, item.equipment].filter(Boolean).join(" · ")]), "14 - Anexos operacionais, laudos e calibração");
    if (y > 194) y = formalPdfNewPage(doc, input, data.company, "14 - Anexos operacionais, laudos e calibração");
    y = pdfTable(doc, input, y, ["Treinamento / evidência", "Data", "Instrutor / NR", "Periodicidade"], [70, 28, 48, 32], data.trainings.map(item => [item.title, item.date, [item.instructor, item.nr].filter(Boolean).join(" · "), item.periodicity]), "14 - Anexos operacionais, laudos e calibração");
    if (data.emergency.responsible || data.emergency.routes || data.emergency.resources || data.emergency.nextDrill) {
      if (y > 198) y = formalPdfNewPage(doc, input, data.company, "14 - Anexos operacionais, laudos e calibração");
      y = pdfTable(doc, input, y, ["Plano de emergência", "Registro"], [52, 126], [["Responsável", data.emergency.responsible], ["Recursos", data.emergency.resources], ["Rotas de fuga", data.emergency.routes], ["Periodicidade", data.emergency.periodicity], ["Próximo simulado", data.emergency.nextDrill]], "14 - Anexos operacionais, laudos e calibração");
    }
  }

  y = formalPdfNewPage(doc, input, data.company, "15 - Garantia de implementação e considerações finais");
  y = pdfText(doc, "A implementação das ações e a manutenção do PGR dependem da organização e dos responsáveis designados. As medidas de prevenção devem ser acompanhadas, revisadas quando necessário e comunicadas aos trabalhadores conforme a realidade do estabelecimento.", 16, y, 178, 8.7, PALETTE.ink) + 8;
  y = pdfTable(doc, input, y, ["Registro", "Informação"], [58, 120], [
    ["Observações gerais / inspeção", data.inspectionNotes],
    ["Responsável técnico", data.signature?.name || data.company.responsibleName],
    ["Registro profissional", data.signature?.registry || data.company.responsibleRegistry],
    ["Data de emissão", formatDate(input.generatedAt)],
    ["Histórico de revisão", `${reviews.length} registro(s) mantido(s) nesta emissão`],
  ], "15 - Garantia de implementação e considerações finais");
  y += 14;
  doc.setDrawColor(PALETTE.muted);
  doc.line(28, y + 20, 93, y + 20);
  doc.line(117, y + 20, 182, y + 20);
  doc.setTextColor(PALETTE.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Representante da organização", 60.5, y + 25, { align: "center" });
  doc.text("Responsável técnico", 149.5, y + 25, { align: "center" });
  formalPdfFooter(doc, input, data.company);
  return doc;
}

const borders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: PALETTE.line },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: PALETTE.line },
  left: { style: BorderStyle.SINGLE, size: 4, color: PALETTE.line },
  right: { style: BorderStyle.SINGLE, size: 4, color: PALETTE.line },
};

function wordText(value: string, options: { bold?: boolean; color?: string; size?: number } = {}) {
  return new TextRun({ text: display(value, "—"), bold: options.bold, color: options.color ?? PALETTE.ink, size: options.size ?? 18 });
}

function wordCell(value: string, options: { header?: boolean; width?: number } = {}) {
  return new TableCell({
    width: options.width ? { size: options.width, type: WidthType.PERCENTAGE } : undefined,
    shading: options.header ? { type: ShadingType.CLEAR, fill: PALETTE.teal } : undefined,
    borders,
    margins: { top: 100, bottom: 100, left: 110, right: 110 },
    children: [new Paragraph({ children: [wordText(value, { bold: options.header, color: options.header ? PALETTE.white : PALETTE.ink, size: 16 })] })],
  });
}

function wordTable(headers: string[], rows: string[][]) {
  const width = Math.floor(100 / headers.length);
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: headers.map(header => wordCell(header, { header: true, width })) }),
      ...(rows.length ? rows : [["Nenhum registro cadastrado neste projeto.", ...Array(Math.max(0, headers.length - 1)).fill("")]]).map(row => new TableRow({ children: headers.map((_, index) => wordCell(row[index] ?? "", { width })) })),
    ],
  });
}

function dataUrlToBytes(value: string) {
  const payload = value.split(",")[1];
  if (!payload) return undefined;
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function wordMatrix(data: NormalizedPgrData) {
  const counts = new Map<string, number>();
  data.risks.forEach(risk => {
    if (risk.probability && risk.severity) {
      const key = `${risk.probability}-${risk.severity}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  });
  const rows: TableRow[] = [new TableRow({ children: [wordCell("P × S", { header: true }), ...[1, 2, 3, 4, 5].map(value => wordCell(`S${value}`, { header: true }))] })];
  for (let probability = 5; probability >= 1; probability -= 1) {
    const cells = [wordCell(`P${probability}`, { header: true })];
    for (let severity = 1; severity <= 5; severity += 1) {
      const score = probability * severity;
      const tone = riskTone(score);
      const count = counts.get(`${probability}-${severity}`);
      cells.push(new TableCell({
        shading: { type: ShadingType.CLEAR, fill: tone.color },
        borders,
        verticalAlign: "center",
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [wordText(count ? `${score} (${count})` : String(score), { bold: true, color: PALETTE.white, size: 16 })] })],
      }));
    }
    rows.push(new TableRow({ children: cells }));
  }
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
}

function heading(text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, spacing: { before: 240, after: 130 }, children: [wordText(text, { bold: true, color: level === HeadingLevel.HEADING_1 ? PALETTE.teal : PALETTE.ink, size: level === HeadingLevel.HEADING_1 ? 26 : 21 })] });
}

export function buildProfessionalPgrWord(input: PgrReportInput) {
  const modules = { ...DEFAULT_MODULES, ...input.modules };
  const data = normalizePgrData(input);
  const companyName = display(data.company.legalName, input.companyName ?? "Empresa não identificada");
  const reviews = data.revisions.length ? data.revisions : [{ date: formatDate(input.generatedAt), version: data.company.revision || "01", description: "Emissão inicial do documento", responsible: data.signature?.name || data.company.responsibleName }];
  const children: Array<Paragraph | Table> = [];
  if (modules.cover) {
    children.push(
      new Paragraph({ spacing: { before: 1500, after: 90 }, children: [wordText("DOCUMENTO TÉCNICO DE SST", { bold: true, color: PALETTE.teal, size: 18 })] }),
      new Paragraph({ spacing: { before: 180, after: 220 }, children: [wordText("PROGRAMA DE GERENCIAMENTO DE RISCOS", { bold: true, color: PALETTE.navy, size: 40 })] }),
      new Paragraph({ spacing: { after: 580 }, children: [wordText("PGR · NR-01", { bold: true, color: PALETTE.teal, size: 25 })] }),
      new Paragraph({ children: [wordText(companyName, { bold: true, color: PALETTE.ink, size: 30 })] }),
      new Paragraph({ spacing: { after: 280 }, children: [wordText(`CNPJ: ${display(data.company.cnpj)} · Projeto: ${input.projectName}`, { size: 18 })] }),
      wordTable(["Controle do documento", "Registro"], [
        ["Vigência", `${display(data.company.validityStart, formatDate(input.generatedAt))} a ${display(data.company.validityEnd, "A definir")}`],
        ["Revisão", display(data.company.revision, reviews[0]?.version || "01")],
        ["Estabelecimento", display(data.company.establishment, [data.company.address, data.company.city].filter(Boolean).join(" · "))],
        ["Atividade / CNAE", display(data.company.activity || data.company.cnae)],
        ["Responsável técnico", display(data.signature?.name || data.company.responsibleName)],
      ]),
      new Paragraph({ children: [new PageBreak()] }),
    );
  }
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 250 }, children: [wordText("PGR · DOCUMENTO TÉCNICO CONSOLIDADO", { bold: true, color: PALETTE.navy, size: 27 })] }));
  if (modules.summary) {
    const summaryItems = [
      "01. Registro das revisões do PGR",
      modules.companyInfo && "02. Identificação da empresa e do estabelecimento",
      "03. Qualificação dos profissionais responsáveis",
      "04. Introdução e apresentação do ambiente do PGR",
      "05. Objetivos do programa",
      "06. Gerenciamento de riscos ocupacionais",
      "07. Definições de risco e prevenção",
      "08. Estratégia e metodologia de ação",
      "09. Registro, manutenção e divulgação de dados",
      "10. Definições e critérios de riscos",
      modules.riskMatrix && "11. Matriz de risco utilizada",
      modules.gheInventory && "12. Ambientes, cargos e inventário de riscos ocupacionais",
      modules.actionPlan && "Cronograma de prioridades e adequação",
      "13. Responsabilidades e monitoramento do PGR",
      modules.attachments && "14. Anexos operacionais, laudos e calibração",
      "Garantia de implementação e considerações finais",
      modules.riskMatrix && "Anexo I. Mapa de risco",
    ].filter(Boolean) as string[];
    children.push(
      heading("Sumário"),
      ...summaryItems.map(item => new Paragraph({
        bullet: { level: 0 },
        children: [wordText(item, { size: 18 })],
      })),
    );
  }
  children.push(
    heading("01. Registro das revisões do PGR"),
    wordTable(["Data", "Versão", "Alteração", "Responsável"], reviews.map(item => [item.date, item.version, item.description, item.responsible])),
  );
  if (modules.companyInfo) {
    children.push(heading("02. Identificação da empresa e do estabelecimento"), wordTable(["Campo", "Informação registrada"], [
      ["Razão social", companyName], ["CNPJ", data.company.cnpj], ["Endereço / município", [data.company.address, data.company.city].filter(Boolean).join(" · ")], ["Estabelecimento / unidade", data.company.establishment], ["Contato", [data.company.phone, data.company.email].filter(Boolean).join(" · ")], ["Atividade / CNAE", data.company.activity || data.company.cnae], ["Grau de risco", data.company.riskLevel], ["Trabalhadores", data.company.employees], ["Processo produtivo", data.company.processDescription],
    ]));
  }
  children.push(
    heading("03. Qualificação dos profissionais responsáveis"),
    wordTable(["Responsabilidade", "Nome", "Qualificação / registro"], [
      ["Elaboração / responsabilidade técnica", data.signature?.name || data.company.responsibleName, [data.signature?.title || data.company.responsibleRole, data.signature?.registry || data.company.responsibleRegistry].filter(Boolean).join(" · ")],
      ["Implantação do programa", data.company.responsibleName, data.company.responsibleRole],
    ]),
    heading("04. Introdução e apresentação do ambiente do PGR"),
    new Paragraph({ spacing: { after: 120 }, children: [wordText("Este Programa de Gerenciamento de Riscos consolida os dados cadastrados para o estabelecimento e apoia a identificação de perigos, a avaliação de riscos ocupacionais, a priorização de medidas de prevenção e o acompanhamento das ações definidas.", { size: 18 })] }),
    ...workplacePresentation(data).map(paragraph => new Paragraph({ spacing: { after: 90 }, children: [wordText(paragraph, { size: 18 })] })),
    new Paragraph({ children: [wordText("O escopo corresponde aos processos, ambientes, grupos de exposição, riscos e ações efetivamente registrados no projeto. Informações ausentes são indicadas no documento e não são substituídas por dados ilustrativos.", { size: 18 })] }),
    heading("05. Objetivos do programa"),
    wordTable(["Objetivo", "Aplicação no PGR"], [["Identificar perigos", "Registrar fontes, circunstâncias e possíveis agravos à saúde relacionados ao trabalho."], ["Avaliar riscos", "Indicar probabilidade, severidade e classificação para orientar a necessidade de prevenção."], ["Planejar prevenção", "Definir medidas a introduzir, aprimorar ou manter, com responsáveis e cronograma."], ["Acompanhar controles", "Registrar evidências, inspeções e revisões necessárias para avaliar a efetividade das medidas."]]),
    heading("06. Gerenciamento de riscos ocupacionais"),
    wordTable(["Etapa", "Aplicação nesta emissão"], [
      ["Identificação", "Fontes, circunstâncias, exposição, agravos, grupos expostos e controles são exibidos quando registrados."],
      ["Avaliação", "Probabilidade, severidade, medições e classificação são consolidadas no inventário e na matriz."],
      ["Prevenção", "As medidas existentes e as ações de melhoria são apresentadas com base nos registros do projeto."],
      ["Acompanhamento", "Responsáveis, prazos, evidências e acompanhamento do plano são informados quando cadastrados."],
    ]),
    heading("07. Definições de risco e prevenção"),
    wordTable(["Termo", "Apresentação no PGR"], [["Perigo", "Fonte, situação ou circunstância com potencial de causar lesão ou agravo à saúde."], ["Risco ocupacional", "Combinação entre a probabilidade de ocorrência e a severidade das possíveis consequências."], ["Grupo exposto", "Trabalhadores vinculados ao GHE, cargo, setor ou atividade cadastrada no projeto."], ["Medida de prevenção", "Ação de eliminação, redução, controle, organização do trabalho, proteção coletiva ou proteção individual conforme aplicável."], ["Monitoramento", "Registro de verificação, medição, inspeção ou acompanhamento que apoie a avaliação da efetividade das medidas."]]),
    heading("08. Estratégia e metodologia de ação"),
    new Paragraph({ spacing: { after: 120 }, children: [wordText("A estratégia da emissão é apresentar, antes do inventário, como o ambiente foi caracterizado e como os registros existentes serão utilizados para a avaliação. Métodos específicos, medições e evidências só são atribuídos aos riscos quando constam no cadastro do projeto.", { size: 18 })] }),
    wordTable(["Método / fonte", "Aplicação"], methodologyRows(data)),
    heading("09. Registro, manutenção e divulgação de dados"),
    wordTable(["Tema", "Procedimento documental"], recordAndDisclosureRows(data)),
    heading("10. Definições e critérios de riscos"),
    wordTable(["Escala", "Probabilidade", "Severidade"], [["1", "Rara ou pouco provável conforme exposição e controles registrados.", "Leve: consequência limitada ou reversível."], ["2", "Pouco provável: controles presentes com necessidade de acompanhamento.", "Baixa: lesão ou agravo sério reversível."], ["3", "Possível: exposição ou controle exige atenção e acompanhamento.", "Moderada: consequência crítica que pode limitar a capacidade funcional."], ["4", "Provável: controle deficiente ou exposição relevante registrada.", "Alta: consequência incapacitante ou grave."], ["5", "Muito provável: ausência ou inadequação relevante de controle.", "Extrema: consequência grave ou múltipla."]]),
  );
  if (modules.riskMatrix) {
    const riskRows = data.risks.map(item => {
      const score = riskScore(item);
      return [
        item.hazard,
        item.probability ? String(item.probability) : "—",
        item.severity ? String(item.severity) : "—",
        score ? String(score) : "—",
        item.classification || (score ? riskTone(score).label : "Não avaliada"),
      ];
    });
    children.push(
      new Paragraph({ children: [new PageBreak()] }),
      heading("11. Matriz de risco utilizada"),
      new Paragraph({
        spacing: { after: 160 },
        children: [wordText("Matriz 5 × 5 com as contagens dos riscos efetivamente registrados no projeto. A classificação deve apoiar a priorização de medidas de prevenção e do plano de ação.", { size: 18 })],
      }),
      wordMatrix(data),
      wordTable(["Perigo", "P", "S", "Resultado", "Classificação"], riskRows),
      wordTable(["Classificação", "Tratamento e decisão"], [["Trivial", "Manter as medidas registradas e acompanhar sua efetividade."], ["Tolerável", "Avaliar necessidade de melhoria e manter o acompanhamento previsto."], ["Moderado", "Definir medidas de prevenção e formalizar o acompanhamento necessário."], ["Substancial", "Priorizar a ação de controle, com responsável, prazo e verificação da execução."], ["Intolerável", "Adotar controle prioritário e reavaliar o risco antes da continuidade da condição de trabalho."]]),
    );
  }
  if (modules.gheInventory) {
    children.push(new Paragraph({ children: [new PageBreak()] }), heading("12. Ambientes, cargos e inventário de riscos ocupacionais"));
    if (!data.ghes.length) children.push(new Paragraph({ children: [wordText("Nenhum grupo homogêneo de exposição, cargo ou ambiente foi registrado neste projeto. Cadastre os dados antes de emitir a versão final do PGR.", { size: 18, color: PALETTE.red })] }));
    data.ghes.forEach((ghe, index) => {
      children.push(
        heading(`GHE ${index + 1}. ${display(ghe.name)}`, HeadingLevel.HEADING_2),
        wordTable(["Campo", "Registro"], [["Setor / ambiente", ghe.sector], ["Atividades", ghe.description], ["Processo", ghe.process], ["Jornada / turno", ghe.workday], ["Trabalhadores", ghe.workers]]),
      );
      const groupRisks = data.risks.filter(risk => !risk.ghe || risk.ghe === ghe.name || risk.ghe === ghe.sector);
      if (!groupRisks.length) children.push(new Paragraph({ children: [wordText("Nenhum risco vinculado a este grupo foi registrado no projeto.", { size: 17, color: PALETTE.muted })] }));
      groupRisks.forEach((risk, riskIndex) => {
        children.push(
          heading(`${index + 1}.${riskIndex + 1}. ${riskRecordTitle(risk)}`, HeadingLevel.HEADING_2),
          new Paragraph({ spacing: { after: 100 }, children: [wordText(riskScoreLabel(risk), { bold: true, color: PALETTE.teal, size: 17 })] }),
          wordTable(["Campo", "Informação registrada"], riskRecordRows(risk)),
        );
      });
    });
    const ungroupedRisks = data.risks.filter(risk => !data.ghes.some(ghe => risk.ghe === ghe.name || risk.ghe === ghe.sector));
    if (ungroupedRisks.length) {
      children.push(heading("Riscos sem vínculo específico de GHE", HeadingLevel.HEADING_2));
      ungroupedRisks.forEach(risk => children.push(wordTable(["Campo", "Informação registrada"], [["Risco", riskRecordTitle(risk)], ...riskRecordRows(risk)])));
    }
  }
  if (modules.riskMatrix) {
    children.push(new Paragraph({ children: [new PageBreak()] }), heading("Anexo I. Mapa de risco"));
    if (data.mapImage) {
      const bytes = dataUrlToBytes(data.mapImage);
      if (bytes) {
        children.push(heading("Mapa de risco", HeadingLevel.HEADING_2), new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: bytes, type: /^data:image\/(jpe?g)/i.test(data.mapImage) ? "jpg" : "png", transformation: { width: 560, height: 300 } })] }));
      }
    }
    if (data.mapPoints.length) children.push(wordTable(["Ponto", "Classificação visual", "Descrição"], data.mapPoints.map((item, index) => [String(index + 1), item.color, item.description])));
    if (!data.mapImage && !data.mapPoints.length) children.push(new Paragraph({ children: [wordText("Mapa de risco ainda não cadastrado neste projeto.", { size: 18, color: PALETTE.muted })] }));
  }
  if (modules.actionPlan) {
    children.push(new Paragraph({ children: [new PageBreak()] }), heading("Cronograma de prioridades e adequação"));
    if (!data.actions.length) children.push(new Paragraph({ children: [wordText("Nenhuma ação foi cadastrada neste projeto. Registre as medidas, responsáveis, prazos e formas de acompanhamento antes da emissão final.", { size: 18, color: PALETTE.red })] }));
    if (data.actions.length) children.push(wordTable(["Ação", "Prioridade", "Prazo", "Responsável", "Situação"], data.actions.map(action => [action.description, action.priority, action.deadline, action.responsible, action.status])));
    data.actions.forEach((action, index) => children.push(
      heading(`Ação ${String(index + 1).padStart(2, "0")}. ${display(action.priority, "Prioridade não informada")}`, HeadingLevel.HEADING_2),
      wordTable(["Campo", "Registro"], [["Ação", action.description], ["Fundamento / motivo", action.legalBasis], ["Local de comprovação", action.evidenceLocation], ["Como será realizada", action.implementationMethod], ["Responsável", action.responsible], ["Prazo / implantação", action.deadline], ["Custo", action.cost], ["Status", action.status], ["Acompanhamento e aferição", action.followUp]]),
    ));
  }
  children.push(
    new Paragraph({ children: [new PageBreak()] }),
    heading("13. Responsabilidades e monitoramento do PGR"),
    new Paragraph({ spacing: { after: 120 }, children: [wordText("As responsabilidades e os registros de acompanhamento são emitidos exclusivamente a partir dos dados cadastrados no projeto. Ausências permanecem sinalizadas como pendências documentais.", { size: 18 })] }),
    wordTable(["Tema", "Descrição", "Responsável"], data.responsibilities.map(item => [item.subject, item.description, item.responsible])),
    heading("Registros de monitoramento", HeadingLevel.HEADING_2),
    wordTable(["Data", "Registro", "Responsável", "Situação"], [
      ...data.inspections.map(item => [item.date, `Inspeção: ${item.description}`, item.responsible, item.status]),
      ...data.changes.map(item => [item.date, `Mudança: ${item.description}${item.impact ? ` · Impacto: ${item.impact}` : ""}`, item.responsible, "Registrada"]),
    ]),
  );
  if (modules.attachments) {
    children.push(
      new Paragraph({ children: [new PageBreak()] }),
      heading("14. Anexos operacionais, laudos e calibração"),
      new Paragraph({ spacing: { after: 120 }, children: [wordText("Esta relação identifica os laudos, certificados de calibração, ARTs, registros fotográficos e demais evidências vinculadas ao projeto PGR. A leitura e a validação do conteúdo técnico dos documentos permanecem sob responsabilidade profissional aplicável.", { size: 18 })] }),
      wordTable(["Categoria", "Documento", "Data", "Referência"], attachmentRows(data)),
      heading("Medições e certificados de calibração relacionados", HeadingLevel.HEADING_2),
      wordTable(["GHE / área", "Agente", "Resultado", "Limite / nível de ação", "Método / equipamento"], data.measurements.map(item => [item.ghe, item.agent, item.result, item.limit, [item.method, item.equipment].filter(Boolean).join(" · ")])),
      heading("Treinamentos e evidências operacionais", HeadingLevel.HEADING_2),
      wordTable(["Treinamento / evidência", "Data", "Instrutor / NR", "Periodicidade"], data.trainings.map(item => [item.title, item.date, [item.instructor, item.nr].filter(Boolean).join(" · "), item.periodicity])),
    );
    const visualAttachments = visualAttachmentRows(data);
    if (visualAttachments.length) {
      children.push(new Paragraph({ children: [new PageBreak()] }), heading("Anexo II. Evidências visuais anexadas"));
      children.push(new Paragraph({ spacing: { after: 120 }, children: [wordText("As imagens anexadas ao projeto são reproduzidas abaixo, preservando o título, a categoria e a data registrada. Laudos em PDF e outros arquivos não visuais continuam relacionados no anexo documental.", { size: 18 })] }));
      visualAttachments.forEach((attachment, index) => {
        const bytes = attachment.inlineDataUrl ? dataUrlToBytes(attachment.inlineDataUrl) : undefined;
        if (!bytes) return;
        const isJpeg = /^data:image\/(jpe?g)/i.test(attachment.inlineDataUrl ?? "");
        const isPng = /^data:image\/png/i.test(attachment.inlineDataUrl ?? "");
        if (!isJpeg && !isPng) return;
        children.push(
          heading(`Evidência ${String(index + 1).padStart(2, "0")}. ${attachment.title}`, HeadingLevel.HEADING_2),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new ImageRun({ data: bytes, type: isJpeg ? "jpg" : "png", transformation: { width: 560, height: 315 } })] }),
          new Paragraph({ spacing: { after: 150 }, children: [wordText(`${attachmentCategoryLabel(attachment.category)} · ${display(attachment.createdAt, "Data não informada")}`, { bold: true, color: PALETTE.muted, size: 17 })] }),
        );
      });
    }
    if (data.emergency.responsible || data.emergency.routes || data.emergency.resources || data.emergency.nextDrill) {
      children.push(heading("Registros de emergência", HeadingLevel.HEADING_2), wordTable(["Plano de emergência", "Registro"], [["Responsável", data.emergency.responsible], ["Recursos", data.emergency.resources], ["Rotas de fuga", data.emergency.routes], ["Periodicidade", data.emergency.periodicity], ["Próximo simulado", data.emergency.nextDrill]]));
    }
  }
  children.push(
    new Paragraph({ children: [new PageBreak()] }),
    heading("15. Garantia de implementação e considerações finais"),
    new Paragraph({ spacing: { after: 120 }, children: [wordText("A implementação das ações e a manutenção do PGR dependem da organização e dos responsáveis designados. As medidas de prevenção devem ser acompanhadas, revisadas quando necessário e comunicadas aos trabalhadores conforme a realidade do estabelecimento.", { size: 18 })] }),
    wordTable(["Registro", "Informação"], [["Observações gerais / inspeção", data.inspectionNotes], ["Responsável técnico", data.signature?.name || data.company.responsibleName], ["Registro profissional", data.signature?.registry || data.company.responsibleRegistry], ["Data de emissão", formatDate(input.generatedAt)], ["Histórico de revisão", `${reviews.length} registro(s) mantido(s) nesta emissão`]]),
  );
  if (data.signature) children.push(wordTable(["Responsável técnico", "Registro", "Data"], [[data.signature.name, [data.signature.title, data.signature.registry].filter(Boolean).join(" · "), data.signature.date]]));

  return new Document({
    creator: "TST Brasil Hub",
    title: `PGR — ${input.projectName}`,
    sections: [{ properties: { page: { margin: { top: 900, right: 900, bottom: 900, left: 900 } } }, children }],
  });
}

export async function downloadProfessionalPgrWord(input: PgrReportInput) {
  const hydratedInput = await hydratePgrImageAttachments(input);
  const blob = await Packer.toBlob(buildProfessionalPgrWord(hydratedInput));
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${safeFileName(input.projectName)}-pgr-profissional.docx`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function isPgrSnapshot(value: unknown) {
  const raw = asRecord(value);
  return Boolean(raw.empresa || raw.ghes || raw.riscos || raw.acoes || raw.mapaRisco);
}

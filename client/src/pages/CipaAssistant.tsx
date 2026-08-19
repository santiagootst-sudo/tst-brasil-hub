import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { jsPDF } from "jspdf";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileDown,
  FileText,
  Gavel,
  Loader2,
  Plus,
  ShieldCheck,
  UsersRound,
  Vote,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { ModuleHeader, ModulePage } from "@/components/ModulePageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { workspaceIdFromSearch } from "@shared/workspaceContext";
import { toast } from "sonner";

type DocumentType = "election_committee" | "union_notice" | "notice" | "registration" | "ballot" | "election_minutes" | "possession_minutes" | "work_plan";

const documentCatalog: Array<{ type: DocumentType; title: string; description: string }> = [
  { type: "election_committee", title: "Ata da Comissão Eleitoral", description: "Formaliza os responsáveis pelo processo." },
  { type: "union_notice", title: "Comunicação ao sindicato", description: "Registra o início do processo eleitoral." },
  { type: "notice", title: "Edital de convocação", description: "Divulga inscrições, votação e apuração." },
  { type: "registration", title: "Ficha de inscrição", description: "Gera o formulário individual de candidatura." },
  { type: "ballot", title: "Cédula de votação", description: "Lista os candidatos para a votação física secreta." },
  { type: "election_minutes", title: "Ata de eleição e apuração", description: "Consolida resultados e ordem dos candidatos." },
  { type: "possession_minutes", title: "Ata de instalação e posse", description: "Formaliza a composição e o mandato." },
  { type: "work_plan", title: "Plano de trabalho CIPA", description: "Organiza ações preventivas e acompanhamento anual." },
];

function dateInput(value?: Date | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function formatDate(value?: Date | null) {
  return value ? new Date(value).toLocaleDateString("pt-BR") : "A definir";
}

function safeFileName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "").toLowerCase();
}

async function asDataUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Logo indisponível");
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o logo"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

type CipaPdfDocument = { type: DocumentType; title: string; content: string; companyLogoUrl: string | null };
type CipaPdfContext = {
  termLabel: string;
  city: string | null;
  workplace: string | null;
  unionName: string | null;
  enrollmentStartsAt: Date | null;
  electionAt: Date | null;
  possessionAt: Date | null;
  committee: Array<{ name: string }>;
  candidates: Array<{ name: string; votes: number; status?: string; condition?: string }>;
  members: Array<{ name: string; role: string; condition: string }>;
};

const PDF_MARGIN = 17;
const PDF_WIDTH = 176;
const PDF_TEAL: [number, number, number] = [35, 118, 123];

function drawCipaSeal(pdf: jsPDF, x: number, y: number, size = 16) {
  pdf.setFillColor(23, 142, 81);
  pdf.circle(x + size / 2, y + size / 2, size / 2, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(Math.max(6, size * 0.42));
  pdf.text("+", x + size / 2, y + size * 0.67, { align: "center" });
  pdf.setFontSize(Math.max(3.8, size * 0.22));
  pdf.text("CIPA", x + size / 2, y + size * 0.3, { align: "center" });
}

function drawPdfFooter(pdf: jsPDF, label: string) {
  pdf.setTextColor(115, 115, 115);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.4);
  pdf.text(label.toUpperCase(), 105, 289, { align: "center" });
}

function drawLine(pdf: jsPDF, x: number, y: number, width: number) {
  pdf.setDrawColor(95, 95, 95);
  pdf.setLineWidth(0.25);
  pdf.line(x, y, x + width, y);
}

function drawTable(pdf: jsPDF, x: number, y: number, widths: number[], headers: string[], rows: string[][], rowHeight = 7, headerColor?: [number, number, number]) {
  const total = widths.reduce((sum, width) => sum + width, 0);
  const drawRow = (values: string[], rowY: number, fill: boolean) => {
    let cursor = x;
    values.forEach((value, index) => {
      if (fill) {
        pdf.setFillColor(...(headerColor || [255, 255, 255]));
        pdf.rect(cursor, rowY, widths[index], rowHeight, "F");
      }
      pdf.setDrawColor(90, 90, 90);
      pdf.rect(cursor, rowY, widths[index], rowHeight);
      pdf.setFont("helvetica", fill ? "bold" : "normal");
      pdf.setFontSize(fill ? 6.5 : 7.1);
      pdf.setTextColor(fill && headerColor ? 255 : 30, fill && headerColor ? 255 : 30, fill && headerColor ? 255 : 30);
      const lines = pdf.splitTextToSize(value, widths[index] - 3) as string[];
      pdf.text(lines.slice(0, 2), cursor + widths[index] / 2, rowY + rowHeight / 2 + 1.1, { align: "center", baseline: "middle" });
      cursor += widths[index];
    });
  };
  drawRow(headers, y, true);
  rows.forEach((row, index) => drawRow(row, y + rowHeight * (index + 1), false));
  return y + rowHeight * (rows.length + 1);
}

function drawSignatureRow(pdf: jsPDF, y: number, labels: string[]) {
  const width = PDF_WIDTH / labels.length;
  labels.forEach((label, index) => {
    const x = PDF_MARGIN + index * width + 5;
    drawLine(pdf, x, y, width - 10);
    pdf.setTextColor(35, 35, 35);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.2);
    pdf.text("NOME", x + (width - 10) / 2, y + 4, { align: "center" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(5.5);
    const lines = pdf.splitTextToSize(label, width - 10) as string[];
    pdf.text(lines, x + (width - 10) / 2, y + 7, { align: "center" });
  });
}

function drawMinutesHeader(pdf: jsPDF, logo: string | null, title: string, subtitle: string) {
  if (logo) {
    try { pdf.addImage(logo, logo.includes("image/png") ? "PNG" : "JPEG", PDF_MARGIN, 8, 30, 13, undefined, "FAST"); } catch { /* mantém o espaço da identidade da empresa */ }
  }
  drawCipaSeal(pdf, 97, 6, 17);
  pdf.setTextColor(45, 45, 45);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6.5);
  pdf.text("ATA OFICIAL · CIPA", 193, 10, { align: "right" });
  pdf.setFontSize(14);
  pdf.text(title, 193, 21, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.5);
  pdf.text(subtitle, 193, 27, { align: "right" });
}

function drawFormalHeader(pdf: jsPDF, logo: string | null, title: string, subtitle: string) {
  if (logo) {
    try { pdf.addImage(logo, logo.includes("image/png") ? "PNG" : "JPEG", 89, 5, 32, 13, undefined, "FAST"); } catch { /* mantém o modelo sem imagem quando o logo estiver indisponível */ }
  }
  pdf.setFillColor(...PDF_TEAL);
  pdf.rect(PDF_MARGIN, 20, PDF_WIDTH, 10, "F");
  pdf.setTextColor(38, 62, 65);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text(title, 105, 42, { align: "center" });
  pdf.setTextColor(...PDF_TEAL);
  pdf.setFontSize(7.1);
  pdf.text(subtitle, 105, 49, { align: "center" });
}

function drawGenericParagraph(pdf: jsPDF, text: string, y: number, size = 7.5) {
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(35, 35, 35);
  pdf.setFontSize(size);
  const lines = pdf.splitTextToSize(text, PDF_WIDTH) as string[];
  pdf.text(lines, PDF_MARGIN, y, { maxWidth: PDF_WIDTH, align: "justify" });
  return y + lines.length * (size * 0.47) + 3;
}

async function downloadCipaPdf(document: CipaPdfDocument, company: { name: string; document: string | null }, context?: CipaPdfContext) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  let logo: string | null = null;
  if (document.companyLogoUrl) {
    try { logo = await asDataUrl(document.companyLogoUrl); } catch { logo = null; }
  }
  const info: CipaPdfContext = context || { termLabel: "____/____", city: null, workplace: null, unionName: null, enrollmentStartsAt: null, electionAt: null, possessionAt: null, committee: [], candidates: [], members: [] };
  const city = info.city || "NOME DA CIDADE";
  const workplace = info.workplace || "____________________________";
  const term = info.termLabel || "____/____";
  const candidates: CipaPdfContext["candidates"] = info.candidates.length ? info.candidates : Array.from({ length: 5 }, (_, index) => ({ name: `NOME DO CANDIDATO ${index + 1}`, votes: 0 }));
  const elected = candidates.filter(candidate => candidate.status === "elected");
  const nonElected = candidates.filter(candidate => candidate.status !== "elected");
  const employerMembers = info.members.filter(member => member.role === "employer_representative");
  const employeeMembers = info.members.filter(member => member.role === "employee_representative");
  const emptyRows = (count: number, columns = 2) => Array.from({ length: count }, () => Array.from({ length: columns }, () => ""));

  if (document.type === "ballot") {
    const ballotHeight = 65;
    for (let copy = 0; copy < 4; copy += 1) {
      const y = 10 + copy * ballotHeight;
      pdf.setDrawColor(55, 55, 55);
      pdf.rect(PDF_MARGIN, y, PDF_WIDTH, ballotHeight - 1);
      if (logo) {
        try { pdf.addImage(logo, logo.includes("image/png") ? "PNG" : "JPEG", 84, y + 3, 36, 11, undefined, "FAST"); } catch { /* mantém a área da marca */ }
      }
      drawCipaSeal(pdf, 165, y + 4, 16);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(25, 25, 25);
      pdf.setFontSize(7.6);
      pdf.text("CÉDULA DE VOTO", 105, y + 20, { align: "center" });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(5.7);
      pdf.text(`ELEIÇÃO DOS REPRESENTANTES DOS EMPREGADOS NA CIPA  |  GESTÃO ${term}`, 105, y + 24, { align: "center" });
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(5.7);
      pdf.text("MARQUE UM X EM APENAS UMA OPÇÃO", 105, y + 28, { align: "center" });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.3);
      candidates.slice(0, 8).forEach((candidate, index) => pdf.text(`☐   ${candidate.name.toUpperCase()}`, PDF_MARGIN + 7, y + 34 + index * 4));
      pdf.text("☐   VOTO NULO", PDF_MARGIN + 7, y + 34 + Math.min(candidates.length, 8) * 4);
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(5.8);
      pdf.text("Voto secreto. Não assine nem identifique esta cédula.", 105, y + 58, { align: "center" });
    }
    drawPdfFooter(pdf, "CÉDULA DE VOTO — ELEIÇÃO DA CIPA");
  } else if (document.type === "registration") {
    for (let copy = 0; copy < 4; copy += 1) {
      const y = 11 + copy * 67;
      pdf.setDrawColor(55, 55, 55);
      pdf.rect(PDF_MARGIN, y, PDF_WIDTH, 63);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.8);
      pdf.text(`FICHA DE INSCRIÇÃO — ELEIÇÃO DA CIPA  |  VIA ${String(copy + 1).padStart(2, "0")}`, 105, y + 8, { align: "center" });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.7);
      pdf.text("Nome completo do candidato:  ________________________________________________________________", PDF_MARGIN + 5, y + 16);
      pdf.text("Função / cargo:  ____________________________________________    Matrícula:  ____________________", PDF_MARGIN + 5, y + 22);
      pdf.text("Área / setor:  _________________________________________________    Data da inscrição:  ____/____/______", PDF_MARGIN + 5, y + 28);
      const declaration = "Declaro meu interesse em participar, como candidato, da eleição dos representantes dos empregados na Comissão Interna de Prevenção de Acidentes e de Assédio — CIPA, conforme o edital de convocação e a NR-05 vigente.";
      pdf.text(pdf.splitTextToSize(declaration, PDF_WIDTH - 10) as string[], PDF_MARGIN + 5, y + 35);
      drawLine(pdf, PDF_MARGIN + 7, y + 47, 58); drawLine(pdf, 119, y + 47, 58);
      pdf.setFontSize(5.5);
      pdf.text("Assinatura do candidato", PDF_MARGIN + 36, y + 51, { align: "center" });
      pdf.text("Recebimento — Comissão Eleitoral / RH / SST", 148, y + 51, { align: "center" });
      pdf.setFontSize(6.1);
      pdf.text("Comprovante de inscrição nº: ____________    Recebido por: ______________________________    Data: ____/____/______", PDF_MARGIN + 5, y + 56);
      pdf.setFontSize(5.5);
      pdf.text(`Período de inscrição: de ${formatDate(info.enrollmentStartsAt)} a ____/____/______.  |  Prazo mínimo: 15 dias corridos`, PDF_MARGIN + 5, y + 61);
    }
  } else if (document.type === "election_minutes") {
    drawMinutesHeader(pdf, logo, "ATA DE ELEIÇÃO", "DOS REPRESENTANTES DOS EMPREGADOS NA CIPA");
    let y = 34;
    y = drawTable(pdf, PDF_MARGIN, y, [PDF_WIDTH], ["IDENTIFICAÇÃO DA ELEIÇÃO"], [[`Organização: ${company.name}     Data: ${formatDate(info.electionAt)}     Local: ${workplace}     Gestão: ${term}`]], 10);
    y += 4;
    y = drawGenericParagraph(pdf, "Aos ____ dias do mês de ____________________ de ______, às ____h____, reuniram-se os integrantes da Comissão Eleitoral, responsáveis pela organização e acompanhamento do processo eleitoral, juntamente com os representantes que acompanharam a votação, para registrar a realização da eleição dos representantes dos empregados na Comissão Interna de Prevenção de Acidentes e de Assédio — CIPA, conforme a NR-05 vigente.", y);
    y = drawGenericParagraph(pdf, "A mesa receptora foi instalada às ____h____. A votação foi encerrada às ____h____, sem registro de ocorrências / com as seguintes ocorrências: ______________________________________________________________. Compareceram ______ empregados. A apuração foi iniciada às ____h____ no local ____________________________.", y);
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(8); pdf.setTextColor(40, 70, 72); pdf.text("RESULTADO DA APURAÇÃO", PDF_MARGIN, y); y += 4;
    y = drawTable(pdf, PDF_MARGIN, y, [118, 58], ["CANDIDATO — MEMBROS TITULARES", "VOTOS"], (elected.filter(item => item.condition === "titular").length ? elected.filter(item => item.condition === "titular") : emptyRows(3).map(() => ({ name: "", votes: 0 }))).map(item => [item.name, item.name ? String(item.votes) : ""]), 7);
    y = drawTable(pdf, PDF_MARGIN, y, [118, 58], ["CANDIDATO — MEMBROS SUPLENTES", "VOTOS"], (elected.filter(item => item.condition === "suplente").length ? elected.filter(item => item.condition === "suplente") : emptyRows(3).map(() => ({ name: "", votes: 0 }))).map(item => [item.name, item.name ? String(item.votes) : ""]), 7);
    y += 4; pdf.setFont("helvetica", "bold"); pdf.setFontSize(8); pdf.text("CANDIDATOS VOTADOS NÃO ELEITOS", PDF_MARGIN, y); y += 4;
    y = drawGenericParagraph(pdf, "Os candidatos votados e não eleitos são relacionados abaixo em ordem decrescente de votos, para fins de registro e eventual nomeação posterior em caso de vacância de suplentes, conforme a NR-05.", y, 6.8);
    y = drawTable(pdf, PDF_MARGIN, y, [118, 58], ["CANDIDATO", "VOTOS"], (nonElected.length ? nonElected : emptyRows(6).map(() => ({ name: "", votes: 0 }))).map(item => [item.name, item.name ? String(item.votes) : ""]), 6.3);
    y = drawGenericParagraph(pdf, "Em caso de empate, será aplicado o critério previsto no item 5.5.7 da NR-05: assumirá o candidato com maior tempo de serviço no estabelecimento. Critério aplicado neste processo: ______________________________________________________________.", y + 3, 6.5);
    y = drawGenericParagraph(pdf, "Nada mais havendo a registrar, a presente ata foi lavrada e será assinada pelos integrantes da Comissão Eleitoral, pelos representantes da mesa e, quando aplicável, pelos candidatos presentes. Cópias da ata de eleição e apuração deverão ser fornecidas aos membros titulares e suplentes da CIPA.", y, 6.5);
    pdf.text(`${city}, ____ de __________________ de ______.`, PDF_MARGIN, Math.min(y + 2, 270));
    drawSignatureRow(pdf, 278, ["Presidente da Mesa / Comissão Eleitoral", "Secretário(a) da Mesa", "Representante da Comissão Eleitoral", "Representante da Comissão Eleitoral"]);
    drawPdfFooter(pdf, "ATA DE ELEIÇÃO — CIPA");
  } else if (document.type === "possession_minutes") {
    drawMinutesHeader(pdf, logo, "ATA DE POSSE", "COMISSÃO INTERNA DE PREVENÇÃO DE ACIDENTES E DE ASSÉDIO — CIPA");
    let y = 34;
    y = drawTable(pdf, PDF_MARGIN, y, [PDF_WIDTH], ["IDENTIFICAÇÃO"], [[`Organização: ${company.name}     Data da posse: ${formatDate(info.possessionAt)}     Horário: ____h____     Local: ${workplace}     Gestão: ${term}`]], 10);
    y += 4;
    y = drawGenericParagraph(pdf, "Aos ____ dias do mês de ____________________ de ______, às ____h____, no local acima indicado, reuniram-se os representantes da organização e dos empregados para a instalação e posse da Comissão Interna de Prevenção de Acidentes e de Assédio — CIPA, em conformidade com a Norma Regulamentadora nº 05 (NR-05), em sua redação vigente.", y);
    y = drawGenericParagraph(pdf, "Após a abertura dos trabalhos, foi declarada instalada a CIPA e foram empossados os representantes da organização, designados pelo empregador, e os representantes dos empregados, eleitos em escrutínio secreto.", y);
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(8); pdf.setTextColor(40, 70, 72); pdf.text("REPRESENTANTES DA ORGANIZAÇÃO — DESIGNADOS", PDF_MARGIN, y); y += 4;
    y = drawTable(pdf, PDF_MARGIN, y, [118, 58], ["NOME", "CONDIÇÃO"], (employerMembers.length ? employerMembers : emptyRows(5).map(() => ({ name: "", condition: "" }))).map(item => [item.name, item.condition ? item.condition.charAt(0).toUpperCase() + item.condition.slice(1) : ""]), 7);
    y += 4; pdf.setFont("helvetica", "bold"); pdf.setFontSize(8); pdf.text("REPRESENTANTES DOS EMPREGADOS — ELEITOS", PDF_MARGIN, y); y += 4;
    y = drawTable(pdf, PDF_MARGIN, y, [118, 58], ["NOME", "CONDIÇÃO"], (employeeMembers.length ? employeeMembers : emptyRows(5).map(() => ({ name: "", condition: "" }))).map(item => [item.name, item.condition ? item.condition.charAt(0).toUpperCase() + item.condition.slice(1) : ""]), 7);
    y += 4; pdf.setFont("helvetica", "bold"); pdf.setFontSize(8); pdf.text("COMPOSIÇÃO DA DIREÇÃO DA CIPA", PDF_MARGIN, y); y += 5;
    y = drawGenericParagraph(pdf, "A organização designou dentre seus representantes o(a) Sr.(a) NOME DO PRESIDENTE para Presidente da CIPA. Os representantes eleitos dos empregados escolheram dentre os titulares o(a) Sr.(a) NOME DO VICE-PRESIDENTE para Vice-Presidente.", y, 6.6);
    y = drawTable(pdf, PDF_MARGIN, y, [88, 88], ["SECRETÁRIO(A) DA CIPA", "SUBSTITUTO(A) DO SECRETÁRIO(A)"], [["", ""]], 8);
    y = drawGenericParagraph(pdf, "O mandato dos membros eleitos terá duração de 1 (um) ano, permitida uma reeleição. A posse ocorrerá em ____/____/______ e o término previsto será em ____/____/______. A data e o horário das reuniões ordinárias foram acordados entre os membros, conforme calendário a ser anexado ou disponibilizado à CIPA.", y + 3, 6.4);
    y = drawGenericParagraph(pdf, "Os membros da CIPA declaram ciência de suas atribuições e responsabilidades, incluindo a participação nas reuniões e atividades de prevenção, bem como a inclusão de temas relacionados à prevenção e ao combate ao assédio sexual e a outras formas de violência no trabalho.", y, 6.4);
    pdf.text(`${city}, ____ de __________________ de ______.`, PDF_MARGIN, Math.min(y + 4, 269));
    drawSignatureRow(pdf, 278, ["Presidente da CIPA", "Vice-Presidente da CIPA", "Secretário(a) da CIPA", "Responsável de SST / Presidente da sessão"]);
    drawPdfFooter(pdf, "ATA DE INSTALAÇÃO E POSSE — CIPA");
  } else if (document.type === "election_committee" || document.type === "notice" || document.type === "union_notice") {
    const isCommittee = document.type === "election_committee";
    const isUnionNotice = document.type === "union_notice";
    drawFormalHeader(pdf, logo, isCommittee ? "ATA DE CONSTITUIÇÃO" : isUnionNotice ? "COMUNICAÇÃO AO SINDICATO" : "EDITAL DE CONVOCAÇÃO", isCommittee ? "DA COMISSÃO ELEITORAL DA CIPA" : isUnionNotice ? "INÍCIO DO PROCESSO ELEITORAL DA CIPA" : "ELEIÇÃO DA COMISSÃO INTERNA DE PREVENÇÃO DE ACIDENTES E DE ASSÉDIO — CIPA");
    let y = 57;
    if (isCommittee) {
      pdf.setFillColor(235, 246, 245); pdf.setDrawColor(163, 205, 199); pdf.rect(PDF_MARGIN, y, PDF_WIDTH, 25, "FD");
      pdf.setFont("helvetica", "bold"); pdf.setTextColor(...PDF_TEAL); pdf.setFontSize(7); pdf.text("IDENTIFICAÇÃO DA REUNIÃO", PDF_MARGIN + 3, y + 5);
      y = drawGenericParagraph(pdf, `Aos ____ dias do mês de ____________________ de ______, às ____h____, reuniram-se os representantes da Comissão Interna de Prevenção de Acidentes e de Assédio — CIPA, gestão ${term}, da organização ${company.name}, no local ${workplace}.`, y + 10, 6.8) + 4;
      y = drawGenericParagraph(pdf, "Nos termos do item 5.5.2 da Norma Regulamentadora nº 05 (NR-05), o Presidente e o Vice-Presidente da CIPA constituem, dentre seus membros, a Comissão Eleitoral responsável pela organização e pelo acompanhamento do processo eleitoral. Nos estabelecimentos onde não houver CIPA, a Comissão Eleitoral será constituída pela organização.", y, 6.8);
      y = drawTable(pdf, PDF_MARGIN, y + 2, [55, 61, 60], ["NOME", "SETOR / CARGO", "FUNÇÃO NA COMISSÃO ELEITORAL"], (info.committee.length ? info.committee : emptyRows(4, 3).map(() => ({ name: "", sector: "", function: "" }))).map(item => [item.name, "", ""]), 8, PDF_TEAL);
      pdf.setFillColor(238, 246, 244); pdf.setDrawColor(175, 208, 202); pdf.rect(PDF_MARGIN, y + 5, PDF_WIDTH, 42, "FD");
      pdf.setFont("helvetica", "bold"); pdf.setTextColor(...PDF_TEAL); pdf.setFontSize(7); pdf.text("PAUTA E RESPONSABILIDADES", PDF_MARGIN + 3, y + 10);
      const duties = ["Organização do processo: elaborar e acompanhar o cronograma, os prazos de inscrição, a divulgação do edital e da relação de inscritos, a votação e a apuração.", "Garantias do processo: assegurar inscrição individual, liberdade de candidatura, fornecimento de comprovante, voto secreto e condições que permitam a participação dos empregados.", "Acompanhamento: registrar os atos do processo eleitoral e orientar os envolvidos, observando os requisitos de segurança, confidencialidade e precisão do registro dos votos.", "Comunicações: providenciar as divulgações necessárias e apoiar a comunicação ao sindicato da categoria preponderante nos casos previstos na NR-05."];
      let dutyY = y + 15; duties.forEach(duty => { dutyY = drawGenericParagraph(pdf, duty, dutyY, 6.1); });
      pdf.setFontSize(6.8); pdf.text(`${city}, ____ de __________________ de ______.`, 193, 250, { align: "right" });
      drawSignatureRow(pdf, 262, ["Presidente da CIPA", "Vice-Presidente da CIPA"]); drawSignatureRow(pdf, 278, ["Membro da Comissão Eleitoral", "Membro da Comissão Eleitoral"]);
      drawPdfFooter(pdf, "ATA DE CONSTITUIÇÃO DA COMISSÃO ELEITORAL");
    } else if (isUnionNotice) {
      pdf.setFillColor(235, 246, 245); pdf.setDrawColor(163, 205, 199); pdf.rect(PDF_MARGIN, y, PDF_WIDTH, 24, "FD");
      pdf.setFont("helvetica", "bold"); pdf.setTextColor(...PDF_TEAL); pdf.setFontSize(7); pdf.text("DESTINATÁRIO", PDF_MARGIN + 3, y + 5);
      pdf.setFont("helvetica", "normal"); pdf.setTextColor(35, 35, 35); pdf.setFontSize(7);
      pdf.text(`À ${info.unionName || "NOME DO SINDICATO / SUBSEDE"}  A/C: SETOR OU RESPONSÁVEL, se aplicável.`, PDF_MARGIN + 3, y + 11);
      pdf.text("Assunto: Comunicação do início do processo eleitoral da Comissão Interna de Prevenção de Acidentes e de Assédio — CIPA.", PDF_MARGIN + 3, y + 17);
      y = drawGenericParagraph(pdf, `Prezados(as),\n${company.name}, inscrita no CNPJ sob nº ${company.document || "______________________"}, estabelecida em ${workplace}, vem, por meio desta, comunicar formalmente o início do processo eleitoral para escolha dos representantes dos empregados na Comissão Interna de Prevenção de Acidentes e de Assédio — CIPA, gestão ${term}.`, y + 31, 7);
      y = drawGenericParagraph(pdf, "A presente comunicação é realizada com antecedência e nos termos do item 5.5.1.1 da Norma Regulamentadora nº 05 (NR-05), podendo ser encaminhada por meio físico ou eletrônico, com confirmação de entrega.", y, 7);
      y += 3;
      y = drawTable(pdf, PDF_MARGIN, y, [88, 88], ["INÍCIO DA INSCRIÇÃO", "PREVISÃO DA ELEIÇÃO"], [[formatDate(info.enrollmentStartsAt), formatDate(info.electionAt)]], 10, PDF_TEAL);
      y += 5; pdf.setFillColor(238, 246, 244); pdf.setDrawColor(175, 208, 202); pdf.rect(PDF_MARGIN, y, PDF_WIDTH, 42, "FD");
      pdf.setFont("helvetica", "bold"); pdf.setTextColor(...PDF_TEAL); pdf.setFontSize(7); pdf.text("DOCUMENTO ENCAMINHADO", PDF_MARGIN + 3, y + 6);
      let messageY = drawGenericParagraph(pdf, "1. Edital de convocação da eleição e abertura do prazo para inscrição de candidatos.", y + 13, 6.5);
      messageY = drawGenericParagraph(pdf, "Informamos que os demais documentos referentes ao processo eleitoral poderão ser encaminhados posteriormente, conforme sua elaboração. Quando solicitada, a organização encaminhará a documentação referente ao processo eleitoral ao sindicato da categoria preponderante no prazo de até 10 (dez) dias, nos termos do item 5.4.9 da NR-05.", messageY, 6.3);
      drawGenericParagraph(pdf, "Solicitamos, por gentileza, a confirmação do recebimento desta comunicação.", messageY + 2, 6.7);
      pdf.setFontSize(6.8); pdf.text(`${city}, ____ de __________________ de ______.`, 193, 250, { align: "right" });
      drawSignatureRow(pdf, 266, ["Presidente da CIPA", "Responsável pela organização / RH ou SST"]);
      drawPdfFooter(pdf, "COMUNICAÇÃO DO PROCESSO ELEITORAL AO SINDICATO");
    } else {
      pdf.setFillColor(235, 246, 245); pdf.setDrawColor(163, 205, 199); pdf.rect(PDF_MARGIN, y, PDF_WIDTH, 34, "FD");
      pdf.setFont("helvetica", "bold"); pdf.setTextColor(...PDF_TEAL); pdf.setFontSize(7); pdf.text("PARTICIPAÇÃO DOS FUNCIONÁRIOS", PDF_MARGIN + 3, y + 5);
      y = drawGenericParagraph(pdf, `Ficam convocados os empregados de ${company.name}, para participarem do processo eleitoral destinado à escolha dos representantes dos empregados na Comissão Interna de Prevenção de Acidentes e de Assédio — CIPA, gestão ${term}. O processo observará a Norma Regulamentadora nº 05 (NR-05), em sua redação vigente, especialmente o item 5.5.`, y + 10, 6.8) + 6;
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(8); pdf.setTextColor(40, 70, 72); pdf.text("CRONOGRAMA DA ELEIÇÃO", PDF_MARGIN, y); y += 5;
      y = drawTable(pdf, PDF_MARGIN, y, [58, 58, 60], ["DATA", "HORÁRIO", "LOCAL"], [[formatDate(info.electionAt), "____h____ às ____h____", workplace]], 10);
      y += 5; pdf.setFillColor(238, 246, 244); pdf.setDrawColor(175, 208, 202); pdf.rect(PDF_MARGIN, y, PDF_WIDTH, 58, "FD");
      pdf.setFont("helvetica", "bold"); pdf.setTextColor(...PDF_TEAL); pdf.setFontSize(7); pdf.text("PROCESSO DE INSCRIÇÃO E VOTAÇÃO", PDF_MARGIN + 3, y + 6);
      const rules = [`Período de inscrição: de ${formatDate(info.enrollmentStartsAt)} a ____/____/______ — mínimo de 15 dias corridos.`, "Quem pode se inscrever: todos os empregados do estabelecimento, independentemente de setor ou local de trabalho.", "Inscrição: individual e gratuita, com fornecimento de comprovante físico ou eletrônico.", "Divulgação: o edital e a relação de inscritos serão divulgados em locais de fácil acesso e visualização, inclusive por meio eletrônico.", "Votação: em dia normal de trabalho, respeitando os turnos, com voto secreto e condições que permitam a participação da maioria dos empregados.", "Apuração: em horário normal de trabalho, com acompanhamento de representantes da organização e dos empregados, facultado aos candidatos."];
      let ruleY = y + 12; rules.forEach(rule => { ruleY = drawGenericParagraph(pdf, rule, ruleY, 6.1); });
      pdf.setFontSize(6.8); pdf.text(`${city}, ____ de __________________ de ______.`, 193, 257, { align: "right" });
      drawSignatureRow(pdf, 272, ["Presidente da CIPA", "Secretário da CIPA ou Técnico de Segurança"]);
      drawPdfFooter(pdf, "EDITAL DE CONVOCAÇÃO DA ELEIÇÃO DA CIPA");
    }
  } else {
    drawFormalHeader(pdf, logo, document.title.toUpperCase(), "COMISSÃO INTERNA DE PREVENÇÃO DE ACIDENTES E DE ASSÉDIO — CIPA");
    let y = 58;
    document.content.split("\n").filter(Boolean).forEach(paragraph => { y = drawGenericParagraph(pdf, paragraph, y); });
    drawPdfFooter(pdf, document.title);
  }
  pdf.save(`cipa-${safeFileName(company.name)}-${safeFileName(document.title)}.pdf`);
}

function documentContent(type: DocumentType, data: {
  companyName: string; cnpj: string | null; city: string | null; unionName: string | null; workplace: string | null; termLabel: string;
  enrollmentStartsAt: Date | null; electionAt: Date | null; possessionAt: Date | null; candidates: Array<{ name: string; votes: number }>;
}) {
  const candidateLines = data.candidates.length ? data.candidates.map((candidate, index) => `${index + 1}. ${candidate.name}${type === "election_minutes" ? ` — ${candidate.votes} voto(s)` : ""}`).join("\n") : "Nenhum candidato registrado até o momento.";
  const sign = `\n${data.city || "Cidade/UF"}, ____ de __________________ de ______.\n\n__________________________________\nNOME — Responsável pelo processo CIPA`;
  const values: Record<DocumentType, string> = {
    election_committee: `IDENTIFICAÇÃO DA REUNIÃO\nGestão: ${data.termLabel}. Local: ${data.workplace || "________________________________"}.\nAos ____ dias do mês de __________________ de ______, às ____h____, reuniram-se os representantes da CIPA para constituir a Comissão Eleitoral responsável pela organização e pelo acompanhamento do processo eleitoral.\nCOMPOSIÇÃO DA COMISSÃO ELEITORAL\nNOME                                      SETOR / CARGO                                      FUNÇÃO NA COMISSÃO\n________________________________________________________________________________\n________________________________________________________________________________\nPAUTA E RESPONSABILIDADES\nOrganizar o cronograma, as inscrições, a divulgação do edital, a votação e a apuração. Assegurar inscrição individual, liberdade de candidatura, comprovante de inscrição e voto secreto. Registrar os atos do processo e apoiar a comunicação ao sindicato, quando aplicável.${sign}`,
    union_notice: `DESTINATÁRIO\nÀ ${data.unionName || "NOME DO SINDICATO / SUBSEDE"}, A/C: __________________________________.\nAssunto: Comunicação do início do processo eleitoral da Comissão Interna de Prevenção de Acidentes e de Assédio — CIPA.\nA organização comunica formalmente o início do processo eleitoral para escolha dos representantes dos empregados na CIPA, gestão ${data.termLabel}, nos termos da NR-05.\nCRONOGRAMA INFORMADO\nInício da inscrição: ${formatDate(data.enrollmentStartsAt)}. Período mínimo: 15 dias corridos. Previsão da eleição: ${formatDate(data.electionAt)}.\nSolicitamos a confirmação do recebimento desta comunicação.${sign}`,
    notice: `PARTICIPAÇÃO DOS FUNCIONÁRIOS\nFicam convocados os empregados do estabelecimento ${data.workplace || "________________________________"} para participar do processo eleitoral destinado à escolha dos representantes dos empregados na CIPA, gestão ${data.termLabel}.\nCRONOGRAMA DA ELEIÇÃO\nData: ${formatDate(data.electionAt)}. Horário: ____h____ às ____h____. Local: ${data.workplace || "________________________________"}.\nPROCESSO DE INSCRIÇÃO E VOTAÇÃO\nPeríodo de inscrição: de ${formatDate(data.enrollmentStartsAt)} a ____/____/______. A inscrição é individual e gratuita, com fornecimento de comprovante. A votação ocorrerá em dia normal de trabalho, com voto secreto e condições de participação dos empregados.${sign}`,
    registration: `VIA 01 — COMPROVANTE DE INSCRIÇÃO\nNome completo do candidato: __________________________________________________________\nFunção / cargo: ___________________________________     Matrícula: ____________________\nÁrea / setor: _______________________________________     Data da inscrição: ____/____/______\nDeclaro meu interesse em participar, como candidato, da eleição dos representantes dos empregados na CIPA, conforme o edital de convocação e a NR-05 vigente.\n\n______________________________                    ______________________________\nAssinatura do candidato                                      Recebimento — Comissão Eleitoral / RH / SST\n\nComprovante de inscrição nº: ____________     Recebido por: ____________________________\nPeríodo de inscrição: de ${formatDate(data.enrollmentStartsAt)} a ____/____/______. Prazo mínimo: 15 dias corridos.\n\nVIA 02 — COMPROVANTE DE INSCRIÇÃO\nNome completo do candidato: __________________________________________________________\nFunção / cargo: ___________________________________     Matrícula: ____________________\nÁrea / setor: _______________________________________     Data da inscrição: ____/____/______\n\n______________________________                    ______________________________\nAssinatura do candidato                                      Recebimento — Comissão Eleitoral / RH / SST`,
    ballot: `GESTÃO ${data.termLabel}\nMARQUE UM X EM APENAS UMA OPÇÃO\n${candidateLines}\n☐   VOTO NULO\nVoto secreto. Não assine nem identifique esta cédula.\n\nCÉDULA DE VOTO — VIA DE CONTROLE\nGESTÃO ${data.termLabel}\nMARQUE UM X EM APENAS UMA OPÇÃO\n${candidateLines}\n☐   VOTO NULO\nVoto secreto. Não assine nem identifique esta cédula.`,
    election_minutes: `IDENTIFICAÇÃO DA ELEIÇÃO\nGestão: ${data.termLabel}. Data da votação: ${formatDate(data.electionAt)}. Local: ${data.workplace || "________________________________"}.\nAos ____ dias do mês de __________________ de ______, às ____h____, reuniram-se os integrantes da Comissão Eleitoral para registrar a realização da eleição dos representantes dos empregados na CIPA, conforme a NR-05 vigente.\nRESULTADO DA APURAÇÃO\nCANDIDATOS — MEMBROS TITULARES E SUPLENTES\n${candidateLines}\nCANDIDATOS VOTADOS NÃO ELEITOS\nOs candidatos não eleitos são relacionados em ordem decrescente de votos para fins de registro e eventual nomeação posterior em caso de vacância. Em caso de empate, será aplicado o critério do maior tempo de serviço no estabelecimento.${sign}\n\n______________________________     ______________________________\nNOME — Presidente da Mesa                         NOME — Secretário(a) da Mesa`,
    possession_minutes: `IDENTIFICAÇÃO\nGestão: ${data.termLabel}. Data da posse: ${formatDate(data.possessionAt)}. Horário: ____h____. Local: ${data.workplace || "________________________________"}.\nAos ____ dias do mês de __________________ de ______, reuniram-se os representantes da organização e dos empregados para a instalação e posse da CIPA, em conformidade com a NR-05.\nREPRESENTANTES DA ORGANIZAÇÃO — DESIGNADOS\nNOME                                      CONDIÇÃO\n________________________________________________________________________________\nREPRESENTANTES DOS EMPREGADOS — ELEITOS\nNOME                                      CONDIÇÃO\n________________________________________________________________________________\nCOMPOSIÇÃO DA DIREÇÃO DA CIPA\nPresidente: ______________________________________. Vice-Presidente: ______________________________________.\nSecretário(a): _____________________________________. Substituto(a): ________________________________________.\nO mandato dos membros eleitos terá duração de 1 (um) ano, permitida uma reeleição. Os membros declaram ciência de suas atribuições e responsabilidades.${sign}`,
    work_plan: `GESTÃO ${data.termLabel}\nAÇÃO                                      RESPONSÁVEL                                      PRAZO\nAcompanhar perigos e medidas de prevenção          ______________________________          ____/____/______\nRealizar inspeções e registrar oportunidades        ______________________________          ____/____/______\nPromover ações preventivas e SIPAT                   ______________________________          ____/____/______\nAcompanhar ocorrências e recomendações              ______________________________          ____/____/______\nIncluir prevenção ao assédio e à violência          ______________________________          ____/____/______\nO plano de trabalho deverá ser acompanhado nas reuniões da CIPA, com responsáveis, prazos e evidências de conclusão.${sign}`,
  };
  return values[type];
}

function SectionTitle({ icon: Icon, eyebrow, title, description }: { icon: typeof ShieldCheck; eyebrow: string; title: string; description: string }) {
  return <div className="flex gap-3 border-b border-[#e8f0ee] pb-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#e8f6f1] text-[#0c7474]"><Icon className="h-5 w-5" /></div><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#0c8c89]">{eyebrow}</p><h2 className="mt-0.5 text-lg font-bold tracking-tight text-[#102b32]">{title}</h2><p className="mt-1 text-sm leading-5 text-[#668087]">{description}</p></div></div>;
}

export default function CipaAssistant() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [, setLocation] = useLocation();
  const search = useSearch();
  const workspaces = trpc.portal.workspaces.useQuery(undefined, { enabled: Boolean(user) });
  const requestedWorkspaceId = workspaceIdFromSearch(search);
  const activeWorkspace = requestedWorkspaceId ? workspaces.data?.find(workspace => workspace.id === requestedWorkspaceId) ?? workspaces.data?.[0] : workspaces.data?.[0];
  const snapshot = trpc.portal.cipaSnapshot.useQuery({ workspaceId: activeWorkspace?.id ?? 0 }, { enabled: Boolean(activeWorkspace?.id) });
  const utils = trpc.useUtils();
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedCommissionId, setSelectedCommissionId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "election" | "members" | "documents">("overview");
  const [showCreate, setShowCreate] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [riskLevel, setRiskLevel] = useState("3");
  const [employeeCount, setEmployeeCount] = useState("0");
  const [city, setCity] = useState("");
  const [workplace, setWorkplace] = useState("");
  const [unionName, setUnionName] = useState("");
  const [termLabel, setTermLabel] = useState(`${new Date().getFullYear()}/${new Date().getFullYear() + 1}`);
  const [enrollmentStartsAt, setEnrollmentStartsAt] = useState("");
  const [electionAt, setElectionAt] = useState("");
  const [possessionAt, setPossessionAt] = useState("");
  const [candidateEmployeeId, setCandidateEmployeeId] = useState("");
  const [committeeEmployeeId, setCommitteeEmployeeId] = useState("");
  const [memberEmployeeId, setMemberEmployeeId] = useState("");
  const [memberRole, setMemberRole] = useState<"employer_representative" | "employee_representative">("employer_representative");
  const [memberCondition, setMemberCondition] = useState<"titular" | "suplente">("titular");
  const [voteDrafts, setVoteDrafts] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!snapshot.data?.companies.length) return;
    const next = activeWorkspace?.kind === "clt" ? snapshot.data.companies[0]?.id : selectedCompanyId ?? snapshot.data.companies[0]?.id;
    setSelectedCompanyId(next ?? null);
  }, [activeWorkspace?.kind, selectedCompanyId, snapshot.data?.companies]);

  const selectedCompany = snapshot.data?.companies.find(company => company.id === selectedCompanyId) ?? null;
  const commissionsForCompany = snapshot.data?.commissions.filter(item => item.companyId === selectedCompanyId) ?? [];
  const selectedCommission = commissionsForCompany.find(item => item.id === selectedCommissionId) ?? commissionsForCompany[0] ?? null;
  const selectedTerm = selectedCommission ? snapshot.data?.terms.filter(term => term.commissionId === selectedCommission.id).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0] ?? null : null;
  const commissionEmployees = snapshot.data?.employees.filter(employee => employee.companyId === selectedCompanyId && employee.status === "active") ?? [];
  const members = selectedTerm ? snapshot.data?.members.filter(member => member.termId === selectedTerm.id) ?? [] : [];
  const candidates = members.filter(member => member.role === "candidate");
  const committee = members.filter(member => member.role === "election_committee");
  const installedMembers = members.filter(member => member.role === "employer_representative" || member.role === "employee_representative");
  const documents = selectedTerm ? snapshot.data?.documents.filter(document => document.termId === selectedTerm.id) ?? [] : [];
  const employeeName = (employeeId: number) => snapshot.data?.employees.find(employee => employee.id === employeeId)?.fullName ?? "Funcionário não localizado";
  const buildPdfContext = (): CipaPdfContext | undefined => selectedTerm ? {
    termLabel: selectedTerm.label,
    city: selectedCommission?.city ?? null,
    workplace: selectedCommission?.workplace ?? null,
    unionName: selectedCommission?.unionName ?? null,
    enrollmentStartsAt: selectedTerm.enrollmentStartsAt,
    electionAt: selectedTerm.electionAt,
    possessionAt: selectedTerm.possessionAt,
    committee: committee.map(item => ({ name: employeeName(item.employeeId) })),
    candidates: candidates.map(item => ({ name: employeeName(item.employeeId), votes: item.voteCount, status: item.status, condition: item.condition })),
    members: installedMembers.map(item => ({ name: employeeName(item.employeeId), role: item.role, condition: item.condition })),
  } : undefined;

  const createCommission = trpc.portal.createCipaCommission.useMutation({
    onSuccess: async () => { await utils.portal.cipaSnapshot.invalidate(); setShowCreate(false); setActiveTab("overview"); toast.success("Gestão CIPA criada e vinculada à empresa."); },
    onError: error => toast.error(error.message),
  });
  const createMember = trpc.portal.createCipaMember.useMutation({
    onSuccess: async () => { await utils.portal.cipaSnapshot.invalidate(); setCandidateEmployeeId(""); setCommitteeEmployeeId(""); setMemberEmployeeId(""); toast.success("Registro incluído na gestão CIPA."); },
    onError: error => toast.error(error.message),
  });
  const updateElection = trpc.portal.updateCipaMemberElection.useMutation({ onSuccess: () => utils.portal.cipaSnapshot.invalidate(), onError: error => toast.error(error.message) });
  const createDocument = trpc.portal.createCipaDocument.useMutation({ onError: error => toast.error(error.message) });

  const resetCompanyForm = (nextCompanyId: string) => {
    setCompanyId(nextCompanyId);
    const count = snapshot.data?.employees.filter(employee => employee.companyId === Number(nextCompanyId) && employee.status === "active").length ?? 0;
    setEmployeeCount(String(count));
  };

  const handleCreate = () => {
    if (!activeWorkspace || !companyId) return toast.error("Selecione a empresa para a CIPA.");
    createCommission.mutate({
      workspaceId: activeWorkspace.id, companyId: Number(companyId), riskLevel: Number(riskLevel), employeeCount: Number(employeeCount),
      city: city || null, workplace: workplace || null, unionName: unionName || null, termLabel,
      enrollmentStartsAt: enrollmentStartsAt ? new Date(`${enrollmentStartsAt}T12:00:00`) : null,
      electionAt: electionAt ? new Date(`${electionAt}T12:00:00`) : null,
      possessionAt: possessionAt ? new Date(`${possessionAt}T12:00:00`) : null,
      endsAt: possessionAt ? new Date(new Date(`${possessionAt}T12:00:00`).setFullYear(new Date(`${possessionAt}T12:00:00`).getFullYear() + 1)) : null,
    });
  };

  const addMember = (employeeId: string, role: "election_committee" | "candidate" | "employer_representative" | "employee_representative", condition: "titular" | "suplente" | "not_applicable" = "not_applicable") => {
    if (!activeWorkspace || !selectedCommission || !selectedTerm || !employeeId) return toast.error("Selecione um funcionário e uma gestão CIPA.");
    createMember.mutate({ workspaceId: activeWorkspace.id, commissionId: selectedCommission.id, termId: selectedTerm.id, employeeId: Number(employeeId), role, condition });
  };

  const saveCandidateResult = (candidate: typeof candidates[number], status: "elected" | "not_elected", condition: "titular" | "suplente" | "not_applicable") => {
    if (!activeWorkspace) return;
    updateElection.mutate({ workspaceId: activeWorkspace.id, memberId: candidate.id, voteCount: Number(voteDrafts[candidate.id] ?? candidate.voteCount), status, condition });
  };

  const generateDocument = async (type: DocumentType) => {
    if (!activeWorkspace || !selectedCommission || !selectedTerm || !selectedCompany) return;
    const catalog = documentCatalog.find(item => item.type === type);
    if (!catalog) return;
    const content = documentContent(type, {
      companyName: selectedCompany.name, cnpj: selectedCompany.document, city: selectedCommission.city, unionName: selectedCommission.unionName,
      workplace: selectedCommission.workplace, termLabel: selectedTerm.label, enrollmentStartsAt: selectedTerm.enrollmentStartsAt,
      electionAt: selectedTerm.electionAt, possessionAt: selectedTerm.possessionAt,
      candidates: candidates.map(candidate => ({ name: employeeName(candidate.employeeId), votes: candidate.voteCount })),
    });
    try {
      const created = await createDocument.mutateAsync({ workspaceId: activeWorkspace.id, commissionId: selectedCommission.id, termId: selectedTerm.id, type, title: catalog.title, content });
      await utils.portal.cipaSnapshot.invalidate();
      await downloadCipaPdf(created, selectedCompany, buildPdfContext());
      toast.success("Documento registrado no dossiê e preparado em PDF.");
    } catch { /* o estado de erro do mutation já informa o usuário */ }
  };

  if (loading || workspaces.isLoading || snapshot.isLoading) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#0c7474]" /></div>;
  if (!activeWorkspace) return <DashboardLayout title="CIPA"><div className="mx-auto max-w-xl rounded-3xl border border-[#dcebe8] bg-white p-10 text-center shadow-sm"><ShieldCheck className="mx-auto h-10 w-10 text-[#0c7474]" /><h2 className="mt-4 text-2xl font-bold text-[#102b32]">Crie um ambiente para iniciar a CIPA.</h2><p className="mt-2 text-sm leading-6 text-[#668087]">A gestão eleitoral e documental precisa ficar vinculada ao ambiente correto.</p><Button onClick={() => setLocation("/app")} className="mt-6 rounded-xl bg-[#0c7474] text-white">Voltar ao dashboard</Button></div></DashboardLayout>;

  const modeLabel = activeWorkspace.kind === "clt" ? "Ambiente CLT · uma CIPA" : "Prestador · CIPAs por empresa";
  return <DashboardLayout title="CIPA"><ModulePage>
    <ModuleHeader eyebrow="Gestão documental e eleitoral" title="CIPA" description="Conduza o ciclo eleitoral, a composição e o dossiê da CIPA sem misturar os dados de cada empresa." icon={ShieldCheck} actions={<div className="flex flex-wrap items-center gap-2"><span className="rounded-lg border border-[#dbe6e4] bg-white px-3 py-2 text-xs font-bold text-[#587076]">{modeLabel}</span><span className="inline-flex items-center gap-2 rounded-lg border border-[#dbe6e4] bg-white px-3 py-2 text-xs font-bold text-[#17383e]">{selectedCompany?.logoUrl ? <img src={selectedCompany.logoUrl} alt={`Logo ${selectedCompany.name}`} className="h-5 w-8 rounded bg-white object-contain" /> : <Building2 className="h-4 w-4 text-[#087f78]" />}{selectedCompany?.name ?? "Selecione uma empresa"}</span></div>} />

    <div className="flex flex-col gap-3 rounded-2xl border border-[#dcebe8] bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#edf8f5] text-[#0c7474]"><Building2 className="h-5 w-5" /></div><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#83a09a]">Empresa ativa</p>{activeWorkspace.kind === "autonomo" ? <select value={selectedCompanyId ?? ""} onChange={event => { setSelectedCompanyId(Number(event.target.value)); setSelectedCommissionId(null); }} className="mt-0.5 max-w-xs bg-transparent text-sm font-bold text-[#102b32] outline-none">{snapshot.data?.companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}</select> : <p className="truncate text-sm font-bold text-[#102b32]">{selectedCompany?.name ?? "Cadastre a empresa em Estrutura"}</p>}</div></div><div className="flex items-center gap-2"><span className="rounded-full bg-[#f2f8f6] px-3 py-1.5 text-xs font-semibold text-[#51706e]">{commissionsForCompany.length} CIPA(s) registrada(s)</span><Button onClick={() => { setShowCreate(true); resetCompanyForm(String(selectedCompanyId ?? "")); }} className="rounded-xl bg-[#0c7474] text-white hover:bg-[#063b43]"><Plus className="mr-2 h-4 w-4" />Nova gestão</Button></div></div>

    {showCreate && <section className="rounded-[1.75rem] border border-[#a9dbcf] bg-[linear-gradient(120deg,#effaf6_0%,#ffffff_55%)] p-5 shadow-sm lg:p-6"><SectionTitle icon={Plus} eyebrow="Nova gestão" title="Configurar a CIPA e o primeiro mandato" description={activeWorkspace.kind === "clt" ? "O ambiente CLT mantém uma única CIPA e preserva os mandatos no histórico." : "No ambiente Prestador, a gestão fica isolada pela empresa cliente selecionada."} /><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3"><label className="text-sm font-semibold text-[#315158]">Empresa<select value={companyId} onChange={event => resetCompanyForm(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#cfe3de] bg-white px-3 text-sm font-medium outline-none">{snapshot.data?.companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label><label className="text-sm font-semibold text-[#315158]">Grau de risco<select value={riskLevel} onChange={event => setRiskLevel(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#cfe3de] bg-white px-3 text-sm font-medium outline-none"><option value="1">Grau 1</option><option value="2">Grau 2</option><option value="3">Grau 3</option><option value="4">Grau 4</option></select></label><label className="text-sm font-semibold text-[#315158]">Empregados do estabelecimento<Input type="number" min="0" value={employeeCount} onChange={event => setEmployeeCount(event.target.value)} className="mt-2 h-11 rounded-xl border-[#cfe3de]" /></label><label className="text-sm font-semibold text-[#315158]">Mandato / gestão<Input value={termLabel} onChange={event => setTermLabel(event.target.value)} className="mt-2 h-11 rounded-xl border-[#cfe3de]" placeholder="2026/2027" /></label><label className="text-sm font-semibold text-[#315158]">Cidade / UF<Input value={city} onChange={event => setCity(event.target.value)} className="mt-2 h-11 rounded-xl border-[#cfe3de]" placeholder="Porto Alegre/RS" /></label><label className="text-sm font-semibold text-[#315158]">Local de votação<Input value={workplace} onChange={event => setWorkplace(event.target.value)} className="mt-2 h-11 rounded-xl border-[#cfe3de]" placeholder="Unidade, refeitório, auditório" /></label><label className="text-sm font-semibold text-[#315158] md:col-span-2">Sindicato da categoria <span className="font-normal text-[#83a09a]">(se aplicável)</span><Input value={unionName} onChange={event => setUnionName(event.target.value)} className="mt-2 h-11 rounded-xl border-[#cfe3de]" /></label><label className="text-sm font-semibold text-[#315158]">Início das inscrições<Input type="date" value={enrollmentStartsAt} onChange={event => setEnrollmentStartsAt(event.target.value)} className="mt-2 h-11 rounded-xl border-[#cfe3de]" /></label><label className="text-sm font-semibold text-[#315158]">Data da votação<Input type="date" value={electionAt} onChange={event => setElectionAt(event.target.value)} className="mt-2 h-11 rounded-xl border-[#cfe3de]" /></label><label className="text-sm font-semibold text-[#315158]">Data da posse<Input type="date" value={possessionAt} onChange={event => setPossessionAt(event.target.value)} className="mt-2 h-11 rounded-xl border-[#cfe3de]" /></label></div><div className="mt-5 flex flex-wrap justify-end gap-3"><Button variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button><Button disabled={createCommission.isPending} onClick={handleCreate} className="rounded-xl bg-[#0c7474] text-white hover:bg-[#063b43]">{createCommission.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}Criar gestão CIPA</Button></div></section>}

    {!selectedCompany ? <section className="rounded-[1.75rem] border border-dashed border-[#c9ded8] bg-white p-10 text-center"><Building2 className="mx-auto h-10 w-10 text-[#0c7474]" /><h2 className="mt-4 text-xl font-bold text-[#102b32]">Cadastre a empresa antes de iniciar.</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#668087]">A CIPA é sempre vinculada à empresa e seus documentos usam o logotipo cadastrado no respectivo ambiente.</p><Button onClick={() => setLocation(`/app/estrutura?workspace=${activeWorkspace.id}`)} variant="outline" className="mt-5 rounded-xl border-[#b9dcd2] text-[#0c7474]">Abrir Estrutura da empresa <ChevronRight className="ml-2 h-4 w-4" /></Button></section> : !selectedCommission || !selectedTerm ? <section className="rounded-[1.75rem] border border-dashed border-[#c9ded8] bg-white p-10 text-center"><ShieldCheck className="mx-auto h-11 w-11 text-[#0c7474]" /><h2 className="mt-4 text-xl font-bold text-[#102b32]">Nenhuma gestão CIPA para {selectedCompany.name}.</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#668087]">Crie a gestão para registrar o cronograma eleitoral, os integrantes e os documentos desta empresa.</p><Button onClick={() => { setShowCreate(true); resetCompanyForm(String(selectedCompany.id)); }} className="mt-5 rounded-xl bg-[#0c7474] text-white"><Plus className="mr-2 h-4 w-4" />Criar gestão</Button></section> : <>
      {commissionsForCompany.length > 1 && <div className="flex flex-wrap gap-2">{commissionsForCompany.map(commission => <button key={commission.id} onClick={() => setSelectedCommissionId(commission.id)} className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${selectedCommission.id === commission.id ? "bg-[#0c7474] text-white" : "bg-[#edf6f3] text-[#51706e] hover:bg-[#dceee8]"}`}>CIPA #{commission.id}</button>)}</div>}
      <nav className="flex overflow-x-auto rounded-2xl border border-[#dcebe8] bg-white p-1.5 shadow-sm" aria-label="Navegação da gestão CIPA">{([ ["overview", "Visão da gestão", ShieldCheck], ["election", "Processo eleitoral", Vote], ["members", "Composição", UsersRound], ["documents", "Documentos", FileText] ] as const).map(([key, label, Icon]) => <button key={key} onClick={() => setActiveTab(key)} className={`flex min-w-max flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${activeTab === key ? "bg-[#e8f6f1] text-[#0c7474] shadow-sm" : "text-[#668087] hover:bg-[#f6fbf9]"}`}><Icon className="h-4 w-4" />{label}</button>)}</nav>

      {activeTab === "overview" && <div className="grid gap-5 lg:grid-cols-[1.3fr_.7fr]"><section className="rounded-[1.75rem] border border-[#dcebe8] bg-white p-5 shadow-sm lg:p-6"><SectionTitle icon={ShieldCheck} eyebrow="Gestão ativa" title={`CIPA · ${selectedTerm.label}`} description="Acompanhamento da empresa, do ciclo eleitoral e do dossiê documental." /><div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-[#f5faf8] p-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#83a09a]">Empresa</p><p className="mt-1 font-bold text-[#17383e]">{selectedCompany.name}</p><p className="mt-1 text-xs text-[#668087]">{selectedCompany.document || "CNPJ não informado"}</p></div><div className="rounded-2xl bg-[#f5faf8] p-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#83a09a]">Dimensionamento informado</p><p className="mt-1 font-bold text-[#17383e]">Grau {selectedCommission.riskLevel} · {selectedCommission.employeeCount} empregados</p><p className="mt-1 text-xs text-[#668087]">Validar conforme o Quadro I da NR-05.</p></div><div className="rounded-2xl bg-[#f5faf8] p-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#83a09a]">Votação</p><p className="mt-1 font-bold text-[#17383e]">{formatDate(selectedTerm.electionAt)}</p><p className="mt-1 text-xs text-[#668087]">Inscrições desde {formatDate(selectedTerm.enrollmentStartsAt)}</p></div><div className="rounded-2xl bg-[#f5faf8] p-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#83a09a]">Posse</p><p className="mt-1 font-bold text-[#17383e]">{formatDate(selectedTerm.possessionAt)}</p><p className="mt-1 text-xs text-[#668087]">Mandato até {formatDate(selectedTerm.endsAt)}</p></div></div></section><section className="rounded-[1.75rem] bg-[#083f47] p-5 text-white shadow-[0_14px_45px_rgba(6,59,67,.18)]"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#a8efd8]">Próxima ação</p><h2 className="mt-3 text-xl font-bold leading-tight">Complete a comissão e publique o edital.</h2><p className="mt-3 text-sm leading-6 text-white/70">O dossiê é gerado com a identidade visual de {selectedCompany.name} e fica disponível apenas neste ambiente.</p><Button onClick={() => setActiveTab("election")} className="mt-5 rounded-xl bg-[#a8efd8] text-[#053d43] hover:bg-white">Abrir processo eleitoral <ChevronRight className="ml-2 h-4 w-4" /></Button><div className="mt-6 border-t border-white/10 pt-4 text-xs text-white/60">{candidates.length} candidato(s) · {installedMembers.length} membro(s) composto(s) · {documents.length} documento(s)</div></section></div>}

      {activeTab === "election" && <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]"><section className="rounded-[1.75rem] border border-[#dcebe8] bg-white p-5 shadow-sm"><SectionTitle icon={Gavel} eyebrow="Comissão eleitoral" title="Responsáveis pelo processo" description="Selecione os integrantes registrados entre os funcionários da empresa." /><div className="mt-5 flex gap-2"><select value={committeeEmployeeId} onChange={event => setCommitteeEmployeeId(event.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm outline-none"><option value="">Selecionar funcionário</option>{commissionEmployees.map(employee => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}</select><Button disabled={createMember.isPending} onClick={() => addMember(committeeEmployeeId, "election_committee")} className="rounded-xl bg-[#0c7474] text-white">Adicionar</Button></div><div className="mt-5 space-y-2">{committee.length ? committee.map(item => <div key={item.id} className="flex items-center gap-3 rounded-xl border border-[#e6f0ee] p-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e8f6f1] text-[#0c7474]"><Gavel className="h-4 w-4" /></span><p className="text-sm font-bold text-[#315158]">{employeeName(item.employeeId)}</p></div>) : <p className="rounded-xl bg-[#f8fbfa] p-4 text-sm text-[#668087]">Ainda não há comissão eleitoral registrada.</p>}</div></section><section className="rounded-[1.75rem] border border-[#dcebe8] bg-white p-5 shadow-sm"><SectionTitle icon={Vote} eyebrow="Candidaturas e apuração" title="Representação dos empregados" description="Registre candidaturas e, após a votação, inclua o resultado consolidado sem armazenar voto individual." /><div className="mt-5 flex gap-2"><select value={candidateEmployeeId} onChange={event => setCandidateEmployeeId(event.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm outline-none"><option value="">Selecionar candidato</option>{commissionEmployees.map(employee => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}</select><Button disabled={createMember.isPending} onClick={() => addMember(candidateEmployeeId, "candidate")} className="rounded-xl bg-[#0c7474] text-white">Inscrever</Button></div><div className="mt-5 space-y-3">{candidates.length ? candidates.map(candidate => <div key={candidate.id} className="rounded-2xl border border-[#e4efec] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-[#17383e]">{employeeName(candidate.employeeId)}</p><p className="mt-1 text-xs text-[#668087]">Status: {candidate.status === "elected" ? "Eleito" : candidate.status === "not_elected" ? "Não eleito" : "Candidatura ativa"}</p></div><div className="flex flex-wrap items-center gap-2"><Input type="number" min="0" value={voteDrafts[candidate.id] ?? String(candidate.voteCount)} onChange={event => setVoteDrafts(current => ({ ...current, [candidate.id]: event.target.value }))} className="h-9 w-20 rounded-lg border-[#cfe3de] text-sm" aria-label={`Votos de ${employeeName(candidate.employeeId)}`} /><Button size="sm" variant="outline" onClick={() => saveCandidateResult(candidate, "elected", "titular")} className="rounded-lg border-[#9fd3c4] text-[#0c7474]">Titular</Button><Button size="sm" variant="outline" onClick={() => saveCandidateResult(candidate, "elected", "suplente")} className="rounded-lg border-[#9fd3c4] text-[#0c7474]">Suplente</Button><Button size="sm" variant="ghost" onClick={() => saveCandidateResult(candidate, "not_elected", "not_applicable")} className="rounded-lg text-[#668087]">Não eleito</Button></div></div></div>) : <p className="rounded-xl bg-[#f8fbfa] p-4 text-sm text-[#668087]">Inscreva os candidatos para disponibilizá-los na cédula e na ata de apuração.</p>}</div></section></div>}

      {activeTab === "members" && <div className="grid gap-5 xl:grid-cols-[.75fr_1.25fr]"><section className="rounded-[1.75rem] border border-[#dcebe8] bg-white p-5 shadow-sm"><SectionTitle icon={UsersRound} eyebrow="Composição" title="Designados e representantes" description="Inclua os membros do empregador e consolide os representantes eleitos." /><div className="mt-5 space-y-3"><select value={memberEmployeeId} onChange={event => setMemberEmployeeId(event.target.value)} className="h-11 w-full rounded-xl border border-[#cfe3de] bg-white px-3 text-sm outline-none"><option value="">Selecionar funcionário</option>{commissionEmployees.map(employee => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}</select><div className="grid grid-cols-2 gap-3"><select value={memberRole} onChange={event => setMemberRole(event.target.value as typeof memberRole)} className="h-11 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm outline-none"><option value="employer_representative">Representante do empregador</option><option value="employee_representative">Representante dos empregados</option></select><select value={memberCondition} onChange={event => setMemberCondition(event.target.value as typeof memberCondition)} className="h-11 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm outline-none"><option value="titular">Titular</option><option value="suplente">Suplente</option></select></div><Button disabled={createMember.isPending} onClick={() => addMember(memberEmployeeId, memberRole, memberCondition)} className="w-full rounded-xl bg-[#0c7474] text-white">Adicionar à composição</Button></div></section><section className="rounded-[1.75rem] border border-[#dcebe8] bg-white p-5 shadow-sm"><SectionTitle icon={BadgeCheck} eyebrow="Quadro atual" title="Integrantes da gestão" description="A composição combina designados, eleitos e suplentes registrados no processo." /><div className="mt-5 grid gap-3 md:grid-cols-2">{installedMembers.length ? installedMembers.map(member => <div key={member.id} className="rounded-2xl border border-[#e4efec] bg-[#fbfefd] p-4"><p className="font-bold text-[#17383e]">{employeeName(member.employeeId)}</p><p className="mt-2 text-xs font-semibold text-[#0c7474]">{member.role === "employer_representative" ? "Empregador" : "Empregados"} · {member.condition}</p></div>) : <p className="md:col-span-2 rounded-xl bg-[#f8fbfa] p-4 text-sm text-[#668087]">Registre os representantes do empregador e formalize os eleitos após a apuração.</p>}</div></section></div>}

      {activeTab === "documents" && <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]"><section className="rounded-[1.75rem] border border-[#dcebe8] bg-white p-5 shadow-sm"><SectionTitle icon={FileText} eyebrow="Documentos parametrizados" title="Gerar e registrar no dossiê" description="Cada documento usa os dados da gestão e o logotipo cadastrado na empresa ativa." /><div className="mt-5 grid gap-3 md:grid-cols-2">{documentCatalog.map(item => <div key={item.type} className="rounded-2xl border border-[#e4efec] bg-[#fbfefd] p-4"><FileText className="h-5 w-5 text-[#0c7474]" /><h3 className="mt-3 text-sm font-bold text-[#17383e]">{item.title}</h3><p className="mt-1 min-h-10 text-xs leading-5 text-[#668087]">{item.description}</p><Button disabled={createDocument.isPending} onClick={() => generateDocument(item.type)} variant="outline" className="mt-4 w-full rounded-xl border-[#b9dcd2] text-[#0c7474] hover:bg-[#e8f6f1]"><FileDown className="mr-2 h-4 w-4" />Gerar PDF</Button></div>)}</div></section><section className="rounded-[1.75rem] border border-[#dcebe8] bg-white p-5 shadow-sm"><SectionTitle icon={FileDown} eyebrow="Dossiê persistente" title="Documentos da gestão" description="Os dados e a identidade utilizada em cada emissão ficam preservados neste ambiente." /><div className="mt-5 space-y-2">{documents.length ? documents.map(document => <div key={document.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#e4efec] p-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-[#315158]">{document.title}</p><p className="mt-1 text-xs text-[#83a09a]">Emitido em {new Date(document.createdAt).toLocaleDateString("pt-BR")}</p></div><Button size="icon" variant="ghost" onClick={() => selectedCompany && downloadCipaPdf(document, selectedCompany, buildPdfContext())} className="h-9 w-9 shrink-0 rounded-lg text-[#0c7474] hover:bg-[#e8f6f1]" aria-label={`Baixar ${document.title}`}><FileDown className="h-4 w-4" /></Button></div>) : <p className="rounded-xl bg-[#f8fbfa] p-4 text-sm leading-6 text-[#668087]">Nenhum documento foi emitido nesta gestão. Gere o primeiro para iniciar o dossiê digital.</p>}</div></section></div>}
    </>}
  </ModulePage></DashboardLayout>;
}

import { useEffect, useMemo, useRef, useState } from "react";
import { GState, jsPDF } from "jspdf";
import {
  Award,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  Eye,
  FileDown,
  ImagePlus,
  Loader2,
  MapPin,
  RotateCcw,
  Printer,
  ShieldCheck,
  Sparkles,
  UserRound,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  certificateCatalog,
  certificateDescription,
  certificateNrs,
  type CertificateNr,
} from "@/lib/certificateCatalog";
import { certificateWatermarkVariants, getCertificateWatermarkTheme, getCertificateWatermarkVariant, type CertificateWatermarkVariantId } from "@/lib/certificateWatermark";
import { trpc } from "@/lib/trpc";

export type GeneratedCertificatePayload = {
  companyId: number | null;
  participantName: string;
  trainingName: string;
  issuedAt: Date;
  expiresAt: Date | null;
  referenceUrl: string | null;
  notes: string | null;
};

type CertificateGeneratorPanelProps = {
  workspaceId: number;
  workspaceName: string;
  companies?: Array<{
    id: number;
    name: string;
    logoUrl?: string | null;
    brandPrimaryColor?: string | null;
    brandBackgroundColor?: string | null;
  }>;
  canManage: boolean;
  isPersisting?: boolean;
  onPersist?: (payload: GeneratedCertificatePayload) => void;
};

type ProgramTemplate = {
  id: string;
  name: string;
  nr: CertificateNr;
  content: string;
  updatedAt: string;
};

type CertificatePdfResult = {
  registration: string;
  courseTitle: string;
  validityText: string;
  selectedCourse: (typeof certificateCatalog)[CertificateNr]["courses"][number];
  programItems: string[];
  pdfBlob: Blob;
  fileName: string;
};

type CertificatePreviewState = {
  url: string;
  fileName: string;
  result: CertificatePdfResult;
  form: FormState;
  expiresAt: Date | null;
};

type FormState = {
  companyId: number | null;
  participantName: string;
  cpf: string;
  company: string;
  nr: CertificateNr;
  course: string;
  validity: "12" | "24" | "36" | "Indeterminada";
  completionDate: string;
  location: string;
  instructor: string;
  instructorRegistration: string;
  phone: string;
  nr33Role: string;
  watermarkText: string;
  watermarkVariant: CertificateWatermarkVariantId;
  watermarkOpacity: number;
  customWatermarkDataUrl: string | null;
  backgroundColor: string;
  accentColor: string;
  watermarkEnabled: boolean;
  programContent: string;
  signatureEnabled: boolean;
  saveToArchive: boolean;
};

const TEMPLATE_STORAGE_KEY = "tst-brasil-hub:certificate-program-templates:v1";

function getStoredTemplates(): ProgramTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(TEMPLATE_STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter(item => item && typeof item.id === "string" && typeof item.content === "string") : [];
  } catch {
    return [];
  }
}

function getDefaultProgramContent(nr: CertificateNr, templates = getStoredTemplates()) {
  return templates.find(template => template.nr === nr)?.content ?? certificateCatalog[nr].content.join("\n");
}

const initialForm = (companies: Array<{ id: number; name: string }> = []): FormState => ({
  companyId: companies.length === 1 ? companies[0].id : null,
  participantName: "",
  cpf: "",
  company: companies.length === 1 ? companies[0].name : "",
  nr: "NR-35",
  course: certificateCatalog["NR-35"].courses[0].name,
  validity: "24",
    completionDate: new Date().toISOString().slice(0, 10),
  location: "",
  instructor: "",
  instructorRegistration: "",

  phone: "",
  nr33Role: "Supervisor de entrada",
  watermarkText: getCertificateWatermarkTheme("NR-35").label,
  watermarkVariant: "photographic",
  watermarkOpacity: 0.12,
  customWatermarkDataUrl: null,
  backgroundColor: "#f7f2e8",
  accentColor: "#2b9a90",
  watermarkEnabled: true,
  programContent: getDefaultProgramContent("NR-35"),
  signatureEnabled: true,
  saveToArchive: true,
});

function formatLongDate(isoDate: string) {
  if (!isoDate) return "Data não informada";
  const date = new Date(`${isoDate}T12:00:00`);
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

function formatShortDate(isoDate: string) {
  if (!isoDate) return "—";
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("pt-BR");
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return [247, 242, 232];
  return [Number.parseInt(normalized.slice(0, 2), 16), Number.parseInt(normalized.slice(2, 4), 16), Number.parseInt(normalized.slice(4, 6), 16)];
}

function addPageBackground(doc: jsPDF, backgroundColor: string) {
  const [red, green, blue] = hexToRgb(backgroundColor);
  doc.setFillColor(red, green, blue);
  doc.rect(0, 0, 297, 210, "F");
}

function addFrame(doc: jsPDF, primaryColor: string) {
  doc.setDrawColor(198, 171, 124);
  doc.setLineWidth(1.4);
  doc.rect(10, 10, 277, 190);
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(0.8);
  doc.rect(14, 14, 269, 182);
}

function addWatermarkArtwork(doc: jsPDF, nr: CertificateNr, color: string, opacity: number, enabled: boolean) {
  if (!enabled) return;
  const theme = getCertificateWatermarkTheme(nr);
  const artOpacity = Math.max(0.035, Math.min(opacity * 0.9, 0.24));
  doc.setGState(new GState({ opacity: artOpacity }));
  doc.setDrawColor(color);
  doc.setLineWidth(1.1);
  doc.setLineCap("round");
  doc.setLineJoin("round");

  if (theme.kind === "electricity") {
    doc.lines([[34, -48], [22, 0], [-6, 47], [10, 0], [-18, 59], [42, -74], [-13, 0]], 220, 63);
    doc.line(40, 54, 73, 54);
    doc.line(40, 157, 76, 157);
    doc.circle(28, 54, 4);
    doc.circle(28, 157, 4);
    doc.circle(83, 54, 2.2);
    doc.circle(83, 157, 2.2);
  } else if (theme.kind === "height") {
    doc.line(34, 170, 263, 170);
    doc.lines([[48, -86], [24, 35], [23, -49], [56, 100]], 54, 170);
    doc.ellipse(214, 83, 42, 29);
    doc.circle(214, 83, 3.5);
    doc.line(214, 87, 214, 123);
    doc.line(214, 98, 198, 116);
    doc.line(214, 98, 234, 109);
  } else if (theme.kind === "confined") {
    doc.ellipse(148.5, 105, 83, 58);
    doc.ellipse(148.5, 105, 54, 39);
    doc.ellipse(148.5, 105, 27, 20);
    doc.circle(148.5, 105, 6);
    doc.line(148.5, 44, 148.5, 27);
    doc.line(148.5, 183, 148.5, 166);
    doc.line(65.5, 105, 48, 105);
    doc.line(249.5, 105, 232, 105);
  } else if (theme.kind === "noise") {
    doc.lines([[17, -20], [17, 20], [17, -20], [17, 20], [17, -20], [17, 20], [17, -20], [17, 20]], 76, 104);
    doc.lines([[14, -14], [14, 14], [14, -14], [14, 14], [14, -14], [14, 14], [14, -14], [14, 14]], 93, 137);
    doc.circle(148.5, 105, 52);
  } else if (theme.kind === "fire") {
    doc.lines([[0, -28], [15, -22], [19, -43], [34, 14], [23, -13], [35, 39], [-30, 30], [-42, -5], [-28, -43], [-15, 12], [-11, -30]], 148.5, 151);
    doc.lines([[0, -9], [8, -13], [11, -20], [19, 10], [-10, 19], [-19, 7], [-9, -18], [-8, 5]], 148.5, 141);
  } else {
    doc.circle(105, 81, 24);
    doc.circle(192, 81, 24);
    doc.lines([[0, 24], [0, 38]], 105, 105);
    doc.lines([[0, 24], [0, 38]], 192, 105);
    doc.line(148.5, 49, 148.5, 133);
    doc.line(119, 91, 178, 91);
  }

  doc.setGState(new GState({ opacity: 1 }));
}

function addWatermark(doc: jsPDF, nr: CertificateNr, _text: string, opacity: number, enabled: boolean, imageDataUrl: string | null, variantId: CertificateWatermarkVariantId) {
  if (!enabled || !imageDataUrl) return;
  const theme = getCertificateWatermarkTheme(nr);
  const variant = getCertificateWatermarkVariant(variantId);
  const intensity = Math.max(0.45, Math.min(opacity / 0.12, 1.7));
  const imageOpacity = Math.max(0.025, Math.min(variant.imageOpacity * intensity, 0.22));
  const format = imageFormat(imageDataUrl);

  if (variant.id === "photographic") {
    doc.setGState(new GState({ opacity: imageOpacity }));
    doc.addImage(imageDataUrl, format, 18, 18, 261, 174, undefined, "FAST");
  } else if (variant.id === "technical") {
    doc.setGState(new GState({ opacity: imageOpacity }));
    doc.addImage(imageDataUrl, format, 186, 18, 93, 174, undefined, "FAST");
    doc.setGState(new GState({ opacity: Math.min(variant.overlayOpacity * intensity, 0.16) }));
    doc.setFillColor(theme.color);
    doc.rect(186, 18, 93, 174, "F");
    doc.setDrawColor(theme.color);
    doc.setLineWidth(0.45);
    for (let x = 194; x < 279; x += 12) doc.line(x, 18, x, 192);
    for (let y = 28; y < 192; y += 12) doc.line(186, y, 279, y);
  } else if (variant.id === "contour") {
    doc.setGState(new GState({ opacity: imageOpacity }));
    doc.addImage(imageDataUrl, format, 57, 30, 183, 135, undefined, "FAST");
    doc.setGState(new GState({ opacity: Math.min(variant.overlayOpacity * intensity + 0.04, 0.14) }));
    doc.setDrawColor(theme.color);
    doc.setLineWidth(0.75);
    doc.rect(52, 25, 193, 145);
    doc.setLineWidth(0.35);
    doc.rect(59, 32, 179, 131);
    doc.line(52, 97.5, 245, 97.5);
    doc.line(148.5, 25, 148.5, 170);
  } else {
    doc.setGState(new GState({ opacity: imageOpacity }));
    doc.addImage(imageDataUrl, format, 105, 62, 87, 60, undefined, "FAST");
    doc.setGState(new GState({ opacity: Math.min(variant.overlayOpacity * intensity + 0.035, 0.1) }));
    doc.setDrawColor(theme.color);
    doc.setLineWidth(0.6);
    doc.ellipse(148.5, 92, 48, 34);
    doc.line(84, 92, 213, 92);
  }
  doc.setGState(new GState({ opacity: 1 }));
}

function imageFormat(dataUrl: string) {
  return dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg") ? "JPEG" : "PNG";
}

async function fetchImageAsDataUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Não foi possível carregar a imagem temática (${response.status}).`);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Imagem temática inválida."));
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler a imagem temática."));
    reader.readAsDataURL(blob);
  });
}

function buildPracticalContent(nr: CertificateNr) {
  if (nr === "NR-05") return ["Levantamento orientado dos riscos do ambiente de trabalho", "Dinâmica de reunião, registro em ata e encaminhamento de medidas preventivas"];
  if (nr === "NR-35") return ["Procedimentos para realização de trabalhos em altura", "Simulação de uso dos EPIs e EPCs"];
  if (nr === "NR-10") return ["Simulação de desenergização e aterramento", "Práticas de primeiros socorros e resgate"];
  if (nr === "NR-33") return ["Simulação de entrada em espaço confinado", "Uso de equipamentos de detecção de gases e resgate"];
  if (nr === "NR-20") return ["Uso de sistemas de segurança contra incêndio", "Simulação de controle de vazamentos"];
  return ["Medições práticas com decibelímetro", "Avaliação de cenários de exposição"];
}

async function generateCertificatePdf(form: FormState, logoDataUrl: string | null, signatureDataUrl: string | null, watermarkImageDataUrl: string | null) {
  const definition = certificateCatalog[form.nr];
  const selectedCourse = definition.courses.find(course => course.name === form.course) ?? definition.courses[0];
  const primaryColor = form.accentColor || definition.colors[0];
  const secondaryColor = definition.colors[1];
  const registration = `${form.nr.replace("-", "")}-${Date.now().toString().slice(-8)}`;
  const programItems = form.programContent.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
  const validityText = form.validity === "Indeterminada" ? "Indeterminada" : `${form.validity} meses`;
  const courseTitle = form.nr === "NR-33" && form.nr33Role ? `${form.nr33Role} — ${form.course}` : form.course;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  addPageBackground(doc, form.backgroundColor);
  addWatermark(doc, form.nr, form.watermarkText, form.watermarkOpacity, form.watermarkEnabled, watermarkImageDataUrl, form.watermarkVariant);
  addFrame(doc, primaryColor);

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, imageFormat(logoDataUrl), 20, 18, 42, 30, undefined, "FAST");
    } catch {
      // A logo is optional; the certificate remains valid if an unsupported image is supplied.
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(34);
  doc.setTextColor(primaryColor);
  doc.text("CERTIFICADO", 148.5, 46, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(76, 92, 92);
  doc.text(definition.title, 148.5, 56, { align: "center" });
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(0.5);
  doc.line(58, 63, 239, 63);

  let y = 78;
  doc.setFontSize(10.5);
  doc.text(form.company.trim() || "Instituição responsável pela capacitação", 148.5, y, { align: "center" });
  y += 6;
  doc.text("Documento emitido pelo ambiente profissional TST Brasil Hub", 148.5, y, { align: "center" });
  y += 12;
  doc.text("Certificamos que", 148.5, y, { align: "center" });
  y += 11;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(primaryColor);
  doc.text(form.participantName.trim().toUpperCase(), 148.5, y, { align: "center" });
  y += 11;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(45, 59, 59);
  doc.text(`CPF: ${form.cpf.trim()}`, 148.5, y, { align: "center" });
  y += 10;
  doc.text("concluiu com aproveitamento satisfatório o curso de:", 148.5, y, { align: "center" });
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(primaryColor);
  const courseLines = doc.splitTextToSize(courseTitle, 190);
  doc.text(courseLines, 148.5, y, { align: "center" });
  y += courseLines.length * 7 + 2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(45, 59, 59);
  doc.text(certificateDescription(form.nr, selectedCourse.workload), 148.5, y, { align: "center" });
  y += 9;
  doc.text(`Em conformidade com a ${form.nr} da Lei 6.514/77`, 148.5, y, { align: "center" });
  y += 9;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor);
  doc.text(`Validade: ${validityText}`, 148.5, y, { align: "center" });
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(45, 59, 59);
  doc.text(`Local: ${form.location.trim() || "Não informado"}   Conclusão: ${formatLongDate(form.completionDate)}`, 148.5, y, { align: "center" });

  const signatureY = 174;
  if (signatureDataUrl && form.signatureEnabled) {
    try {
      doc.addImage(signatureDataUrl, imageFormat(signatureDataUrl), 181, 145, 76, 25, undefined, "FAST");
    } catch {
      // A assinatura é opcional; o certificado continua válido sem a imagem.
    }
  }
  doc.setDrawColor(112, 125, 122);
  doc.setLineWidth(0.3);
  doc.line(40, signatureY, 118, signatureY);
  doc.line(179, signatureY, 257, signatureY);
  doc.setFontSize(9);
  doc.text("Assinatura do participante", 79, signatureY + 7, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.text((form.instructor.trim() || "Instrutor responsável").toUpperCase(), 218, signatureY + 7, { align: "center" });
  doc.setFont("helvetica", "normal");
  if (form.instructorRegistration.trim()) doc.text(form.instructorRegistration.trim(), 218, signatureY + 12, { align: "center" });
  doc.setFontSize(7.5);
  doc.setTextColor(135, 148, 145);
  doc.text(`Registro: ${registration}`, 277, 194, { align: "right" });

  doc.addPage();
  addPageBackground(doc, form.backgroundColor);
  addWatermark(doc, form.nr, form.watermarkText, form.watermarkOpacity, form.watermarkEnabled, watermarkImageDataUrl, form.watermarkVariant);
  addFrame(doc, primaryColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(primaryColor);
  doc.text("Conteúdo programático", 148.5, 36, { align: "center" });
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(0.5);
  doc.line(58, 43, 239, 43);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(45, 59, 59);
  let contentY = 56;
  programItems.forEach((item, index) => {
    const lines = doc.splitTextToSize(`${String(index + 1).padStart(2, "0")}. ${item}`, 236);
    doc.text(lines, 30, contentY);
    contentY += lines.length * 5.5 + 2.5;
  });
  contentY += 4;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor);
  doc.text("Conteúdo prático integrado à carga horária", 30, contentY);
  contentY += 7;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(45, 59, 59);
  buildPracticalContent(form.nr).forEach(item => {
    doc.text(`• ${item}`, 35, contentY);
    contentY += 5.5;
  });
  if (form.phone.trim()) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(primaryColor);
    doc.text(`Contato: ${form.phone.trim()}`, 30, 190);
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(135, 148, 145);
  doc.text(`Registro: ${registration}`, 277, 194, { align: "right" });

  const safeName = form.participantName.trim().replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "participante";
  const fileName = `Certificado_${form.nr}_${safeName}.pdf`;
  return {
    registration,
    courseTitle,
    validityText,
    selectedCourse,
    programItems,
    pdfBlob: doc.output("blob"),
    fileName,
  };
}

function downloadCertificateBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function CertificateGeneratorPanel({ workspaceId, workspaceName, companies = [], canManage, isPersisting = false, onPersist }: CertificateGeneratorPanelProps) {
  const [form, setForm] = useState<FormState>(() => initialForm(companies));
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [logoDirty, setLogoDirty] = useState(false);
  const [templates, setTemplates] = useState<ProgramTemplate[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [previewSide, setPreviewSide] = useState<"front" | "back">("front");
  const utils = trpc.useUtils();
  const updateCompanyBranding = trpc.portal.updateCompanyBranding.useMutation({
    onSuccess: () => {
      toast.success("Identidade visual salva para as próximas emissões desta empresa.");
      utils.portal.workspace.invalidate({ workspaceId });
    },
    onError: error => toast.error(error.message),
  });
  const [certificatePreview, setCertificatePreview] = useState<CertificatePreviewState | null>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const customWatermarkInputRef = useRef<HTMLInputElement>(null);
  const definition = certificateCatalog[form.nr];
  const selectedCourse = definition.courses.find(course => course.name === form.course) ?? definition.courses[0];
  const selectedCompany = companies.find(company => company.id === form.companyId) ?? null;
  const programItems = form.programContent.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
  const watermarkTheme = getCertificateWatermarkTheme(form.nr);
  const watermarkAssetUrl = watermarkTheme.assetUrl;
  const watermarkVariant = getCertificateWatermarkVariant(form.watermarkVariant);
  const renderWatermarkPreview = () => {
    if (!form.watermarkEnabled) return null;
    const activeAssetUrl = form.customWatermarkDataUrl ? form.customWatermarkDataUrl : watermarkAssetUrl;
    const common = { src: activeAssetUrl, alt: "", "aria-hidden": true } as const;
    if (watermarkVariant.id === "technical") return <><img {...common} className="pointer-events-none absolute right-0 top-0 h-full w-[39%] object-cover opacity-75" /><span aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-full w-[39%] opacity-35" style={{ backgroundImage: `linear-gradient(${watermarkTheme.color} 1px, transparent 1px), linear-gradient(90deg, ${watermarkTheme.color} 1px, transparent 1px)`, backgroundSize: "18px 18px" }} /></>;
    if (watermarkVariant.id === "contour") return <><img {...common} className="pointer-events-none absolute left-[19%] top-[19%] h-[62%] w-[62%] rounded-[1rem] object-cover opacity-55" /><span aria-hidden="true" className="pointer-events-none absolute inset-[16%] rounded-[1rem] border-2 opacity-45" style={{ borderColor: watermarkTheme.color }} /><span aria-hidden="true" className="pointer-events-none absolute left-[16%] right-[16%] top-1/2 h-px opacity-45" style={{ backgroundColor: watermarkTheme.color }} /></>;
    if (watermarkVariant.id === "minimal") return <><img {...common} className="pointer-events-none absolute left-[33%] top-[31%] h-[29%] w-[34%] rounded-full object-cover opacity-45" /><span aria-hidden="true" className="pointer-events-none absolute left-[25%] top-[24%] h-[43%] w-[50%] rounded-full border opacity-40" style={{ borderColor: watermarkTheme.color }} /></>;
    return <img {...common} className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-75" />;
  };
  const expiresAt = useMemo(() => {
    if (form.validity === "Indeterminada" || !form.completionDate) return null;
    const date = new Date(`${form.completionDate}T12:00:00`);
    date.setMonth(date.getMonth() + Number(form.validity));
    return date;
  }, [form.completionDate, form.validity]);

  useEffect(() => {
    setTemplates(getStoredTemplates());
  }, []);

  useEffect(() => {
    let active = true;
    setForm(current => ({
      ...current,
      company: selectedCompany?.name ?? (current.companyId ? current.company : ""),
      accentColor: selectedCompany?.brandPrimaryColor ?? current.accentColor,
      backgroundColor: selectedCompany?.brandBackgroundColor ?? current.backgroundColor,
    }));
    if (!selectedCompany?.logoUrl) {
      setLogoDataUrl(null);
      return () => { active = false; };
    }
    fetchImageAsDataUrl(selectedCompany.logoUrl)
      .then(dataUrl => { if (active) setLogoDataUrl(dataUrl); })
      .catch(() => { if (active) setLogoDataUrl(null); });
    return () => { active = false; };
  }, [selectedCompany?.id, selectedCompany?.name, selectedCompany?.logoUrl, selectedCompany?.brandPrimaryColor, selectedCompany?.brandBackgroundColor]);

  useEffect(() => () => {
    if (certificatePreview?.url) URL.revokeObjectURL(certificatePreview.url);
  }, [certificatePreview?.url]);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => setForm(current => ({ ...current, [field]: value }));

  const saveProgramTemplate = () => {
    const name = templateName.trim() || `Modelo ${form.nr} · ${new Date().toLocaleDateString("pt-BR")}`;
    const template: ProgramTemplate = { id: `${form.nr}-${Date.now()}`, name, nr: form.nr, content: form.programContent, updatedAt: new Date().toISOString() };
    const nextTemplates = [template, ...templates.filter(item => item.id !== selectedTemplateId && !(item.nr === form.nr && item.name === name))];
    setTemplates(nextTemplates);
    setSelectedTemplateId(template.id);
    setTemplateName(template.name);
    try {
      window.localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(nextTemplates));
      toast.success("Modelo de conteúdo salvo para futuras emissões.");
    } catch {
      toast.error("Não foi possível salvar o modelo neste navegador.");
    }
  };

  const applyProgramTemplate = (id: string) => {
    const template = templates.find(item => item.id === id);
    if (!template) return;
    setSelectedTemplateId(template.id);
    setTemplateName(template.name);
    setField("programContent", template.content);
    toast.success(`Modelo aplicado: ${template.name}`);
  };

  const handleNrChange = (nr: CertificateNr) => {
    const nextDefinition = certificateCatalog[nr];
    setForm(current => ({
      ...current,
      nr,
      course: nextDefinition.courses[0].name,
      validity: nextDefinition.defaultValidityMonths,
      programContent: getDefaultProgramContent(nr, templates),
      nr33Role: nr === "NR-33" ? current.nr33Role : "",
    }));
  };

  const handleLogo = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida para o logo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = event => {
      setLogoDataUrl(typeof event.target?.result === "string" ? event.target.result : null);
      setLogoDirty(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSignature = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida para a assinatura digital.");
      return;
    }
    const reader = new FileReader();
    reader.onload = event => setSignatureDataUrl(typeof event.target?.result === "string" ? event.target.result : null);
    reader.readAsDataURL(file);
  };

  const handleCustomWatermark = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida para a marca d’água personalizada.");
      return;
    }
    const reader = new FileReader();
    reader.onload = event => {
      setField("customWatermarkDataUrl", typeof event.target?.result === "string" ? event.target.result : null);
      toast.success("Imagem de marca d'água personalizada aplicada.");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBranding = () => {
    if (!form.companyId) {
      toast.error("Selecione uma empresa para salvar a identidade visual.");
      return;
    }
    updateCompanyBranding.mutate({
      workspaceId,
      companyId: form.companyId,
      brandPrimaryColor: form.accentColor,
      brandBackgroundColor: form.backgroundColor,
      ...(logoDirty ? { logoDataUrl } : {}),
    });
  };

  const reset = () => {
    setForm(initialForm(companies));
    setLogoDataUrl(null);
    setLogoDirty(false);
    setSignatureDataUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (signatureInputRef.current) signatureInputRef.current.value = "";
  };

  const validateForm = () => {
    if (!form.participantName.trim()) return "Informe o nome do participante.";
    if (!form.cpf.trim()) return "Informe o CPF do participante.";
    if (!form.instructor.trim()) return "Informe o instrutor ou responsável técnico.";
    if (!form.programContent.split(/\r?\n/).some(item => item.trim())) return "Mantenha ao menos um tópico no conteúdo programático.";
    return null;
  };

  const persistCertificate = (snapshot: FormState, result: CertificatePdfResult, snapshotExpiresAt: Date | null) => {
    if (!snapshot.saveToArchive || !onPersist) return;
    onPersist({
      companyId: snapshot.companyId,
      participantName: snapshot.participantName.trim(),
      trainingName: `${snapshot.nr} · ${result.courseTitle}`,
      issuedAt: new Date(`${snapshot.completionDate}T12:00:00`),
      expiresAt: snapshotExpiresAt,
      referenceUrl: null,
      notes: [
        snapshot.company.trim() ? `Empresa: ${snapshot.company.trim()}` : null,
        `CPF: ${snapshot.cpf.trim()}`,
        snapshot.location.trim() ? `Local: ${snapshot.location.trim()}` : null,
        snapshot.instructor.trim() ? `Instrutor: ${snapshot.instructor.trim()}` : null,
        snapshot.instructorRegistration.trim() ? `Registro: ${snapshot.instructorRegistration.trim()}` : null,
        `Carga horária: ${result.selectedCourse.workload}`,
        `Conteúdo programático: ${result.programItems.join(" | ")}`,
        `Registro do certificado: ${result.registration}`,
      ].filter(Boolean).join(" · "),
    });
  };

  const handlePreview = async () => {
    const validationError = validateForm();
    if (validationError) return toast.error(validationError);
    setIsGenerating(true);
    try {
      const snapshot = { ...form };
      const snapshotExpiresAt = expiresAt;
      const watermarkImageDataUrl = form.customWatermarkDataUrl ? form.customWatermarkDataUrl : await fetchImageAsDataUrl(watermarkAssetUrl);
      const result = await generateCertificatePdf(snapshot, logoDataUrl, signatureDataUrl, watermarkImageDataUrl);
      const url = URL.createObjectURL(result.pdfBlob);
      setCertificatePreview({ url, fileName: result.fileName, result, form: snapshot, expiresAt: snapshotExpiresAt });
      setPreviewScale(1);
      toast.success("Prévia do certificado pronta para conferência.");
    } catch (error) {
      console.error("[CertificateGenerator] Falha ao preparar prévia", error);
      toast.error("Não foi possível preparar a prévia. Revise os dados e tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPreview = () => {
    if (!certificatePreview) return;
    downloadCertificateBlob(certificatePreview.result.pdfBlob, certificatePreview.fileName);
    persistCertificate(certificatePreview.form, certificatePreview.result, certificatePreview.expiresAt);
    setCertificatePreview(null);
    toast.success(certificatePreview.form.saveToArchive ? "PDF baixado e certificado adicionado ao acervo." : "PDF frente e verso baixado com sucesso.");
  };

  const handlePrintPreview = () => {
    if (!certificatePreview) return;
    const printFrame = document.createElement("iframe");
    printFrame.title = "Impressão do certificado";
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "1px";
    printFrame.style.height = "1px";
    printFrame.style.border = "0";
    printFrame.style.opacity = "0.01";
    printFrame.src = certificatePreview.url;
    printFrame.onload = () => {
      window.setTimeout(() => {
        try {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
        } finally {
          window.setTimeout(() => printFrame.remove(), 1500);
        }
      }, 350);
    };
    document.body.appendChild(printFrame);
    toast.success("A janela de impressão foi preparada.");
  };

  return (
    <section className="overflow-hidden rounded-[2rem] border border-[#cfe7df] bg-[#f7fcfa] shadow-[0_18px_55px_rgba(14,86,82,.10)]" aria-label="Gerador de certificados">
      <div className="relative overflow-hidden bg-[linear-gradient(120deg,#063b43_0%,#0c7474_55%,#1d9b98_100%)] px-6 py-7 text-white lg:px-8">
        <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-[#9ce8cb]/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-[#b8f0da]"><Sparkles className="h-4 w-4" /><span className="text-[11px] font-bold uppercase tracking-[.18em]">Ferramenta integrada · TST Brasil Hub</span></div>
            <h3 className="mt-3 font-display text-2xl font-bold tracking-tight lg:text-3xl">Gere certificados NR com acabamento profissional.</h3>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#d4f1e8]">Emita um PDF frente e verso com conteúdo programático, identidade da empresa e registro organizado no ambiente ativo.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md"><ShieldCheck className="h-5 w-5 text-[#a9efd1]" /><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#a9efd1]">Ambiente ativo</p><p className="mt-1 max-w-[190px] truncate text-sm font-bold">{workspaceName}</p></div></div>
        </div>
      </div>
      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)] lg:p-7">
        <div className="space-y-5">
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#0c8c89]">Dados do certificado</p><h4 className="mt-1 font-display text-xl font-bold text-[#102b32]">Preencha a emissão</h4></div><span className="rounded-full bg-[#e6f6f0] px-3 py-1 text-xs font-bold text-[#0c7474]">PDF A4 · frente e verso</span></div>
          <div className="grid gap-4 rounded-2xl border border-[#dcebe8] bg-white p-5 shadow-sm sm:grid-cols-2">
            <label className="text-xs font-bold text-[#315158] sm:col-span-2">Nome do participante <span className="text-[#c85e55]">*</span><div className="relative mt-2"><UserRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#81a49e]" /><Input value={form.participantName} onChange={event => setField("participantName", event.target.value)} className="h-11 rounded-xl border-[#d5e8e2] pl-10" placeholder="Nome completo" /></div></label>
            <label className="text-xs font-bold text-[#315158]">CPF <span className="text-[#c85e55]">*</span><Input value={form.cpf} onChange={event => setField("cpf", event.target.value)} className="mt-2 h-11 rounded-xl border-[#d5e8e2]" placeholder="000.000.000-00" /></label>
            {companies.length > 0 && <label className="text-xs font-bold text-[#315158]">Vincular ao cliente <span className="font-normal text-[#78928d]">(opcional)</span><select value={form.companyId ?? ""} onChange={event => { const companyId = Number(event.target.value); const company = companies.find(item => item.id === companyId); setForm(current => ({ ...current, companyId: companyId > 0 ? companyId : null, company: company?.name ?? (companyId > 0 ? current.company : "") })); }} className="mt-2 h-11 w-full rounded-xl border border-[#d5e8e2] bg-white px-3 text-sm font-medium text-[#315158] outline-none focus:border-[#0c8c89]"><option value="">Sem vínculo com cliente</option>{companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>}
            <label className="text-xs font-bold text-[#315158]">Empresa / organização<Input value={form.company} onChange={event => setField("company", event.target.value)} className="mt-2 h-11 rounded-xl border-[#d5e8e2]" placeholder="Nome da empresa" /></label>
            <label className="text-xs font-bold text-[#315158]">Norma Regulamentadora<select value={form.nr} onChange={event => handleNrChange(event.target.value as CertificateNr)} className="mt-2 h-11 w-full rounded-xl border border-[#d5e8e2] bg-white px-3 text-sm font-medium text-[#315158] outline-none transition focus:border-[#0c8c89] focus:ring-4 focus:ring-[#0c8c89]/10">{certificateNrs.map(nr => <option key={nr} value={nr}>{nr} · {certificateCatalog[nr].title}</option>)}</select></label>
            <label className="text-xs font-bold text-[#315158]">Curso / capacitação<select value={form.course} onChange={event => setField("course", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#d5e8e2] bg-white px-3 text-sm font-medium text-[#315158] outline-none transition focus:border-[#0c8c89] focus:ring-4 focus:ring-[#0c8c89]/10">{definition.courses.map(course => <option key={course.name} value={course.name}>{course.name} · {course.workload}</option>)}</select></label>
            <label className="text-xs font-bold text-[#315158] sm:col-span-2">Conteúdo programático mínimo sugerido <span className="text-[#c85e55]">*</span><span className="mt-1 block text-xs font-normal leading-5 text-[#78928d]">A lista é preenchida com a base recomendada da norma. Edite os tópicos e acrescente linhas conforme a carga horária e o conteúdo efetivamente ministrado.</span><textarea aria-label="Conteúdo programático editável" value={form.programContent} onChange={event => setField("programContent", event.target.value)} rows={8} className="mt-2 w-full resize-y rounded-xl border border-[#d5e8e2] bg-white px-3 py-3 text-sm font-medium leading-6 text-[#315158] outline-none transition placeholder:text-[#9ab4ae] focus:border-[#0c8c89] focus:ring-4 focus:ring-[#0c8c89]/10" /></label>
            <div className="sm:col-span-2 rounded-2xl border border-[#dcebe8] bg-[#f7fcfa] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold text-[#315158]">Modelos de conteúdo</p><p className="mt-1 text-xs leading-5 text-[#78928d]">Salve a versão editada como modelo padrão desta norma para reaproveitar em futuras emissões neste navegador.</p></div><Button type="button" variant="outline" onClick={saveProgramTemplate} className="h-10 rounded-xl border-[#b9dcd2] text-[#0c7474]">Salvar modelo</Button></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><Input value={templateName} onChange={event => setTemplateName(event.target.value)} className="h-10 rounded-xl border-[#d5e8e2] bg-white" placeholder={`Nome do modelo ${form.nr}`} /><select aria-label="Aplicar modelo de conteúdo" value={selectedTemplateId} onChange={event => applyProgramTemplate(event.target.value)} className="h-10 w-full rounded-xl border border-[#d5e8e2] bg-white px-3 text-sm font-medium text-[#315158] outline-none focus:border-[#0c8c89]"><option value="">Aplicar modelo salvo…</option>{templates.filter(item => item.nr === form.nr).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div></div>
            {form.nr === "NR-33" && <label className="text-xs font-bold text-[#315158] sm:col-span-2">Função no espaço confinado<select value={form.nr33Role} onChange={event => setField("nr33Role", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#d5e8e2] bg-white px-3 text-sm font-medium text-[#315158] outline-none focus:border-[#0c8c89]">{["Supervisor de entrada", "Vigia", "Trabalhador autorizado", "Equipe de emergência e salvamento"].map(role => <option key={role}>{role}</option>)}</select></label>}
            <label className="text-xs font-bold text-[#315158]">Validade<select value={form.validity} onChange={event => setField("validity", event.target.value as FormState["validity"])} className="mt-2 h-11 w-full rounded-xl border border-[#d5e8e2] bg-white px-3 text-sm font-medium text-[#315158] outline-none focus:border-[#0c8c89]"><option value="12">12 meses</option><option value="24">24 meses</option><option value="36">36 meses</option><option value="Indeterminada">Indeterminada</option></select></label>
            <label className="text-xs font-bold text-[#315158]">Data de conclusão<Input type="date" value={form.completionDate} onChange={event => setField("completionDate", event.target.value)} className="mt-2 h-11 rounded-xl border-[#d5e8e2]" /></label>
            <label className="text-xs font-bold text-[#315158]">Local do curso<div className="relative mt-2"><MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#81a49e]" /><Input value={form.location} onChange={event => setField("location", event.target.value)} className="h-11 rounded-xl border-[#d5e8e2] pl-10" placeholder="Cidade / unidade" /></div></label>
            <label className="text-xs font-bold text-[#315158]">Instrutor / responsável <span className="text-[#c85e55">*</span><Input value={form.instructor} onChange={event => setField("instructor", event.target.value)} className="mt-2 h-11 rounded-xl border-[#d5e8e2]" placeholder="Nome do responsável" /></label>
            <label className="text-xs font-bold text-[#315158] sm:col-span-2">Registro profissional do instrutor<Input value={form.instructorRegistration} onChange={event => setField("instructorRegistration", event.target.value)} className="mt-2 h-11 rounded-xl border-[#d5e8e2]" placeholder="CREA, CRT ou outro registro" /></label>
            <label className="text-xs font-bold text-[#315158]">Telefone de contato<Input value={form.phone} onChange={event => setField("phone", event.target.value)} className="mt-2 h-11 rounded-xl border-[#d5e8e2]" placeholder="(00) 00000-0000" /></label>
            <div className="flex items-end"><div className="flex w-full items-center gap-3 rounded-xl border border-dashed border-[#b9dcd2] bg-[#f4fbf8] px-3 py-2.5 text-xs text-[#58736f]"><CalendarDays className="h-4 w-4 shrink-0 text-[#0c8c89]" /><span>Validade calculada: <strong className="text-[#315158]">{expiresAt ? expiresAt.toLocaleDateString("pt-BR") : "indeterminada"}</strong></span></div></div>
          </div>
          <div className="grid gap-4 rounded-2xl border border-[#dcebe8] bg-white p-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="text-xs font-bold text-[#315158]">Logo da instituição</p><p className="mt-1 text-xs leading-5 text-[#78928d]">O logo pode ser salvo na empresa vinculada e reaplicado automaticamente nas próximas emissões.</p></div><div className="flex items-center gap-3"><div className="grid h-14 w-14 place-items-center overflow-hidden rounded-xl border border-[#d5e8e2] bg-[#f7fcfa]">{logoDataUrl ? <img src={logoDataUrl} alt="Prévia do logo" className="h-full w-full object-contain" /> : <ImagePlus className="h-5 w-5 text-[#8eada7]" />}</div><input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={event => handleLogo(event.target.files?.[0])} className="max-w-[190px] text-xs text-[#58736f] file:mr-2 file:rounded-lg file:border-0 file:bg-[#e6f6f0] file:px-3 file:py-2 file:text-xs file:font-bold file:text-[#0c7474]" />{logoDataUrl && <button type="button" onClick={() => { setLogoDataUrl(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="text-xs font-bold text-[#b85c36] hover:underline">Remover</button>}</div></div>
          <div className="grid gap-4 rounded-2xl border border-[#dcebe8] bg-white p-5 sm:grid-cols-2"><div className="sm:col-span-2"><p className="text-xs font-bold text-[#315158]">Assinatura digital do instrutor</p><p className="mt-1 text-xs leading-5 text-[#78928d]">Envie uma imagem PNG/JPG com fundo transparente ou branco. Ela aparecerá automaticamente acima da assinatura do responsável na frente do certificado e na prévia.</p><div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center"><div className="grid h-16 w-44 place-items-center overflow-hidden rounded-xl border border-dashed border-[#b9dcd2] bg-white">{signatureDataUrl ? <img src={signatureDataUrl} alt="Prévia da assinatura digital" className="h-full w-full object-contain" /> : <span className="px-3 text-center text-[10px] text-[#78928d]">Sem assinatura carregada</span>}</div><div className="flex flex-wrap items-center gap-3"><input ref={signatureInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={event => handleSignature(event.target.files?.[0])} className="max-w-[210px] text-xs text-[#58736f] file:mr-2 file:rounded-lg file:border-0 file:bg-[#e6f6f0] file:px-3 file:py-2 file:text-xs file:font-bold file:text-[#0c7474]" />{signatureDataUrl && <button type="button" onClick={() => { setSignatureDataUrl(null); if (signatureInputRef.current) signatureInputRef.current.value = ""; }} className="text-xs font-bold text-[#b85c36] hover:underline">Remover</button>}<label className="flex items-center gap-2 text-xs font-bold text-[#315158]"><input type="checkbox" checked={form.signatureEnabled} onChange={event => setField("signatureEnabled", event.target.checked)} className="h-4 w-4 accent-[#0c8c89]" />Aplicar na frente</label></div></div></div><div className="sm:col-span-2"><p className="text-xs font-bold text-[#315158]">Identidade visual da empresa</p><p className="mt-1 text-xs leading-5 text-[#78928d]">Escolha a cor de fundo e o tom de destaque usados no PDF e na prévia. O logo carregado acima é específico desta emissão.</p></div><label className="flex items-center justify-between gap-3 rounded-xl border border-[#e1efeb] bg-[#f7fcfa] px-3 py-2.5 text-xs font-bold text-[#315158]">Fundo do certificado<input aria-label="Cor de fundo do certificado" type="color" value={form.backgroundColor} onChange={event => setField("backgroundColor", event.target.value)} className="h-9 w-14 cursor-pointer rounded-lg border-0 bg-transparent p-0" /></label><label className="flex items-center justify-between gap-3 rounded-xl border border-[#e1efeb] bg-[#f7fcfa] px-3 py-2.5 text-xs font-bold text-[#315158]">Cor de destaque<input aria-label="Cor de destaque do certificado" type="color" value={form.accentColor} onChange={event => setField("accentColor", event.target.value)} className="h-9 w-14 cursor-pointer rounded-lg border-0 bg-transparent p-0" /></label><div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2"><p className="text-xs text-[#66827c]">Empresa selecionada: <strong className="text-[#315158]">{selectedCompany?.name ?? "nenhuma"}</strong></p><Button type="button" onClick={handleSaveBranding} disabled={!form.companyId || updateCompanyBranding.isPending || !canManage} variant="outline" className="h-10 rounded-xl border-[#b9dcd2] bg-white text-[#0c7474] hover:bg-[#eff9f4]">{updateCompanyBranding.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}Salvar identidade da empresa</Button></div></div>
          <div className="grid gap-4 rounded-2xl border border-[#dcebe8] bg-white p-5 sm:grid-cols-2"><div className="sm:col-span-2 flex items-center justify-between gap-4"><div><p className="text-xs font-bold text-[#315158]">Marca d’água temática e galeria</p><p className="mt-1 text-xs leading-5 text-[#78928d]">A imagem padrão usa o tema da NR (<strong className="text-[#0c7474]">{watermarkTheme.label}</strong>) ou a logo customizada enviada abaixo.</p></div><button type="button" role="switch" aria-checked={form.watermarkEnabled} onClick={() => setField("watermarkEnabled", !form.watermarkEnabled)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${form.watermarkEnabled ? "bg-[#0c8c89]" : "bg-[#c9d9d5]"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${form.watermarkEnabled ? "left-6" : "left-1"}`} /></button></div><div className="grid gap-3 sm:col-span-2 sm:grid-cols-2 lg:grid-cols-4">{certificateWatermarkVariants.map(variant => { const selected = form.watermarkVariant === variant.id; const activeAsset = form.customWatermarkDataUrl ? form.customWatermarkDataUrl : watermarkAssetUrl; return <button key={variant.id} type="button" aria-pressed={selected} onClick={() => setField("watermarkVariant", variant.id)} className={`group rounded-2xl border p-2 text-left transition ${selected ? "border-[#0c8c89] bg-[#eaf8f2] shadow-[0_10px_22px_rgba(12,140,137,.13)]" : "border-[#e1efeb] bg-[#fbfefd] hover:border-[#9bcfc0] hover:bg-[#f4fbf8]"}`}><span className="relative block h-20 overflow-hidden rounded-xl bg-[#dbe9e5]"><img src={activeAsset} alt="" aria-hidden="true" className={`h-full w-full object-cover transition ${variant.id === "technical" ? "object-right opacity-75" : variant.id === "contour" ? "mx-auto h-[78%] w-[78%] translate-y-[11%] rounded-lg opacity-60" : variant.id === "minimal" ? "mx-auto h-[52%] w-[52%] translate-y-[24%] rounded-full opacity-45" : "opacity-75"}`} />{variant.id === "technical" && <span aria-hidden="true" className="absolute inset-y-0 right-0 w-1/3 opacity-50" style={{ backgroundImage: `linear-gradient(${watermarkTheme.color} 1px, transparent 1px), linear-gradient(90deg, ${watermarkTheme.color} 1px, transparent 1px)`, backgroundSize: "12px 12px" }} />}{variant.id === "contour" && <span aria-hidden="true" className="absolute inset-[13%] rounded-lg border-2 opacity-50" style={{ borderColor: watermarkTheme.color }} />}{variant.id === "minimal" && <span aria-hidden="true" className="absolute inset-[20%] rounded-full border opacity-45" style={{ borderColor: watermarkTheme.color }} />}</span><span className="mt-2 block text-[11px] font-bold text-[#315158]">{variant.label}</span><span className="mt-1 block text-[10px] leading-4 text-[#78928d]">{variant.helper}</span></button>; })}</div><div className="sm:col-span-2 grid gap-4 rounded-xl border border-[#e1efeb] bg-[#f7fcfa] p-4 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="text-xs font-bold text-[#315158]">Enviar marca d’água personalizada da empresa</p><p className="mt-1 text-xs leading-5 text-[#78928d]">Opcional. Use uma logo ou brasão próprio como fundo do certificado. Caso removida, o sistema volta a usar a imagem temática da NR.</p></div><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl border border-[#d5e8e2] bg-white">{form.customWatermarkDataUrl ? <img src={form.customWatermarkDataUrl} alt="Prévia da marca d'água customizada" className="h-full w-full object-contain" /> : <ImagePlus className="h-5 w-5 text-[#8eada7]" />}</div><input ref={customWatermarkInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={event => handleCustomWatermark(event.target.files?.[0])} className="max-w-[190px] text-xs text-[#58736f] file:mr-2 file:rounded-lg file:border-0 file:bg-[#e6f6f0] file:px-3 file:py-2 file:text-xs file:font-bold file:text-[#0c7474]" />{form.customWatermarkDataUrl && <button type="button" onClick={() => { setField("customWatermarkDataUrl", null); if (customWatermarkInputRef.current) customWatermarkInputRef.current.value = ""; toast.success("Marca d'água personalizada removida. Usando tema padrão da NR."); }} className="text-xs font-bold text-[#b85c36] hover:underline">Restaurar NR</button>}</div></div><label className="text-xs font-bold text-[#315158] sm:col-span-2">Opacidade de impressão · {form.watermarkOpacity.toFixed(2)}<input disabled={!form.watermarkEnabled} type="range" min="0.05" max="0.2" step="0.01" value={form.watermarkOpacity} onChange={event => setField("watermarkOpacity", Number(event.target.value))} className="mt-4 w-full accent-[#0c8c89]" /></label></div>
          <div className="flex flex-col gap-3 rounded-2xl border border-[#d9ebe4] bg-[#eff9f4] p-4 text-sm text-[#315158] sm:flex-row sm:items-center sm:justify-between"><label className="flex items-center gap-3"><input type="checkbox" checked={form.saveToArchive} onChange={event => setField("saveToArchive", event.target.checked)} className="h-4 w-4 accent-[#0c8c89]" /><span><strong>Salvar também no acervo</strong><span className="mt-0.5 block text-xs text-[#66827c]">Registra o certificado no ambiente ativo após gerar o PDF.</span></span></label><span className="inline-flex items-center gap-1 text-xs font-bold text-[#0c7474]"><BadgeCheck className="h-4 w-4" />Sem dados fictícios</span></div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={reset} className="h-11 rounded-xl border-[#cfe3dd] text-[#496b67]"><RotateCcw className="mr-2 h-4 w-4" />Limpar formulário</Button><Button type="button" onClick={handlePreview} disabled={isGenerating || isPersisting || !canManage} className="h-11 rounded-xl bg-[#0c8c89] px-5 text-white shadow-[0_10px_24px_rgba(12,140,137,.22)] hover:bg-[#08706f] disabled:opacity-60">{isGenerating || isPersisting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}{isGenerating ? "Montando prévia..." : isPersisting ? "Salvando no acervo..." : "Visualizar prévia do PDF"}</Button></div>
          {!canManage && <p className="text-right text-xs text-[#b85c36]">Seu perfil tem acesso de leitura neste ambiente. Um owner ou manager pode emitir certificados.</p>}
        </div>
        <aside className="relative overflow-hidden rounded-[1.75rem] bg-[#063b43] p-5 text-white shadow-[0_18px_50px_rgba(6,59,67,.2)] lg:sticky lg:top-6 lg:h-fit"><div className="pointer-events-none absolute -right-12 top-10 h-40 w-40 rounded-full bg-[#9ce8cb]/10 blur-3xl" /><div className="relative"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#9ce8cb]">Prévia dinâmica</p><p className="mt-1 text-sm font-bold text-white">Frente do certificado</p></div><div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/10"><Award className="h-5 w-5 text-[#d9bd88]" /></div></div><div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-1"><button type="button" onClick={() => setPreviewSide("front")} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${previewSide === "front" ? "bg-white text-[#063b43]" : "text-[#d8f5e8] hover:bg-white/10"}`}>Frente</button><button type="button" onClick={() => setPreviewSide("back")} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${previewSide === "back" ? "bg-white text-[#063b43]" : "text-[#d8f5e8] hover:bg-white/10"}`}>Verso · conteúdo</button></div>{previewSide === "front" ? (<div className="relative mt-6 min-h-[430px] overflow-hidden rounded-[1.25rem] border bg-white p-5 text-center text-[#173f46] shadow-[0_18px_35px_rgba(0,0,0,.18)]" style={{ backgroundColor: form.backgroundColor, borderColor: form.accentColor }}>{renderWatermarkPreview()}<div className="pointer-events-none absolute inset-3 rounded-[.9rem] border border-[#d9bd88]/70" /><div className="pointer-events-none absolute inset-5 rounded-[.7rem] border border-[#2b9a90]/40" style={{ borderColor: form.accentColor }} />{logoDataUrl ? <img src={logoDataUrl} alt="Logo na prévia" className="relative mx-auto h-12 w-20 object-contain" /> : <div className="relative mx-auto grid h-12 w-20 place-items-center rounded-xl border border-dashed border-[#bfae89] text-[#a18e67]"><ImagePlus className="h-5 w-5" /></div>}<p className="relative mt-5 text-[9px] font-bold uppercase tracking-[.3em]" style={{ color: form.accentColor }}>{form.nr} · TST Brasil Hub</p><h5 className="relative mt-3 font-serif text-2xl font-bold tracking-wide text-[#1b4a50]">CERTIFICADO</h5><div className="relative mx-auto mt-2 h-px w-28 bg-[#bfae89]" /><p className="relative mt-7 text-[10px] text-[#68807f]">Certificamos que</p><p className="relative mt-2 min-h-7 px-3 font-serif text-lg font-bold uppercase" style={{ color: form.accentColor }}>{form.participantName || "Nome do participante"}</p><p className="relative mt-2 text-[9px] text-[#68807f]">concluiu com aproveitamento satisfatório</p><p className="relative mt-2 min-h-9 px-3 text-sm font-bold" style={{ color: form.accentColor }}>{form.course || "Curso de capacitação"}</p><div className="relative mt-5 grid grid-cols-2 gap-2 text-left text-[9px] text-[#68807f]"><div className="rounded-lg bg-white/60 p-2"><span className="block font-bold uppercase tracking-wider text-[#9a8660]">Conclusão</span>{formatShortDate(form.completionDate)}</div><div className="rounded-lg bg-white/60 p-2"><span className="block font-bold uppercase tracking-wider text-[#9a8660]">Validade</span>{expiresAt ? expiresAt.toLocaleDateString("pt-BR") : "Indeterminada"}</div></div>{signatureDataUrl && form.signatureEnabled && <img src={signatureDataUrl} alt="Assinatura digital do instrutor na prévia" className="relative mx-auto mt-5 h-10 w-44 object-contain" />}<div className="relative mt-10 grid grid-cols-2 gap-6 text-[8px] text-[#68807f]"><div className="border-t border-[#718585] pt-2">Participante</div><div className="border-t border-[#718585] pt-2">{form.instructor || "Responsável técnico"}</div></div></div>) : (<div className="relative mt-6 min-h-[430px] overflow-hidden rounded-[1.25rem] border bg-white p-5 text-[#173f46] shadow-[0_18px_35px_rgba(0,0,0,.18)]" style={{ backgroundColor: form.backgroundColor, borderColor: form.accentColor }}>{renderWatermarkPreview()}<div className="pointer-events-none absolute inset-3 rounded-[.9rem] border border-[#d9bd88]/70" /><div className="pointer-events-none absolute inset-5 rounded-[.7rem] border" style={{ borderColor: form.accentColor }} /><div className="relative flex items-center justify-between border-b border-[#dcebe8] pb-3"><div><p className="text-[9px] font-bold uppercase tracking-[.24em]" style={{ color: form.accentColor }}>{form.nr} · TST Brasil Hub</p><h5 className="mt-2 text-lg font-bold text-[#1b4a50]">Conteúdo programático</h5></div><div className="grid h-10 w-10 place-items-center rounded-xl border" style={{ borderColor: form.accentColor, color: form.accentColor }}><ShieldCheck className="h-5 w-5" /></div></div><div className="relative mt-4 max-h-[260px] overflow-y-auto pr-1 text-left">{programItems.length ? programItems.map((item, index) => <div key={`${item}-${index}`} className="flex gap-2 border-b border-[#e6efec] py-2 text-[10px] leading-4 text-[#4f6a68]"><span className="font-bold" style={{ color: form.accentColor }}>{String(index + 1).padStart(2, "0")}</span><span>{item}</span></div>) : <p className="rounded-lg border border-dashed border-[#cfe3dd] p-3 text-xs text-[#78928d]">Adicione ao menos um tópico no campo de conteúdo programático.</p>}</div><div className="relative mt-4 rounded-xl bg-white/70 p-3 text-left text-[10px] leading-4 text-[#58736f]"><p className="font-bold uppercase tracking-wider" style={{ color: form.accentColor }}>Conteúdo prático sugerido</p>{buildPracticalContent(form.nr).map(item => <p key={item} className="mt-1">• {item}</p>)}</div><div className="relative mt-4 flex items-center gap-2 rounded-xl border border-dashed p-3 text-[10px] text-[#58736f]" style={{ borderColor: form.accentColor }}><ShieldCheck className="h-5 w-5 shrink-0" style={{ color: form.accentColor }} /><span>O verso apresenta o conteúdo programático completo da capacitação.</span></div></div>)}<div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3"><div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-[9px] font-bold uppercase tracking-wider text-[#9ce8cb]">Conteúdo</p><p className="mt-1 text-xs font-bold">{programItems.length} módulos</p></div><div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-[9px] font-bold uppercase tracking-wider text-[#9ce8cb]">Carga</p><p className="mt-1 text-xs font-bold">{selectedCourse.workload}</p></div><div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-[9px] font-bold uppercase tracking-wider text-[#9ce8cb]">Verso</p><p className="mt-1 text-xs font-bold">Programático</p></div></div><div className="mt-5 flex items-start gap-2 rounded-xl border border-[#9ce8cb]/20 bg-[#9ce8cb]/10 p-3 text-xs leading-5 text-[#d8f5e8]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#9ce8cb]" />O verso apresenta o conteúdo programático obrigatório e os conteúdos práticos sugeridos.</div></div></aside>
      </div>
      <Dialog open={Boolean(certificatePreview)} onOpenChange={open => { if (!open) { setCertificatePreview(null); setPreviewScale(1); } }}>
        <DialogContent className="max-w-6xl overflow-hidden border-[#cfe7df] bg-[#f7fcfa] p-0 text-[#173f46]">
          <DialogHeader className="border-b border-[#dcebe8] bg-white px-6 py-5 pr-14">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="font-display text-xl font-bold text-[#102b32]">Confira o certificado antes de baixar</DialogTitle>
                <DialogDescription className="mt-2 max-w-2xl leading-5 text-[#66827c]">Visualize as duas páginas do PDF A4, confira a marca d’água temática e baixe somente depois de validar os dados da emissão.</DialogDescription>
              </div>
              {certificatePreview && <span className="shrink-0 rounded-full bg-[#e6f6f0] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-[#0c7474]">{getCertificateWatermarkTheme(certificatePreview.form.nr).label}</span>}
            </div>
          </DialogHeader>
          <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:p-6">
            <div className="min-h-[420px] overflow-auto rounded-2xl border border-[#cfe3dd] bg-[#dbe9e5] p-3 shadow-inner sm:p-5">
              {certificatePreview && <div className="mx-auto min-h-[390px] origin-top-left overflow-hidden rounded-lg bg-white shadow-[0_20px_45px_rgba(20,73,67,.2)]" style={{ width: `${100 / previewScale}%`, height: `${100 / previewScale}%`, minHeight: `${390 / previewScale}px` }}><iframe title="Pré-visualização do certificado em PDF" src={certificatePreview.url} className="h-full w-full border-0" style={{ transform: `scale(${previewScale})`, transformOrigin: "top left", width: `${100 / previewScale}%`, height: `${100 / previewScale}%` }} /></div>}
            </div>
            <aside className="flex flex-col justify-between rounded-2xl border border-[#dcebe8] bg-white p-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#0c8c89]">Identidade da emissão</p>
                {certificatePreview && <><h4 className="mt-2 text-base font-bold text-[#173f46]">{certificatePreview.form.nr} · {certificatePreview.result.courseTitle}</h4><p className="mt-2 text-xs leading-5 text-[#66827c]">{getCertificateWatermarkTheme(certificatePreview.form.nr).description}</p><div className="mt-4 overflow-hidden rounded-xl border border-[#e1efeb] bg-[#f7fcfa]"><img src={getCertificateWatermarkTheme(certificatePreview.form.nr).assetUrl} alt="Marca d’água temática do certificado" className="h-32 w-full object-cover" /></div><dl className="mt-4 space-y-2 text-xs text-[#58736f]"><div className="flex justify-between gap-3"><dt>Participante</dt><dd className="max-w-[145px] truncate font-bold text-[#315158]">{certificatePreview.form.participantName}</dd></div><div className="flex justify-between gap-3"><dt>Registro</dt><dd className="font-bold text-[#315158]">{certificatePreview.result.registration}</dd></div><div className="flex justify-between gap-3"><dt>Páginas</dt><dd className="font-bold text-[#315158]">Frente e verso</dd></div></dl></>}
              </div>
              <div className="mt-6 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#78928d]">Controles de leitura</p>
                <div className="grid grid-cols-3 gap-2"><Button type="button" variant="outline" onClick={() => setPreviewScale(scale => Math.max(0.8, Number((scale - 0.1).toFixed(1))))} className="h-10 rounded-xl border-[#cfe3dd] text-[#0c7474]" aria-label="Reduzir zoom"><ZoomOut className="h-4 w-4" /></Button><Button type="button" variant="outline" onClick={() => setPreviewScale(1)} className="h-10 rounded-xl border-[#cfe3dd] text-xs font-bold text-[#0c7474]">100%</Button><Button type="button" variant="outline" onClick={() => setPreviewScale(scale => Math.min(1.4, Number((scale + 0.1).toFixed(1))))} className="h-10 rounded-xl border-[#cfe3dd] text-[#0c7474]" aria-label="Aumentar zoom"><ZoomIn className="h-4 w-4" /></Button></div>
                <div className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" onClick={handlePrintPreview} disabled={!certificatePreview} className="h-11 rounded-xl border-[#cfe3dd] font-bold text-[#0c7474] hover:bg-[#eff9f4]"><Printer className="mr-2 h-4 w-4" />Imprimir</Button><Button type="button" onClick={handleDownloadPreview} disabled={!certificatePreview} className="h-11 rounded-xl bg-[#0c8c89] font-bold text-white hover:bg-[#08706f]"><Download className="mr-2 h-4 w-4" />Baixar PDF</Button></div>
              </div>
            </aside>
          </div>
          <DialogFooter className="border-t border-[#dcebe8] bg-white px-6 py-4"><p className="mr-auto text-xs text-[#66827c]">{certificatePreview?.form.saveToArchive ? "O documento só é registrado no acervo quando o download for confirmado." : "O download não altera o acervo desta emissão."}</p></DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

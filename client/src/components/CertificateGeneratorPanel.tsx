import { useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { GState, jsPDF } from "jspdf";
import {
  Award,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronDown,
  FileDown,
  ImagePlus,
  Loader2,
  MapPin,
  QrCode,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  certificateCatalog,
  certificateDescription,
  certificateNrs,
  type CertificateNr,
} from "@/lib/certificateCatalog";

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
  workspaceName: string;
  companies?: Array<{ id: number; name: string }>;
  canManage: boolean;
  isPersisting?: boolean;
  onPersist?: (payload: GeneratedCertificatePayload) => void;
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
  validationUrl: string;
  phone: string;
  nr33Role: string;
  watermarkText: string;
  watermarkOpacity: number;
  backgroundColor: string;
  accentColor: string;
  watermarkEnabled: boolean;
  saveToArchive: boolean;
};

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
  validationUrl: "",
  phone: "",
  nr33Role: "Supervisor de entrada",
  watermarkText: "TST BRASIL HUB",
  watermarkOpacity: 0.12,
  backgroundColor: "#f7f2e8",
  accentColor: "#2b9a90",
  watermarkEnabled: true,
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

function addWatermark(doc: jsPDF, text: string, opacity: number, enabled: boolean) {
  if (!enabled || !text.trim()) return;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(58);
  doc.setTextColor(195, 205, 202);
  doc.setGState(new GState({ opacity }));
  doc.text(text.trim().toUpperCase(), 148.5, 110, { align: "center", angle: -38 });
  doc.setGState(new GState({ opacity: 1 }));
}

function imageFormat(dataUrl: string) {
  return dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg") ? "JPEG" : "PNG";
}

function buildPracticalContent(nr: CertificateNr) {
  if (nr === "NR-35") return ["Procedimentos para realização de trabalhos em altura", "Simulação de uso dos EPIs e EPCs"];
  if (nr === "NR-10") return ["Simulação de desenergização e aterramento", "Práticas de primeiros socorros e resgate"];
  if (nr === "NR-33") return ["Simulação de entrada em espaço confinado", "Uso de equipamentos de detecção de gases e resgate"];
  if (nr === "NR-20") return ["Uso de sistemas de segurança contra incêndio", "Simulação de controle de vazamentos"];
  return ["Medições práticas com decibelímetro", "Avaliação de cenários de exposição"];
}

async function generateCertificatePdf(form: FormState, logoDataUrl: string | null) {
  const definition = certificateCatalog[form.nr];
  const selectedCourse = definition.courses.find(course => course.name === form.course) ?? definition.courses[0];
  const primaryColor = form.accentColor || definition.colors[0];
  const secondaryColor = definition.colors[1];
  const registration = `${form.nr.replace("-", "")}-${Date.now().toString().slice(-8)}`;
  const validityText = form.validity === "Indeterminada" ? "Indeterminada" : `${form.validity} meses`;
  const courseTitle = form.nr === "NR-33" && form.nr33Role ? `${form.nr33Role} — ${form.course}` : form.course;
  const qrDataUrl = form.validationUrl.trim()
    ? await QRCode.toDataURL(form.validationUrl.trim(), {
        margin: 1,
        width: 240,
        color: { dark: primaryColor, light: "#ffffff" },
      })
    : null;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  addPageBackground(doc, form.backgroundColor);
  addWatermark(doc, form.watermarkText, form.watermarkOpacity, form.watermarkEnabled);
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
  addWatermark(doc, form.watermarkText, form.watermarkOpacity, form.watermarkEnabled);
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
  definition.content.forEach((item, index) => {
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
  if (qrDataUrl) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(primaryColor);
    doc.text("Valide a autenticidade deste certificado", 148.5, 169, { align: "center" });
    doc.addImage(qrDataUrl, "PNG", 138.5, 173, 20, 20, undefined, "FAST");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(80, 95, 93);
    doc.text("Aponte a câmera do celular para o QR Code", 148.5, 196, { align: "center" });
  }
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
  doc.save(`Certificado_${form.nr}_${safeName}.pdf`);
  return {
    registration,
    courseTitle,
    validityText,
    selectedCourse,
  };
}

export default function CertificateGeneratorPanel({ workspaceName, companies = [], canManage, isPersisting = false, onPersist }: CertificateGeneratorPanelProps) {
  const [form, setForm] = useState<FormState>(() => initialForm(companies));
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const definition = certificateCatalog[form.nr];
  const selectedCourse = definition.courses.find(course => course.name === form.course) ?? definition.courses[0];
  const expiresAt = useMemo(() => {
    if (form.validity === "Indeterminada" || !form.completionDate) return null;
    const date = new Date(`${form.completionDate}T12:00:00`);
    date.setMonth(date.getMonth() + Number(form.validity));
    return date;
  }, [form.completionDate, form.validity]);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => setForm(current => ({ ...current, [field]: value }));

  const handleNrChange = (nr: CertificateNr) => {
    const nextDefinition = certificateCatalog[nr];
    setForm(current => ({
      ...current,
      nr,
      course: nextDefinition.courses[0].name,
      validity: nextDefinition.defaultValidityMonths,
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
    reader.onload = event => setLogoDataUrl(typeof event.target?.result === "string" ? event.target.result : null);
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setForm(initialForm(companies));
    setLogoDataUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!form.participantName.trim()) return toast.error("Informe o nome do participante.");
    if (!form.cpf.trim()) return toast.error("Informe o CPF do participante.");
    if (!form.instructor.trim()) return toast.error("Informe o instrutor ou responsável técnico.");
    setIsGenerating(true);
    try {
      const result = await generateCertificatePdf(form, logoDataUrl);
      if (form.saveToArchive && onPersist) {
          onPersist({
          companyId: form.companyId,
          participantName: form.participantName.trim(),
          trainingName: `${form.nr} · ${result.courseTitle}`,
          issuedAt: new Date(`${form.completionDate}T12:00:00`),
          expiresAt,
          referenceUrl: form.validationUrl.trim() || null,
            notes: [
            form.company.trim() ? `Empresa: ${form.company.trim()}` : null,
            `CPF: ${form.cpf.trim()}`,
            form.location.trim() ? `Local: ${form.location.trim()}` : null,
            form.instructor.trim() ? `Instrutor: ${form.instructor.trim()}` : null,
            form.instructorRegistration.trim() ? `Registro: ${form.instructorRegistration.trim()}` : null,
            `Carga horária: ${result.selectedCourse.workload}`,
            `Registro do certificado: ${result.registration}`,
          ].filter(Boolean).join(" · "),
        });
      }
      toast.success(form.saveToArchive ? "PDF gerado e certificado adicionado ao acervo." : "PDF frente e verso gerado com sucesso.");
    } catch (error) {
      console.error("[CertificateGenerator] Falha ao gerar certificado", error);
      toast.error("Não foi possível gerar o PDF. Revise os dados e tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-[2rem] border border-[#cfe7df] bg-[#f7fcfa] shadow-[0_18px_55px_rgba(14,86,82,.10)]" aria-label="Gerador de certificados">
      <div className="relative overflow-hidden bg-[linear-gradient(120deg,#063b43_0%,#0c7474_55%,#1d9b98_100%)] px-6 py-7 text-white lg:px-8">
        <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-[#9ce8cb]/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-[#b8f0da]"><Sparkles className="h-4 w-4" /><span className="text-[11px] font-bold uppercase tracking-[.18em]">Ferramenta integrada · TST Brasil Hub</span></div>
            <h3 className="mt-3 font-display text-2xl font-bold tracking-tight lg:text-3xl">Gere certificados NR com acabamento profissional.</h3>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#d4f1e8]">Emita um PDF frente e verso com conteúdo programático, QR Code de validação, identidade da instituição e registro organizado no ambiente ativo.</p>
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
            {form.nr === "NR-33" && <label className="text-xs font-bold text-[#315158] sm:col-span-2">Função no espaço confinado<select value={form.nr33Role} onChange={event => setField("nr33Role", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#d5e8e2] bg-white px-3 text-sm font-medium text-[#315158] outline-none focus:border-[#0c8c89]">{["Supervisor de entrada", "Vigia", "Trabalhador autorizado", "Equipe de emergência e salvamento"].map(role => <option key={role}>{role}</option>)}</select></label>}
            <label className="text-xs font-bold text-[#315158]">Validade<select value={form.validity} onChange={event => setField("validity", event.target.value as FormState["validity"])} className="mt-2 h-11 w-full rounded-xl border border-[#d5e8e2] bg-white px-3 text-sm font-medium text-[#315158] outline-none focus:border-[#0c8c89]"><option value="12">12 meses</option><option value="24">24 meses</option><option value="36">36 meses</option><option value="Indeterminada">Indeterminada</option></select></label>
            <label className="text-xs font-bold text-[#315158]">Data de conclusão<Input type="date" value={form.completionDate} onChange={event => setField("completionDate", event.target.value)} className="mt-2 h-11 rounded-xl border-[#d5e8e2]" /></label>
            <label className="text-xs font-bold text-[#315158]">Local do curso<div className="relative mt-2"><MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#81a49e]" /><Input value={form.location} onChange={event => setField("location", event.target.value)} className="h-11 rounded-xl border-[#d5e8e2] pl-10" placeholder="Cidade / unidade" /></div></label>
            <label className="text-xs font-bold text-[#315158]">Instrutor / responsável <span className="text-[#c85e55">*</span><Input value={form.instructor} onChange={event => setField("instructor", event.target.value)} className="mt-2 h-11 rounded-xl border-[#d5e8e2]" placeholder="Nome do responsável" /></label>
            <label className="text-xs font-bold text-[#315158] sm:col-span-2">Registro profissional do instrutor<Input value={form.instructorRegistration} onChange={event => setField("instructorRegistration", event.target.value)} className="mt-2 h-11 rounded-xl border-[#d5e8e2]" placeholder="CREA, CRT ou outro registro" /></label>
            <label className="text-xs font-bold text-[#315158] sm:col-span-2">URL de validação para QR Code<div className="relative mt-2"><QrCode className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#81a49e]" /><Input value={form.validationUrl} onChange={event => setField("validationUrl", event.target.value)} className="h-11 rounded-xl border-[#d5e8e2] pl-10" placeholder="https://.../validar/identificador" /></div></label>
            <label className="text-xs font-bold text-[#315158]">Telefone de contato<Input value={form.phone} onChange={event => setField("phone", event.target.value)} className="mt-2 h-11 rounded-xl border-[#d5e8e2]" placeholder="(00) 00000-0000" /></label>
            <div className="flex items-end"><div className="flex w-full items-center gap-3 rounded-xl border border-dashed border-[#b9dcd2] bg-[#f4fbf8] px-3 py-2.5 text-xs text-[#58736f]"><CalendarDays className="h-4 w-4 shrink-0 text-[#0c8c89]" /><span>Validade calculada: <strong className="text-[#315158]">{expiresAt ? expiresAt.toLocaleDateString("pt-BR") : "indeterminada"}</strong></span></div></div>
          </div>
          <div className="grid gap-4 rounded-2xl border border-[#dcebe8] bg-white p-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="text-xs font-bold text-[#315158]">Logo da instituição</p><p className="mt-1 text-xs leading-5 text-[#78928d]">Opcional. O logo é incorporado somente no PDF e não é salvo como dado do participante.</p></div><div className="flex items-center gap-3"><div className="grid h-14 w-14 place-items-center overflow-hidden rounded-xl border border-[#d5e8e2] bg-[#f7fcfa]">{logoDataUrl ? <img src={logoDataUrl} alt="Prévia do logo" className="h-full w-full object-contain" /> : <ImagePlus className="h-5 w-5 text-[#8eada7]" />}</div><input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={event => handleLogo(event.target.files?.[0])} className="max-w-[190px] text-xs text-[#58736f] file:mr-2 file:rounded-lg file:border-0 file:bg-[#e6f6f0] file:px-3 file:py-2 file:text-xs file:font-bold file:text-[#0c7474]" />{logoDataUrl && <button type="button" onClick={() => { setLogoDataUrl(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="text-xs font-bold text-[#b85c36] hover:underline">Remover</button>}</div></div>
          <div className="grid gap-4 rounded-2xl border border-[#dcebe8] bg-white p-5 sm:grid-cols-2"><div className="sm:col-span-2"><p className="text-xs font-bold text-[#315158]">Identidade visual da empresa</p><p className="mt-1 text-xs leading-5 text-[#78928d]">Escolha a cor de fundo e o tom de destaque usados no PDF e na prévia. O logo carregado acima é específico desta emissão.</p></div><label className="flex items-center justify-between gap-3 rounded-xl border border-[#e1efeb] bg-[#f7fcfa] px-3 py-2.5 text-xs font-bold text-[#315158]">Fundo do certificado<input aria-label="Cor de fundo do certificado" type="color" value={form.backgroundColor} onChange={event => setField("backgroundColor", event.target.value)} className="h-9 w-14 cursor-pointer rounded-lg border-0 bg-transparent p-0" /></label><label className="flex items-center justify-between gap-3 rounded-xl border border-[#e1efeb] bg-[#f7fcfa] px-3 py-2.5 text-xs font-bold text-[#315158]">Cor de destaque<input aria-label="Cor de destaque do certificado" type="color" value={form.accentColor} onChange={event => setField("accentColor", event.target.value)} className="h-9 w-14 cursor-pointer rounded-lg border-0 bg-transparent p-0" /></label></div>
          <div className="grid gap-4 rounded-2xl border border-[#dcebe8] bg-white p-5 sm:grid-cols-2"><div className="sm:col-span-2 flex items-center justify-between gap-4"><div><p className="text-xs font-bold text-[#315158]">Marca d’água</p><p className="mt-1 text-xs text-[#78928d]">Use uma identificação discreta nas duas páginas.</p></div><button type="button" role="switch" aria-checked={form.watermarkEnabled} onClick={() => setField("watermarkEnabled", !form.watermarkEnabled)} className={`relative h-6 w-11 rounded-full transition ${form.watermarkEnabled ? "bg-[#0c8c89]" : "bg-[#c9d9d5]"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${form.watermarkEnabled ? "left-6" : "left-1"}`} /></button></div><label className="text-xs font-bold text-[#315158]">Texto da marca d’água<Input disabled={!form.watermarkEnabled} value={form.watermarkText} onChange={event => setField("watermarkText", event.target.value)} className="mt-2 h-11 rounded-xl border-[#d5e8e2]" placeholder="Ex.: TST Brasil Hub" /></label><label className="text-xs font-bold text-[#315158]">Opacidade · {form.watermarkOpacity.toFixed(2)}<input disabled={!form.watermarkEnabled} type="range" min="0.05" max="0.4" step="0.05" value={form.watermarkOpacity} onChange={event => setField("watermarkOpacity", Number(event.target.value))} className="mt-4 w-full accent-[#0c8c89]" /></label></div>
          <div className="flex flex-col gap-3 rounded-2xl border border-[#d9ebe4] bg-[#eff9f4] p-4 text-sm text-[#315158] sm:flex-row sm:items-center sm:justify-between"><label className="flex items-center gap-3"><input type="checkbox" checked={form.saveToArchive} onChange={event => setField("saveToArchive", event.target.checked)} className="h-4 w-4 accent-[#0c8c89]" /><span><strong>Salvar também no acervo</strong><span className="mt-0.5 block text-xs text-[#66827c]">Registra o certificado no ambiente ativo após gerar o PDF.</span></span></label><span className="inline-flex items-center gap-1 text-xs font-bold text-[#0c7474]"><BadgeCheck className="h-4 w-4" />Sem dados fictícios</span></div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={reset} className="h-11 rounded-xl border-[#cfe3dd] text-[#496b67]"><RotateCcw className="mr-2 h-4 w-4" />Limpar formulário</Button><Button type="button" onClick={handleGenerate} disabled={isGenerating || isPersisting || !canManage} className="h-11 rounded-xl bg-[#0c8c89] px-5 text-white shadow-[0_10px_24px_rgba(12,140,137,.22)] hover:bg-[#08706f] disabled:opacity-60">{isGenerating || isPersisting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}{isGenerating ? "Montando PDF..." : isPersisting ? "Salvando no acervo..." : "Gerar certificado frente e verso"}</Button></div>
          {!canManage && <p className="text-right text-xs text-[#b85c36]">Seu perfil tem acesso de leitura neste ambiente. Um owner ou manager pode emitir certificados.</p>}
        </div>
        <aside className="relative overflow-hidden rounded-[1.75rem] bg-[#063b43] p-5 text-white shadow-[0_18px_50px_rgba(6,59,67,.2)] lg:sticky lg:top-6 lg:h-fit"><div className="pointer-events-none absolute -right-12 top-10 h-40 w-40 rounded-full bg-[#9ce8cb]/10 blur-3xl" /><div className="relative"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#9ce8cb]">Prévia dinâmica</p><p className="mt-1 text-sm font-bold text-white">Frente do certificado</p></div><div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/10"><Award className="h-5 w-5 text-[#d9bd88]" /></div></div><div className="relative mt-6 min-h-[430px] overflow-hidden rounded-[1.25rem] border bg-white p-5 text-center text-[#173f46] shadow-[0_18px_35px_rgba(0,0,0,.18)]" style={{ backgroundColor: form.backgroundColor, borderColor: form.accentColor }}><div className="pointer-events-none absolute inset-3 rounded-[.9rem] border border-[#d9bd88]/70" /><div className="pointer-events-none absolute inset-5 rounded-[.7rem] border border-[#2b9a90]/40" style={{ borderColor: form.accentColor }} />{logoDataUrl ? <img src={logoDataUrl} alt="Logo na prévia" className="relative mx-auto h-12 w-20 object-contain" /> : <div className="relative mx-auto grid h-12 w-20 place-items-center rounded-xl border border-dashed border-[#bfae89] text-[#a18e67]"><ImagePlus className="h-5 w-5" /></div>}<p className="relative mt-5 text-[9px] font-bold uppercase tracking-[.3em]" style={{ color: form.accentColor }}>{form.nr} · TST Brasil Hub</p><h5 className="relative mt-3 font-serif text-2xl font-bold tracking-wide text-[#1b4a50]">CERTIFICADO</h5><div className="relative mx-auto mt-2 h-px w-28 bg-[#bfae89]" /><p className="relative mt-7 text-[10px] text-[#68807f]">Certificamos que</p><p className="relative mt-2 min-h-7 px-3 font-serif text-lg font-bold uppercase" style={{ color: form.accentColor }}>{form.participantName || "Nome do participante"}</p><p className="relative mt-2 text-[9px] text-[#68807f]">concluiu com aproveitamento satisfatório</p><p className="relative mt-2 min-h-9 px-3 text-sm font-bold" style={{ color: form.accentColor }}>{form.course || "Curso de capacitação"}</p><div className="relative mt-5 grid grid-cols-2 gap-2 text-left text-[9px] text-[#68807f]"><div className="rounded-lg bg-white/60 p-2"><span className="block font-bold uppercase tracking-wider text-[#9a8660]">Conclusão</span>{formatShortDate(form.completionDate)}</div><div className="rounded-lg bg-white/60 p-2"><span className="block font-bold uppercase tracking-wider text-[#9a8660]">Validade</span>{expiresAt ? expiresAt.toLocaleDateString("pt-BR") : "Indeterminada"}</div></div><div className="relative mt-10 grid grid-cols-2 gap-6 text-[8px] text-[#68807f]"><div className="border-t border-[#718585] pt-2">Participante</div><div className="border-t border-[#718585] pt-2">{form.instructor || "Responsável técnico"}</div></div></div><div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3"><div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-[9px] font-bold uppercase tracking-wider text-[#9ce8cb]">Conteúdo</p><p className="mt-1 text-xs font-bold">{definition.content.length} módulos</p></div><div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-[9px] font-bold uppercase tracking-wider text-[#9ce8cb]">Carga</p><p className="mt-1 text-xs font-bold">{selectedCourse.workload}</p></div><div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-[9px] font-bold uppercase tracking-wider text-[#9ce8cb]">Verso</p><p className="mt-1 text-xs font-bold">Programático</p></div></div><div className="mt-5 flex items-start gap-2 rounded-xl border border-[#9ce8cb]/20 bg-[#9ce8cb]/10 p-3 text-xs leading-5 text-[#d8f5e8]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#9ce8cb]" />O PDF mantém o conteúdo programático completo e adiciona QR Code quando uma URL de validação for informada.</div></div></aside>
      </div>
    </section>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { jsPDF } from "jspdf";
import {
  ArrowRight,
  Award,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileCheck2,
  FileText,
  History,
  HelpCircle,
  ImageUp,
  Info,
  Loader2,
  RotateCcw,
  Trash2,
  Upload,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { workspaceIdFromSearch } from "@shared/workspaceContext";
import {
  buildCipaDocuments,
  emptyCipaForm,
  formatDate,
  suggestCipaComposition,
  validateCipaForm,
  type CipaDocument,
  type CipaFormData,
} from "@/lib/cipaAssistant";

const steps = [
  { label: "Empresa", icon: ShieldCheck },
  { label: "Dimensionamento", icon: UsersRound },
  { label: "Eleição", icon: ClipboardCheck },
  { label: "Capacitação", icon: Award },
  { label: "Documentos", icon: FileCheck2 },
];

type CipaHistoryEntry = CipaDocument & {
  companyName: string;
  createdAt: string;
  logoDataUrl: string | null;
};

function historyStorageKey(workspaceId: number) {
  return `tst-brasil-hub-cipa-history-${workspaceId}`;
}

function logoStorageKey(workspaceId: number) {
  return `tst-brasil-hub-cipa-logo-${workspaceId}`;
}

const demoForm: CipaFormData = {
  empresa: "",
  cnpj: "",
  grauRisco: 3,
  empregados: 0,
  endereco: "",
  sindicato: "",
  cidade: "",
  dataInicioInscricao: "",
  dataVotacao: "",
  localVotacao: "",
  dataPosse: "",
  dataCurso1: "",
  dataCurso2: "",
  dataCurso3: "",
  presidenteCE: "",
  secretarioCE: "",
  escrutinadorCE: "",
  representanteLegal: "",
  titularesEmpregador: 0,
  suplentesEmpregador: 0,
  titularesEmpregados: 0,
  suplentesEmpregados: 0,
};

function Field({ label, hint, tooltip, children, className = "" }: { label: string; hint?: string; tooltip?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block text-sm font-semibold text-[#315158] ${className}`}>
      <span className="flex items-center gap-2">{label}{hint && <span className="text-[11px] font-normal text-[#83a09a]">{hint}</span>}{tooltip && <Tooltip><TooltipTrigger asChild><button type="button" aria-label={`Orientação sobre ${label}`} className="inline-grid h-5 w-5 place-items-center rounded-full text-[#0c7474] transition hover:bg-[#e8f6f1]"><HelpCircle className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent side="top" className="max-w-xs rounded-xl border-[#b9dcd2] bg-[#063b43] p-3 text-xs leading-5 text-white shadow-xl">{tooltip}</TooltipContent></Tooltip>}</span>
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

function SectionCard({ icon: Icon, eyebrow, title, children, className = "" }: { icon: typeof ShieldCheck; eyebrow: string; title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[1.75rem] border border-[#dcebe8] bg-white p-5 shadow-[0_14px_45px_rgba(16,43,50,.055)] lg:p-6 ${className}`}>
      <div className="mb-5 flex items-start gap-3 border-b border-[#edf4f1] pb-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#e8f6f1] text-[#0c7474]"><Icon className="h-5 w-5" /></div>
        <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#0c8c89]">{eyebrow}</p><h2 className="mt-1 text-lg font-bold tracking-tight text-[#102b32]">{title}</h2></div>
      </div>
      {children}
    </section>
  );
}

function downloadPdf(document: CipaDocument | CipaHistoryEntry, companyName: string, companyLogo: string | null = null) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 18;
  const maxWidth = 174;
  let cursor = 28;
  const lines = pdf.splitTextToSize(document.content, maxWidth) as string[];
  pdf.setFillColor(6, 59, 67);
  pdf.rect(0, 0, 210, 16, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text("TST BRASIL HUB  ·  ASSISTANT CIPA", margin, 10);
  if (companyLogo) {
    try {
      const imageFormat = companyLogo.startsWith("data:image/png") ? "PNG" : "JPEG";
      pdf.addImage(companyLogo, imageFormat, 174, 3.5, 18, 9, undefined, "FAST");
    } catch {
      // A área reservada permanece no cabeçalho quando a imagem não puder ser incorporada.
    }
  } else {
    pdf.setDrawColor(142, 222, 199);
    pdf.roundedRect(174, 3.5, 18, 9, 1.5, 1.5);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(5.5);
    pdf.setTextColor(157, 231, 208);
    pdf.text("LOGO", 183, 9, { align: "center" });
  }
  pdf.setTextColor(16, 43, 50);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.text(document.title, margin, cursor);
  cursor += 9;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(102, 128, 135);
  pdf.text(`Empresa: ${companyName || "não informada"} · Identidade visual TST Brasil Hub`, margin, cursor);
  cursor += 10;
  pdf.setDrawColor(220, 235, 232);
  pdf.line(margin, cursor, 192, cursor);
  cursor += 8;
  pdf.setFillColor(232, 246, 241);
  pdf.roundedRect(margin, cursor, 174, 9, 2, 2, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(12, 116, 116);
  pdf.text("DOCUMENTO DE TRABALHO · REVISÃO TÉCNICA OBRIGATÓRIA", margin + 5, cursor + 5.8);
  cursor += 16;
  pdf.setTextColor(40, 54, 59);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  lines.forEach((line) => {
    if (cursor > 276) {
      pdf.setFontSize(8);
      pdf.setTextColor(102, 128, 135);
      pdf.text("TST Brasil Hub · Assistant CIPA", margin, 288);
      pdf.addPage();
      cursor = 24;
      pdf.setTextColor(40, 54, 59);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9.5);
    }
    pdf.text(line, margin, cursor);
    cursor += 4.7;
  });
  pdf.setFontSize(8);
  pdf.setTextColor(102, 128, 135);
  pdf.text("Documento gerado no Assistant CIPA · revisar enquadramento legal, datas e assinaturas antes da emissão.", margin, 288);
  const safeName = companyName.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "empresa";
  pdf.save(`assistant-cipa-${safeName}-${document.id}.pdf`);
}

export default function CipaAssistant() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const search = useSearch();
  const [, setLocation] = useLocation();
  const workspaces = trpc.portal.workspaces.useQuery(undefined, { enabled: Boolean(user) });
  const requestedWorkspaceId = workspaceIdFromSearch(search);
  const activeWorkspace = requestedWorkspaceId ? workspaces.data?.find(workspace => workspace.id === requestedWorkspaceId) ?? workspaces.data?.[0] ?? null : workspaces.data?.[0] ?? null;
  const [form, setForm] = useState<CipaFormData>(emptyCipaForm);
  const [generatedDocuments, setGeneratedDocuments] = useState<CipaDocument[]>([]);
  const [historyDocuments, setHistoryDocuments] = useState<CipaHistoryEntry[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<CipaDocument | CipaHistoryEntry | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  const composition = useMemo(() => suggestCipaComposition(form.grauRisco, form.empregados), [form.grauRisco, form.empregados]);
  const totalMembers = form.titularesEmpregador + form.suplentesEmpregador + form.titularesEmpregados + form.suplentesEmpregados;
  const completion = useMemo(() => {
    const required = [form.empresa, form.cnpj, form.cidade, form.dataInicioInscricao, form.dataVotacao, form.localVotacao, form.representanteLegal];
    return Math.round((required.filter(Boolean).length / required.length) * 100);
  }, [form]);

  useEffect(() => {
    if (!activeWorkspace) return;
    try {
      const storedHistory = window.localStorage.getItem(historyStorageKey(activeWorkspace.id));
      const storedLogo = window.localStorage.getItem(logoStorageKey(activeWorkspace.id));
      setHistoryDocuments(storedHistory ? JSON.parse(storedHistory) as CipaHistoryEntry[] : []);
      setLogoDataUrl(storedLogo || null);
    } catch {
      setHistoryDocuments([]);
      setLogoDataUrl(null);
    }
  }, [activeWorkspace?.id]);

  useEffect(() => {
    if (!activeWorkspace) return;
    try {
      window.localStorage.setItem(historyStorageKey(activeWorkspace.id), JSON.stringify(historyDocuments.slice(0, 80)));
    } catch {
      toast.error("Não foi possível atualizar o histórico local deste navegador.");
    }
  }, [activeWorkspace?.id, historyDocuments]);

  const update = <K extends keyof CipaFormData>(key: K, value: CipaFormData[K]) => setForm(current => ({ ...current, [key]: value }));

  const handleLogoUpload = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida para a logo da empresa.");
      return;
    }
    if (file.size > 2_500_000) {
      toast.error("A logo deve ter no máximo 2,5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      setLogoDataUrl(result);
      if (activeWorkspace && result) window.localStorage.setItem(logoStorageKey(activeWorkspace.id), result);
      toast.success("Logo da empresa aplicada aos próximos PDFs.");
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoDataUrl(null);
    if (activeWorkspace) window.localStorage.removeItem(logoStorageKey(activeWorkspace.id));
    toast.success("Logo removida da identidade dos PDFs.");
  };

  const applyComposition = () => {
    update("titularesEmpregador", composition.titularesEmpregador);
    update("suplentesEmpregador", composition.suplentesEmpregador);
    update("titularesEmpregados", composition.titularesEmpregados);
    update("suplentesEmpregados", composition.suplentesEmpregados);
    toast.success("Sugestão aplicada ao dimensionamento. Revise o Quadro I da NR-05 antes de emitir.");
  };

  const generateDocuments = async () => {
    const errors = validateCipaForm(form);
    if (errors.length) {
      toast.error(errors[0]);
      setActiveStep(0);
      return;
    }
    setIsGenerating(true);
    await new Promise(resolve => window.setTimeout(resolve, 420));
    const documents = buildCipaDocuments(form);
    const generatedAt = new Date().toISOString();
    const historyEntries = documents.map(document => ({
      ...document,
      companyName: form.empresa,
      createdAt: generatedAt,
      logoDataUrl,
    }));
    setGeneratedDocuments(documents);
    setHistoryDocuments(current => [...historyEntries, ...current].slice(0, 80));
    setIsGenerating(false);
    setActiveStep(4);
    toast.success("Pacote de documentos preparado e adicionado ao histórico.");
  };

  const loadExample = () => {
    setForm({ ...demoForm, empresa: "Exemplo não persistido — substitua pelos dados reais", cidade: "Cidade/UF", grauRisco: 3, empregados: 20 });
    toast.info("Estrutura de demonstração carregada somente nesta sessão. Nada foi salvo no ambiente.");
  };

  const downloadDocument = (document: CipaDocument | CipaHistoryEntry) => {
    const historical = "companyName" in document;
    downloadPdf(document, historical ? document.companyName : form.empresa, historical ? document.logoDataUrl : logoDataUrl);
  };

  const clearForm = () => {
    setForm(emptyCipaForm);
    setGeneratedDocuments([]);
    setSelectedDocument(null);
    setActiveStep(0);
    toast.success("Formulário limpo. O histórico permanece disponível neste ambiente.");
  };

  const clearHistory = () => {
    setHistoryDocuments([]);
    toast.success("Histórico local de documentos limpo.");
  };

  const selectedCompanyName = selectedDocument && "companyName" in selectedDocument ? selectedDocument.companyName : form.empresa;
  const selectedLogo = selectedDocument && "logoDataUrl" in selectedDocument ? selectedDocument.logoDataUrl : logoDataUrl;

  if (loading || workspaces.isLoading) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#0c7474]" /></div>;
  if (!activeWorkspace) return <DashboardLayout title="Assistant CIPA"><div className="mx-auto max-w-xl rounded-3xl border border-dashed border-[#bddbd5] bg-white p-10 text-center"><ShieldCheck className="mx-auto h-10 w-10 text-[#0c7474]" /><h2 className="mt-4 text-2xl font-bold text-[#102b32]">Crie um ambiente antes de usar o Assistant CIPA.</h2><p className="mt-2 text-sm leading-6 text-[#668087]">O processo eleitoral e os documentos da CIPA precisam ficar vinculados ao ambiente e à empresa corretos.</p><Button onClick={() => setLocation("/app")} className="mt-6 rounded-xl bg-[#0c7474] text-white">Voltar ao dashboard</Button></div></DashboardLayout>;

  return (
    <DashboardLayout title="Assistant CIPA">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(120deg,#063b43_0%,#0c7474_48%,#123f69_100%)] p-6 text-white shadow-[0_20px_60px_rgba(6,59,67,.22)] lg:p-8">
          <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#8edec7]/20 blur-3xl" /><div className="pointer-events-none absolute bottom-[-7rem] left-1/3 h-64 w-64 rounded-full bg-[#b9defc]/15 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_330px] lg:items-end">
            <div><div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[#9de7d0]"><Sparkles className="h-4 w-4" /> Assistente operacional de CIPA</div><h2 className="mt-4 max-w-3xl font-display text-3xl font-bold leading-tight tracking-tight lg:text-4xl">Do enquadramento ao documento, com clareza para o TST.</h2><p className="mt-4 max-w-2xl text-sm leading-6 text-white/75">Organize o processo eleitoral, valide uma composição inicial, estruture a capacitação e prepare documentos editáveis para revisão técnica. O Assistant CIPA funciona nos ambientes Prestador de Serviço e Empresa.</p><div className="mt-6 flex flex-wrap items-center gap-3"><span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85">Ambiente: {activeWorkspace.name}</span><span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85">TST {activeWorkspace.kind === "autonomo" ? "Prestador de Serviço" : "Empresa"}</span></div></div>
            <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-md"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[.14em] text-white/65">Preenchimento</span><span className="text-2xl font-bold text-[#9de7d0]">{completion}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#8edec7] transition-all duration-500" style={{ width: `${completion}%` }} /></div><p className="mt-3 text-xs leading-5 text-white/65">Você pode salvar os dados no acervo somente após validar o conteúdo. Nesta etapa, o pacote permanece como rascunho da sessão.</p></div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[210px_1fr] lg:items-start">
          <aside className="rounded-[1.75rem] border border-[#dcebe8] bg-white p-3 shadow-sm lg:sticky lg:top-28">
            <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#83a09a]">Fluxo guiado</p>
            <nav className="space-y-1" aria-label="Etapas do Assistant CIPA">{steps.map((step, index) => { const Icon = step.icon; const active = activeStep === index; const done = index < activeStep || (index === 4 && generatedDocuments.length > 0); return <button key={step.label} type="button" onClick={() => setActiveStep(index)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${active ? "bg-[#e8f6f1] text-[#0c7474] shadow-sm" : "text-[#668087] hover:bg-[#f5faf8] hover:text-[#315158]"}`}><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs ${done ? "bg-[#0c7474] text-white" : active ? "bg-white text-[#0c7474]" : "bg-[#f0f6f4] text-[#83a09a]"}`}>{done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}</span><span>{step.label}</span></button>; })}</nav>
            <div className="mt-4 border-t border-[#edf4f1] pt-4"><button type="button" onClick={loadExample} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-[#0c7474] transition hover:bg-[#f2faf6]"><Info className="h-4 w-4" /> Carregar estrutura de exemplo</button><button type="button" onClick={clearForm} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-[#b85c36] transition hover:bg-[#fff7f2]"><RotateCcw className="h-4 w-4" /> Limpar sessão</button></div>
          </aside>

          <main className="min-w-0 space-y-5">
            {activeStep === 0 && <div className="space-y-5"><SectionCard icon={ShieldCheck} eyebrow="Etapa 01 · identificação" title="Dados da empresa e do processo"><div className="grid gap-4 md:grid-cols-2"><Field label="Nome da empresa *" className="md:col-span-2"><Input value={form.empresa} onChange={event => update("empresa", event.target.value)} placeholder="Razão social da empresa" className="h-11 rounded-xl border-[#cfe3de]" /></Field><Field label="CNPJ *"><Input value={form.cnpj} onChange={event => update("cnpj", event.target.value)} placeholder="00.000.000/0000-00" className="h-11 rounded-xl border-[#cfe3de]" /></Field><Field label="Grau de risco *" hint="1 a 4" tooltip="O grau de risco é definido pela atividade econômica e pelo enquadramento oficial da empresa. Use a classificação aplicável ao estabelecimento e confirme a base legal antes de aceitar a sugestão de composição."><select value={form.grauRisco} onChange={event => update("grauRisco", Number(event.target.value))} className="h-11 w-full rounded-xl border border-[#cfe3de] bg-white px-3 text-sm font-medium text-[#315158] outline-none"><option value={1}>Grau 1 · baixo</option><option value={2}>Grau 2 · moderado</option><option value={3}>Grau 3 · elevado</option><option value={4}>Grau 4 · muito elevado</option></select></Field><Field label="Número de empregados *" tooltip="Informe o total de empregados do estabelecimento que será analisado. A faixa de empregados influencia o dimensionamento inicial apresentado pelo assistente; confira o quadro normativo vigente."><Input type="number" min={0} value={form.empregados || ""} onChange={event => update("empregados", Number(event.target.value) || 0)} placeholder="Ex.: 85" className="h-11 rounded-xl border-[#cfe3de]" /></Field><Field label="Endereço completo" className="md:col-span-2"><Input value={form.endereco} onChange={event => update("endereco", event.target.value)} placeholder="Rua, número, bairro, cidade/UF" className="h-11 rounded-xl border-[#cfe3de]" /></Field><Field label="Sindicato da categoria" hint="se aplicável"><Input value={form.sindicato} onChange={event => update("sindicato", event.target.value)} placeholder="Nome do sindicato" className="h-11 rounded-xl border-[#cfe3de]" /></Field><Field label="Cidade/UF para assinatura *"><Input value={form.cidade} onChange={event => update("cidade", event.target.value)} placeholder="São Paulo/SP" className="h-11 rounded-xl border-[#cfe3de]" /></Field></div></SectionCard><section className="rounded-[1.75rem] border border-[#dcebe8] bg-[linear-gradient(120deg,#f7fcfa_0%,#ffffff_60%,#fff8ed_100%)] p-5 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#fff0e9] text-[#b85c36]"><ImageUp className="h-5 w-5" /></div><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#b85c36]">Identidade do documento</p><h3 className="mt-1 text-base font-bold text-[#102b32]">Logo da empresa nos PDFs</h3><p className="mt-1 text-xs leading-5 text-[#668087]">A imagem será usada no cabeçalho dos próximos documentos e também ficará disponível para re-download no histórico deste navegador.</p></div></div><div className="flex items-center gap-3"><div className="grid h-14 w-20 place-items-center overflow-hidden rounded-xl border border-[#dcebe8] bg-white">{logoDataUrl ? <img src={logoDataUrl} alt="Prévia da logo da empresa" className="max-h-11 max-w-[4.5rem] object-contain" /> : <span className="text-[10px] font-bold uppercase tracking-wide text-[#9ab0aa]">Logo</span>}</div><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#b9dcd2] bg-white px-3 py-2 text-xs font-bold text-[#0c7474] transition hover:bg-[#e8f6f1]"><Upload className="h-3.5 w-3.5" /> {logoDataUrl ? "Trocar logo" : "Enviar logo"}<input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={event => handleLogoUpload(event.target.files?.[0])} /></label>{logoDataUrl && <Button type="button" variant="ghost" size="icon" onClick={removeLogo} className="h-9 w-9 rounded-xl text-[#b85c36] hover:bg-[#fff0e9]" aria-label="Remover logo"><Trash2 className="h-4 w-4" /></Button>}</div></div></section><div className="flex justify-end"><Button type="button" onClick={() => setActiveStep(1)} className="rounded-xl bg-[#0c7474] text-white hover:bg-[#063b43]">Continuar para dimensionamento <ArrowRight className="ml-2 h-4 w-4" /></Button></div></div>}

            {activeStep === 1 && <div className="space-y-5"><SectionCard icon={UsersRound} eyebrow="Etapa 02 · composição" title="Dimensionamento inicial da CIPA"><div className={`rounded-2xl border p-4 ${composition.obrigatoria ? "border-[#b9e3d7] bg-[#f1fbf6]" : "border-[#f0ddad] bg-[#fffaf0]"}`}><div className="flex items-start gap-3"><div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${composition.obrigatoria ? "bg-[#d6f2e5] text-[#0c7474]" : "bg-[#ffedbd] text-[#9a6d0b]"}`}>{composition.obrigatoria ? <CheckCircle2 className="h-5 w-5" /> : <Info className="h-5 w-5" />}</div><div><p className={`text-sm font-bold ${composition.obrigatoria ? "text-[#0c7474]" : "text-[#9a6d0b]"}`}>{composition.obrigatoria ? "Empresa enquadrada para constituição da CIPA" : "Revisão de enquadramento necessária"}</p><p className="mt-1 text-xs leading-5 text-[#668087]">{composition.mensagem}</p></div></div></div><div className="mt-5 grid gap-3 md:grid-cols-4">{([ ["titularesEmpregador", "Titulares · empregador"], ["suplentesEmpregador", "Suplentes · empregador"], ["titularesEmpregados", "Titulares · empregados"], ["suplentesEmpregados", "Suplentes · empregados"]] as const).map(([key, label]) => <Field key={key} label={label}><Input type="number" min={0} value={form[key] || ""} onChange={event => update(key, Number(event.target.value) || 0)} className="h-11 rounded-xl border-[#cfe3de]" /></Field>)}</div><div className="mt-5 flex flex-col justify-between gap-3 rounded-2xl border border-[#dcebe8] bg-[#fbfefd] p-4 sm:flex-row sm:items-center"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#83a09a]">Sugestão do assistente</p><p className="mt-1 text-sm font-bold text-[#102b32]">{totalMembers} membro(s) informado(s) · {form.titularesEmpregador + form.titularesEmpregados} titular(es)</p><p className="mt-1 text-xs text-[#668087]">A sugestão é um ponto de partida e não substitui a validação do enquadramento legal.</p></div><Button type="button" onClick={applyComposition} variant="outline" className="rounded-xl border-[#b9dcd2] text-[#0c7474] hover:bg-[#e8f6f1]">Aplicar sugestão</Button></div></SectionCard><div className="flex justify-between"><Button type="button" variant="ghost" onClick={() => setActiveStep(0)}>Voltar</Button><Button type="button" onClick={() => setActiveStep(2)} className="rounded-xl bg-[#0c7474] text-white hover:bg-[#063b43]">Configurar eleição <ArrowRight className="ml-2 h-4 w-4" /></Button></div></div>}

            {activeStep === 2 && <div className="space-y-5"><SectionCard icon={ClipboardCheck} eyebrow="Etapa 03 · processo eleitoral" title="Calendário e Comissão Eleitoral"><div className="grid gap-4 md:grid-cols-2"><Field label="Início das inscrições *"><Input type="date" value={form.dataInicioInscricao} onChange={event => update("dataInicioInscricao", event.target.value)} className="h-11 rounded-xl border-[#cfe3de]" /></Field><Field label="Data da votação *"><Input type="date" value={form.dataVotacao} onChange={event => update("dataVotacao", event.target.value)} className="h-11 rounded-xl border-[#cfe3de]" /></Field><Field label="Local da votação" className="md:col-span-2"><Input value={form.localVotacao} onChange={event => update("localVotacao", event.target.value)} placeholder="Refeitório, auditório ou plataforma definida" className="h-11 rounded-xl border-[#cfe3de]" /></Field><Field label="Presidente da Comissão Eleitoral"><Input value={form.presidenteCE} onChange={event => update("presidenteCE", event.target.value)} placeholder="Nome completo" className="h-11 rounded-xl border-[#cfe3de]" /></Field><Field label="Secretário(a) da Comissão Eleitoral"><Input value={form.secretarioCE} onChange={event => update("secretarioCE", event.target.value)} placeholder="Nome completo" className="h-11 rounded-xl border-[#cfe3de]" /></Field><Field label="Escrutinador(a)"><Input value={form.escrutinadorCE} onChange={event => update("escrutinadorCE", event.target.value)} placeholder="Nome completo" className="h-11 rounded-xl border-[#cfe3de]" /></Field><Field label="Representante legal"><Input value={form.representanteLegal} onChange={event => update("representanteLegal", event.target.value)} placeholder="Diretor(a) ou responsável legal" className="h-11 rounded-xl border-[#cfe3de]" /></Field></div></SectionCard><div className="flex justify-between"><Button type="button" variant="ghost" onClick={() => setActiveStep(1)}>Voltar</Button><Button type="button" onClick={() => setActiveStep(3)} className="rounded-xl bg-[#0c7474] text-white hover:bg-[#063b43]">Planejar capacitação <ArrowRight className="ml-2 h-4 w-4" /></Button></div></div>}

            {activeStep === 3 && <div className="space-y-5"><SectionCard icon={Award} eyebrow="Etapa 04 · capacitação" title="Datas do curso e responsabilidade técnica"><div className="rounded-2xl border border-[#dcebe8] bg-[#f7fcfa] p-4"><div className="flex gap-3"><CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-[#0c7474]" /><p className="text-xs leading-5 text-[#668087]">Defina as datas planejadas para a capacitação dos membros. O conteúdo programático deve ser revisado pelo responsável técnico e ajustado ao ambiente de trabalho.</p></div></div><div className="mt-5 grid gap-4 md:grid-cols-3"><Field label="1º dia do curso"><Input type="date" value={form.dataCurso1} onChange={event => update("dataCurso1", event.target.value)} className="h-11 rounded-xl border-[#cfe3de]" /></Field><Field label="2º dia do curso"><Input type="date" value={form.dataCurso2} onChange={event => update("dataCurso2", event.target.value)} className="h-11 rounded-xl border-[#cfe3de]" /></Field><Field label="3º dia do curso"><Input type="date" value={form.dataCurso3} onChange={event => update("dataCurso3", event.target.value)} className="h-11 rounded-xl border-[#cfe3de]" /></Field></div><div className="mt-5 grid gap-3 md:grid-cols-3">{[["Estudo do ambiente", "Condições de trabalho e riscos do processo"], ["Prevenção", "Acidentes, doenças e medidas preventivas"], ["Organização", "Atribuições da CIPA e prevenção do assédio"]].map(([title, description]) => <div key={title} className="rounded-2xl border border-[#e6f0ee] bg-white p-4"><CheckCircle2 className="h-4 w-4 text-[#0c7474]" /><p className="mt-2 text-sm font-bold text-[#315158]">{title}</p><p className="mt-1 text-xs leading-5 text-[#668087]">{description}</p></div>)}</div></SectionCard><div className="flex justify-between"><Button type="button" variant="ghost" onClick={() => setActiveStep(2)}>Voltar</Button><Button type="button" onClick={generateDocuments} disabled={isGenerating} className="rounded-xl bg-[#0c7474] text-white hover:bg-[#063b43]">{isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparando documentos</> : <>Gerar pacote de documentos <FileText className="ml-2 h-4 w-4" /></>}</Button></div></div>}

            {activeStep === 4 && <div className="space-y-5"><section className="rounded-[1.75rem] border border-[#b9e3d7] bg-[linear-gradient(120deg,#f3fbf8_0%,#ffffff_55%,#fff8ed_100%)] p-5 shadow-sm lg:p-6"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-start"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]"><CheckCircle2 className="h-4 w-4" /> Pacote pronto para revisão</div><h2 className="mt-2 text-2xl font-bold text-[#102b32]">Documentos do processo CIPA</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#668087]">Os arquivos abaixo foram montados a partir dos dados preenchidos nesta sessão. Abra a prévia, revise o conteúdo e exporte os documentos individualmente em PDF.</p></div><span className="rounded-full bg-[#e8f6f1] px-3 py-1.5 text-xs font-bold text-[#0c7474]">{generatedDocuments.length} documentos</span></div></section><div className="grid gap-4 md:grid-cols-2">{generatedDocuments.map(document => <article key={document.id} className="group rounded-[1.5rem] border border-[#dcebe8] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#a8d8ca] hover:shadow-[0_16px_35px_rgba(12,116,116,.1)]"><div className="flex items-start justify-between gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f0f7f5] text-[#0c7474]"><FileText className="h-5 w-5" /></div><span className="rounded-full bg-[#f5f8f7] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#668087]">{document.category === "processo-eleitoral" ? "Eleição" : document.category === "capacitacao" ? "Capacitação" : "Gestão"}</span></div><h3 className="mt-4 text-base font-bold text-[#102b32]">{document.title}</h3><p className="mt-2 min-h-10 text-xs leading-5 text-[#668087]">{document.description}</p><div className="mt-5 flex gap-2"><Button type="button" variant="outline" onClick={() => setSelectedDocument(document)} className="flex-1 rounded-xl border-[#b9dcd2] text-xs font-bold text-[#0c7474] hover:bg-[#e8f6f1]">Visualizar <ChevronRight className="ml-1 h-3.5 w-3.5" /></Button><Button type="button" onClick={() => downloadDocument(document)} className="rounded-xl bg-[#0c7474] text-xs font-bold text-white hover:bg-[#063b43]"><Download className="h-3.5 w-3.5" /></Button></div></article>)}</div><section className="rounded-[1.75rem] border border-[#dcebe8] bg-white p-5 shadow-sm lg:p-6"><div className="flex flex-col justify-between gap-3 border-b border-[#edf4f1] pb-4 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#eaf4fd] text-[#3173a8]"><History className="h-5 w-5" /></div><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#3173a8]">Acervo deste navegador</p><h3 className="mt-1 text-lg font-bold text-[#102b32]">Histórico de documentos CIPA</h3></div></div><div className="flex items-center gap-3"><span className="rounded-full bg-[#eaf4fd] px-3 py-1.5 text-xs font-bold text-[#3173a8]">{historyDocuments.length} registro(s)</span>{historyDocuments.length > 0 && <Button type="button" variant="ghost" onClick={clearHistory} className="rounded-xl text-xs font-bold text-[#b85c36] hover:bg-[#fff0e9]"><Trash2 className="mr-1.5 h-3.5 w-3.5" /> Limpar histórico</Button>}</div></div>{historyDocuments.length ? <div className="mt-4 space-y-2">{historyDocuments.map(entry => <div key={`${entry.createdAt}-${entry.id}`} className="flex flex-col gap-3 rounded-2xl border border-[#edf4f1] bg-[#fbfefd] p-4 transition hover:border-[#b9dcd2] sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#0c7474] shadow-sm"><FileText className="h-4 w-4" /></div><div className="min-w-0"><p className="truncate text-sm font-bold text-[#315158]">{entry.title}</p><p className="mt-1 truncate text-xs text-[#668087]">{entry.companyName || "Empresa não informada"} · {new Date(entry.createdAt).toLocaleString("pt-BR")}</p></div></div><div className="flex shrink-0 gap-2"><Button type="button" variant="outline" onClick={() => setSelectedDocument(entry)} className="rounded-xl border-[#b9dcd2] text-xs font-bold text-[#0c7474] hover:bg-[#e8f6f1]">Visualizar</Button><Button type="button" onClick={() => downloadDocument(entry)} className="rounded-xl bg-[#0c7474] text-xs font-bold text-white hover:bg-[#063b43]"><Download className="mr-1.5 h-3.5 w-3.5" /> Baixar</Button></div></div>)}</div> : <div className="mt-4 rounded-2xl border border-dashed border-[#cfe3de] bg-[#f7fcfa] p-6 text-center"><History className="mx-auto h-7 w-7 text-[#9ab0aa]" /><p className="mt-2 text-sm font-bold text-[#315158]">Nenhum documento no histórico</p><p className="mt-1 text-xs text-[#668087]">Depois de gerar um pacote, os documentos aparecerão aqui para consulta e download novamente.</p></div>}</section><div className="flex flex-wrap justify-between gap-3"><Button type="button" variant="ghost" onClick={() => setActiveStep(3)}>Voltar e revisar</Button><Button type="button" onClick={clearForm} variant="outline" className="rounded-xl border-[#f0c9bc] text-[#b85c36] hover:bg-[#fff6f1]">Iniciar novo processo <RotateCcw className="ml-2 h-4 w-4" /></Button></div></div>}
          </main>
        </div>
      </div>

      {selectedDocument && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06272d]/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Prévia de ${selectedDocument.title}`}><div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-[#e6f0ee] px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#0c8c89]">Prévia do documento</p><h2 className="mt-1 text-lg font-bold text-[#102b32]">{selectedDocument.title}</h2></div><button type="button" onClick={() => setSelectedDocument(null)} className="grid h-9 w-9 place-items-center rounded-xl text-[#668087] transition hover:bg-[#f2f8f6] hover:text-[#102b32]" aria-label="Fechar prévia"><X className="h-5 w-5" /></button></div><div className="overflow-y-auto bg-[#f4f8f6] p-4 sm:p-8"><div className="mx-auto min-h-[560px] max-w-[680px] bg-white p-8 shadow-[0_10px_35px_rgba(16,43,50,.09)] sm:p-12"><div className="mb-8 border-b-2 border-[#0c7474] pb-5"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold tracking-[.18em] text-[#0c7474]">TST BRASIL HUB · ASSISTANT CIPA</p><h3 className="mt-3 text-xl font-bold text-[#102b32]">{selectedDocument.title}</h3><p className="mt-2 text-xs text-[#668087]">{selectedCompanyName || "Empresa não informada"}</p></div><div className="grid h-14 w-20 place-items-center overflow-hidden rounded-xl border border-[#dcebe8] bg-[#fbfefd]">{selectedLogo ? <img src={selectedLogo} alt="Logo da empresa no documento" className="max-h-11 max-w-[4.5rem] object-contain" /> : <span className="text-[10px] font-bold uppercase tracking-wide text-[#9ab0aa]">Logo</span>}</div></div></div><pre className="whitespace-pre-wrap font-sans text-xs leading-6 text-[#394c50]">{selectedDocument.content}</pre></div></div><div className="flex justify-end gap-2 border-t border-[#e6f0ee] px-5 py-4"><Button type="button" variant="ghost" onClick={() => setSelectedDocument(null)}>Fechar</Button><Button type="button" onClick={() => downloadDocument(selectedDocument)} className="rounded-xl bg-[#0c7474] text-white hover:bg-[#063b43]"><Download className="mr-2 h-4 w-4" /> Baixar PDF</Button></div></div></div>}
    </DashboardLayout>
  );
}

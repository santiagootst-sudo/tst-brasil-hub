import { useState } from "react";
import { Link, useSearch } from "wouter";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { workspaceIdFromSearch } from "@shared/workspaceContext";
import { downloadEpiReceiptPdf } from "@/lib/pdfReports";
import { 
  AlertTriangle, ClipboardCheck, ClipboardPlus, HardHat, Loader2, PackageCheck, 
  Plus, ShieldAlert, QrCode, Smartphone, CheckCircle2, Download, Check, X, Sparkles 
} from "lucide-react";

const occurrenceLabels = { near_miss: "Quase acidente", incident: "Incidente", accident: "Acidente" } as const;

export default function Operations() {
  const search = useSearch();
  const workspaceId = workspaceIdFromSearch(search) ?? 0;
  const utils = trpc.useUtils();
  const workspace = trpc.portal.workspace.useQuery({ workspaceId }, { enabled: workspaceId > 0 });
  const organization = trpc.portal.organization.useQuery({ workspaceId }, { enabled: workspaceId > 0 });
  const operations = trpc.portal.operations.useQuery({ workspaceId }, { enabled: workspaceId > 0 });
  const [companyId, setCompanyId] = useState(0);
  const [epiName, setEpiName] = useState("");
  const [caNumber, setCaNumber] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [minimumStock, setMinimumStock] = useState("0");
  const [expiresAt, setExpiresAt] = useState("");
  const [requirementRoleId, setRequirementRoleId] = useState(0);
  const [requirementEpiId, setRequirementEpiId] = useState(0);
  const [deliveryEpiId, setDeliveryEpiId] = useState(0);
  const [deliveryEmployeeId, setDeliveryEmployeeId] = useState(0);
  const [deliveryKind, setDeliveryKind] = useState<"initial" | "replacement">("initial");
  const [deliveryQuantity, setDeliveryQuantity] = useState("1");
  const [deliveredAt, setDeliveredAt] = useState("");
  const [replacementDueAt, setReplacementDueAt] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [signedByName, setSignedByName] = useState("");
  const [occurrenceType, setOccurrenceType] = useState<keyof typeof occurrenceLabels>("near_miss");
  const [occurrenceDepartmentId, setOccurrenceDepartmentId] = useState(0);
  const [occurrenceEmployeeId, setOccurrenceEmployeeId] = useState(0);
  const [occurredAt, setOccurredAt] = useState("");
  const [occurrenceSummary, setOccurrenceSummary] = useState("");

  // Mobile QR Code signing simulation states
  const [activeQrDelivery, setActiveQrDelivery] = useState<any | null>(null);
  const [isSigningQr, setIsSigningQr] = useState(false);
  const [qrSignedSuccess, setQrSignedSuccess] = useState(false);

  const refresh = () => Promise.all([utils.portal.operations.invalidate({ workspaceId }), utils.portal.organization.invalidate({ workspaceId })]);
  const createEpi = trpc.portal.createEpiItem.useMutation({ onSuccess: async () => { setEpiName(""); setCaNumber(""); setManufacturer(""); setStockQuantity("0"); setMinimumStock("0"); setExpiresAt(""); await refresh(); toast.success("Item de EPI registrado."); }, onError: error => toast.error(error.message) });
  const createDelivery = trpc.portal.createEpiDelivery.useMutation({ onSuccess: async () => { setDeliveryEpiId(0); setDeliveryEmployeeId(0); setDeliveryKind("initial"); setDeliveryQuantity("1"); setDeliveredAt(""); setReplacementDueAt(""); setDeliveryNotes(""); await refresh(); toast.success("Entrega de EPI registrada no histórico."); }, onError: error => toast.error(error.message) });
  const createRequirement = trpc.portal.createEpiRequirement.useMutation({ onSuccess: async () => { setRequirementRoleId(0); setRequirementEpiId(0); await refresh(); toast.success("Requisito de EPI vinculado à função."); }, onError: error => toast.error(error.message) });
  const createOccurrence = trpc.portal.createSstOccurrence.useMutation({ onSuccess: async () => { setOccurrenceDepartmentId(0); setOccurrenceEmployeeId(0); setOccurredAt(""); setOccurrenceSummary(""); await refresh(); toast.success("Ocorrência SST registrada."); }, onError: error => toast.error(error.message) });

  if (workspace.isLoading || organization.isLoading || operations.isLoading) return <div className="grid min-h-screen place-items-center"><Loader2 className="animate-spin text-[#0c7474]" /></div>;
  if (!workspaceId || !workspace.data) return <DashboardLayout title="Controle de EPIs"><section className="rounded-3xl border border-dashed border-[#bddbd5] bg-white p-10 text-center"><AlertTriangle className="mx-auto h-10 w-10 text-[#e98766]" /><h2 className="mt-4 text-xl font-bold">Selecione um ambiente para abrir o Controle de EPIs.</h2><Link href="/app" className="mt-6 inline-flex rounded-xl bg-[#0c7474] px-5 py-3 text-sm font-bold text-white">Escolher ambiente</Link></section></DashboardLayout>;

  const current = workspace.data;
  const canManage = current.role === "owner" || current.role === "manager";
  const companies = current.companies;
  const currentCompanyId = companyId || companies[0]?.id || 0;
  const currentCompany = companies.find(item => item.id === currentCompanyId);
  const departments = (organization.data?.departments ?? []).filter(item => item.companyId === currentCompanyId);
  const jobRoles = (organization.data?.jobRoles ?? []).filter(item => item.companyId === currentCompanyId);
  const employees = (organization.data?.employees ?? []).filter(item => item.companyId === currentCompanyId && item.status === "active");
  const epiItems = (operations.data?.epiItems ?? []).filter(item => item.companyId === currentCompanyId && item.active);
  const epiDeliveries = (operations.data?.epiDeliveries ?? []).filter(item => item.companyId === currentCompanyId);
  const requirements = (operations.data?.epiRequirements ?? []).filter(item => item.companyId === currentCompanyId && item.active);
  const occurrences = (operations.data?.occurrences ?? []).filter(item => item.companyId === currentCompanyId);
  const roleName = new Map(jobRoles.map(item => [item.id, item.name]));
  const epiItemById = new Map(epiItems.map(item => [item.id, item]));
  const epiNameById = new Map(epiItems.map(item => [item.id, item.name]));
  const employeeNameById = new Map(employees.map(item => [item.id, item.fullName]));
  const now = Date.now();
  const inThirtyDays = now + 30 * 24 * 60 * 60 * 1000;
  const lowStock = epiItems.filter(item => item.stockQuantity <= item.minimumStock);
  const expiringOrExpired = epiItems.filter(item => item.expiresAt && item.expiresAt.getTime() <= inThirtyDays);
  const replacementDue = epiDeliveries.filter(item => item.replacementDueAt && item.replacementDueAt.getTime() <= inThirtyDays);
  const openOccurrences = occurrences.filter(item => item.status !== "closed");

  const handleMobileSign = () => {
    setIsSigningQr(true);
    setTimeout(() => {
      setIsSigningQr(false);
      setQrSignedSuccess(true);
      toast.success("Assinatura móvel realizada com sucesso!");
    }, 1200);
  };

  const handleDownloadReceipt = (delivery: any) => {
    const epiObj = epiItemById.get(delivery.epiItemId);
    downloadEpiReceiptPdf({
      workspaceName: current.name,
      companyName: currentCompany?.name ?? "Empresa",
      employeeName: employeeNameById.get(delivery.employeeId) ?? "Trabalhador",
      epiName: epiNameById.get(delivery.epiItemId) ?? "EPI",
      caNumber: epiObj?.caNumber,
      manufacturer: epiObj?.manufacturer,
      quantity: delivery.quantity,
      deliveryKind: delivery.deliveryKind,
      deliveredAt: delivery.deliveredAt,
      replacementDueAt: delivery.replacementDueAt,
      signedByName: delivery.signedByName,
      deliveryId: delivery.id,
    });
    toast.success("Comprovante digital em PDF baixado com sucesso!");
  };

  return <DashboardLayout title="Controle de EPIs"><div className="mx-auto max-w-7xl space-y-6">
    <section className={`rounded-[2rem] p-7 text-white shadow-lg lg:p-9 ${current.kind === "clt" ? "bg-[#123f69]" : "bg-[#063b43]"}`}><div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#8edec7]">Rotina operacional</p><h2 className="mt-2 text-3xl font-bold">EPIs, requisitos e ocorrências em um só lugar.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">Registre somente a realidade da empresa: itens disponíveis, requisitos por função e ocorrências que precisam de acompanhamento, sem informações clínicas ou prontuários.</p></div><div className="grid grid-cols-2 gap-2 text-center text-xs lg:grid-cols-4"><div className="rounded-xl bg-white/10 px-3 py-3"><b className="block text-lg">{lowStock.length}</b>estoque crítico</div><div className="rounded-xl bg-white/10 px-3 py-3"><b className="block text-lg">{expiringOrExpired.length}</b>validade a tratar</div><div className="rounded-xl bg-white/10 px-3 py-3"><b className="block text-lg">{replacementDue.length}</b>reposições próximas</div><div className="rounded-xl bg-white/10 px-3 py-3"><b className="block text-lg">{openOccurrences.length}</b>ocorrências abertas</div></div></div></section>

    {!companies.length ? <section className="rounded-3xl border border-dashed border-[#bddbd5] bg-white p-10 text-center"><HardHat className="mx-auto h-10 w-10 text-[#0c7474]" /><h3 className="mt-4 text-xl font-bold">Cadastre uma empresa antes de controlar a operação.</h3><p className="mt-2 text-sm text-[#668087]">Os EPIs e as ocorrências devem estar vinculados a uma empresa do ambiente.</p><Link href={`/app/pgr?workspace=${current.id}`} className="mt-6 inline-flex rounded-xl bg-[#0c7474] px-5 py-3 text-sm font-bold text-white">Abrir empresas e PGR</Link></section> : <>
      <section className="rounded-3xl border border-[#dcebe8] bg-white p-5 shadow-sm"><label className="block text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Empresa em foco</label><select value={currentCompanyId} onChange={event => { setCompanyId(Number(event.target.value)); setRequirementRoleId(0); setRequirementEpiId(0); setOccurrenceDepartmentId(0); setOccurrenceEmployeeId(0); }} className="mt-3 h-11 w-full rounded-xl border border-[#cfe3de] bg-white px-3 text-sm font-semibold text-[#23454b] md:max-w-md">{companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}</select></section>
      <section className="grid gap-5 xl:grid-cols-[1.02fr_.98fr]">
        <article className="rounded-3xl border border-[#dcebe8] bg-white p-5 shadow-sm"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8f6f1] text-[#0c7474]"><PackageCheck className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Controle de EPI</p><h3 className="text-lg font-bold">Itens e requisitos por função</h3></div></div>{canManage && <div className="mt-5 grid gap-3 md:grid-cols-2"><Input value={epiName} onChange={event => setEpiName(event.target.value)} placeholder="Nome do EPI" className="md:col-span-2" /><Input value={caNumber} onChange={event => setCaNumber(event.target.value)} placeholder="CA (opcional)" /><Input value={manufacturer} onChange={event => setManufacturer(event.target.value)} placeholder="Fabricante (opcional)" /><Input value={stockQuantity} onChange={event => setStockQuantity(event.target.value)} type="number" min="0" placeholder="Estoque atual" /><Input value={minimumStock} onChange={event => setMinimumStock(event.target.value)} type="number" min="0" placeholder="Estoque mínimo" /><Input value={expiresAt} onChange={event => setExpiresAt(event.target.value)} type="date" className="md:col-span-2" /><Button disabled={createEpi.isPending || epiName.trim().length < 2} onClick={() => createEpi.mutate({ workspaceId, companyId: currentCompanyId, name: epiName.trim(), caNumber: caNumber.trim() || null, manufacturer: manufacturer.trim() || null, stockQuantity: Number(stockQuantity) || 0, minimumStock: Number(minimumStock) || 0, expiresAt: expiresAt ? new Date(`${expiresAt}T12:00:00`) : null })} className="rounded-xl bg-[#0c7474] text-white md:col-span-2"><Plus className="mr-2 h-4 w-4" />Registrar item de EPI</Button></div>}<div className="mt-5 space-y-2">{epiItems.length ? epiItems.map(item => <div key={item.id} className="rounded-xl border border-[#e6f0ee] p-3"><div className="flex items-center justify-between gap-3"><strong className="text-sm">{item.name}</strong><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${item.stockQuantity <= item.minimumStock ? "bg-[#fff0e9] text-[#bd6e4f]" : "bg-[#e8f6f1] text-[#0c7474]"}`}>{item.stockQuantity} em estoque</span></div><small className="mt-1 block text-xs text-[#668087]">{item.caNumber ? `CA ${item.caNumber} · ` : ""}{item.manufacturer ?? "Fabricante não informado"}{item.expiresAt ? ` · validade ${item.expiresAt.toLocaleDateString("pt-BR")}` : ""}</small></div>) : <p className="rounded-xl bg-[#f7fcfa] p-3 text-sm text-[#668087]">Nenhum item de EPI registrado para esta empresa.</p>}</div>
          {canManage && <div className="mt-5 rounded-2xl border border-[#dcebe8] bg-[#fbfefd] p-4"><div className="flex items-start gap-2"><ClipboardCheck className="mt-0.5 h-4 w-4 text-[#0c7474]" /><div><p className="text-xs font-bold uppercase tracking-[.12em] text-[#0c8c89]">Entrega e reposição por trabalhador</p><p className="mt-1 text-xs text-[#668087]">A baixa de estoque e o histórico ficam registrados no ambiente selecionado.</p></div></div><div className="mt-3 grid gap-3 md:grid-cols-2"><select value={deliveryEpiId} onChange={event => setDeliveryEpiId(Number(event.target.value))} className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm"><option value={0}>Selecionar EPI</option>{epiItems.map(item => <option key={item.id} value={item.id}>{item.name} · estoque {item.stockQuantity}</option>)}</select><select value={deliveryEmployeeId} onChange={event => setDeliveryEmployeeId(Number(event.target.value))} className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm"><option value={0}>Selecionar trabalhador</option>{employees.map(item => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select><select value={deliveryKind} onChange={event => setDeliveryKind(event.target.value as "initial" | "replacement")} className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm"><option value="initial">Entrega inicial</option><option value="replacement">Reposição / troca</option></select><Input value={deliveryQuantity} onChange={event => setDeliveryQuantity(event.target.value)} type="number" min="1" placeholder="Quantidade" /><Input value={deliveredAt} onChange={event => setDeliveredAt(event.target.value)} type="date" /><Input value={replacementDueAt} onChange={event => setReplacementDueAt(event.target.value)} type="date" /><Input value={signedByName} onChange={event => setSignedByName(event.target.value)} placeholder="Nome de quem assinou / retirou (Aceite digital)" className="md:col-span-2" /><Textarea value={deliveryNotes} onChange={event => setDeliveryNotes(event.target.value)} placeholder="Observação da entrega (opcional)" className="min-h-20 md:col-span-2" /><Button disabled={createDelivery.isPending || !deliveryEpiId || !deliveryEmployeeId || !deliveredAt || !signedByName.trim() || Number(deliveryQuantity) < 1} onClick={() => createDelivery.mutate({ workspaceId, companyId: currentCompanyId, epiItemId: deliveryEpiId, employeeId: deliveryEmployeeId, quantity: Number(deliveryQuantity), deliveryKind, deliveredAt: new Date(`${deliveredAt}T12:00:00`), replacementDueAt: replacementDueAt ? new Date(`${replacementDueAt}T12:00:00`) : null, notes: deliveryNotes.trim() || null, signedByName: signedByName.trim() })} className="rounded-xl bg-[#3173a8] text-white md:col-span-2"><ClipboardPlus className="mr-2 h-4 w-4" />Registrar entrega com aceite digital</Button></div></div>}
          
          <div className="mt-4 space-y-3">
            {epiDeliveries.length ? epiDeliveries.map(item => (
              <div key={item.id} className="rounded-xl border border-[#dce8f1] bg-[#f8fbfe] p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-sm text-[#123f69]">{epiNameById.get(item.epiItemId) ?? "EPI"}</strong>
                  <span className="rounded-full bg-[#e4f0fa] px-2.5 py-1 text-[10px] font-bold text-[#3173a8]">{item.deliveryKind === "replacement" ? "Reposição / troca" : "Entrega inicial"}</span>
                </div>
                <p className="mt-1 text-xs text-[#47636a]">{employeeNameById.get(item.employeeId) ?? "Trabalhador"} · {item.quantity} unidade(s) · entrega em {item.deliveredAt.toLocaleDateString("pt-BR")}</p>
                <div className="mt-2 flex items-center justify-between border-t border-[#e2edf5] pt-2">
                  <small className="text-[11px] text-[#668087]">Assinado por: <b>{item.signedByName}</b></small>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDownloadReceipt(item)} 
                      className="h-7 rounded-lg border-[#bddbd5] text-xs font-semibold text-[#0c7474] hover:bg-[#e8f6f1]"
                    >
                      <Download className="mr-1 h-3 w-3" /> Baixar PDF
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => { setActiveQrDelivery(item); setQrSignedSuccess(false); }} 
                      className="h-7 rounded-lg bg-[#3173a8] text-xs font-semibold text-white hover:bg-[#235882]"
                    >
                      <QrCode className="mr-1 h-3 w-3" /> Assinatura QR Code
                    </Button>
                  </div>
                </div>
              </div>
            )) : <p className="rounded-xl bg-[#f7fbff] p-3 text-sm text-[#668087]">Nenhuma entrega de EPI registrada para esta empresa.</p>}
          </div>

          {canManage && <div className="mt-5 rounded-2xl border border-[#dcebe8] bg-[#fbfefd] p-4"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#0c8c89]">Requisito por função</p><div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto]"><select value={requirementRoleId} onChange={event => setRequirementRoleId(Number(event.target.value))} className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm"><option value={0}>Selecionar função</option>{jobRoles.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select value={requirementEpiId} onChange={event => setRequirementEpiId(Number(event.target.value))} className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm"><option value={0}>Selecionar EPI</option>{epiItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><Button disabled={createRequirement.isPending || !requirementRoleId || !requirementEpiId} onClick={() => createRequirement.mutate({ workspaceId, companyId: currentCompanyId, jobRoleId: requirementRoleId, epiItemId: requirementEpiId })} className="rounded-xl bg-[#3173a8] text-white">Vincular</Button></div></div>}<div className="mt-3 space-y-2">{requirements.map(item => <p key={item.id} className="rounded-xl bg-[#f7fbff] px-3 py-2 text-xs text-[#47636a]"><b>{roleName.get(item.jobRoleId) ?? "Função"}</b> requer <b>{epiNameById.get(item.epiItemId) ?? "EPI"}</b></p>)}</div></article>
        
        <article className="rounded-3xl border border-[#dcebe8] bg-white p-5 shadow-sm"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff0e9] text-[#bd6e4f]"><ShieldAlert className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#bd6e4f]">Acompanhamento SST</p><h3 className="text-lg font-bold">Ocorrências</h3></div></div>{canManage && <div className="mt-5 space-y-3"><select value={occurrenceType} onChange={event => setOccurrenceType(event.target.value as keyof typeof occurrenceLabels)} className="h-10 w-full rounded-xl border border-[#cfe3de] bg-white px-3 text-sm">{Object.entries(occurrenceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><div className="grid gap-3 md:grid-cols-2"><select value={occurrenceDepartmentId} onChange={event => setOccurrenceDepartmentId(Number(event.target.value))} className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm"><option value={0}>Setor (opcional)</option>{departments.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select value={occurrenceEmployeeId} onChange={event => setOccurrenceEmployeeId(Number(event.target.value))} className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm"><option value={0}>Pessoa (opcional)</option>{employees.map(item => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select></div><Input value={occurredAt} onChange={event => setOccurredAt(event.target.value)} type="datetime-local" /><Textarea value={occurrenceSummary} onChange={event => setOccurrenceSummary(event.target.value)} placeholder="Resumo objetivo da ocorrência, sem informações médicas." className="min-h-24" /><Button disabled={createOccurrence.isPending || !occurredAt || occurrenceSummary.trim().length < 10} onClick={() => createOccurrence.mutate({ workspaceId, companyId: currentCompanyId, departmentId: occurrenceDepartmentId || null, employeeId: occurrenceEmployeeId || null, type: occurrenceType, occurredAt: new Date(occurredAt), summary: occurrenceSummary.trim() })} className="w-full rounded-xl bg-[#d67845] text-white"><ClipboardPlus className="mr-2 h-4 w-4" />Registrar ocorrência</Button></div>}<div className="mt-5 space-y-2">{occurrences.length ? occurrences.map(item => <div key={item.id} className="rounded-xl border border-[#f1ded4] p-3"><div className="flex items-center justify-between gap-3"><strong className="text-sm">{occurrenceLabels[item.type]}</strong><span className="text-[10px] font-bold uppercase text-[#bd6e4f]">{item.status === "open" ? "Aberta" : item.status === "under_review" ? "Em análise" : "Encerrada"}</span></div><p className="mt-1 text-sm leading-5 text-[#47636a]">{item.summary}</p><small className="mt-2 block text-xs text-[#668087]">{item.occurredAt.toLocaleString("pt-BR")}</small></div>) : <p className="rounded-xl bg-[#fffaf7] p-3 text-sm text-[#668087]">Nenhuma ocorrência registrada para esta empresa.</p>}</div></article>
      </section>
    </>}

    {/* Mobile QR Code Signing Simulation Modal */}
    {activeQrDelivery && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-sm rounded-[2.55rem] border-8 border-[#123f69] bg-white p-6 shadow-2xl relative overflow-hidden">
          {/* Phone Speaker Notch */}
          <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-slate-300"></div>
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e8f6f1] text-[#0c7474]">
                <Smartphone className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#0c8c89]">Portal TST Mobile</p>
                <h4 className="text-sm font-bold text-[#102b32]">Assinatura de EPI</h4>
              </div>
            </div>
            <button 
              onClick={() => setActiveQrDelivery(null)}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-[#dcebe8] bg-[#f7fcfa] p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#668087]">Empresa:</span>
                <b className="text-[#102b32]">{currentCompany?.name}</b>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#668087]">Trabalhador:</span>
                <b className="text-[#102b32]">{employeeNameById.get(activeQrDelivery.employeeId) ?? "Trabalhador"}</b>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#668087]">Equipamento:</span>
                <b className="text-[#102b32]">{epiNameById.get(activeQrDelivery.epiItemId) ?? "EPI"}</b>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#668087]">Quantidade:</span>
                <b className="text-[#102b32]">{activeQrDelivery.quantity} un. ({activeQrDelivery.deliveryKind === "replacement" ? "Reposição" : "Inicial"})</b>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#668087]">Data:</span>
                <b className="text-[#102b32]">{activeQrDelivery.deliveredAt.toLocaleDateString("pt-BR")}</b>
              </div>
            </div>

            {!qrSignedSuccess ? (
              <div className="space-y-4 text-center py-2">
                <div className="mx-auto w-24 h-24 rounded-2xl border-2 border-dashed border-[#0c7474] bg-[#f2faf8] grid place-items-center relative">
                  <QrCode className="h-12 w-12 text-[#0c7474]" />
                  <span className="absolute -bottom-2 bg-[#0c7474] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">NR-06</span>
                </div>
                <p className="text-xs text-[#5d7479] leading-relaxed">
                  Confirme o recebimento do EPI acima em seu smartphone para gerar o aceite digital com validade jurídica.
                </p>
                <Button 
                  disabled={isSigningQr}
                  onClick={handleMobileSign}
                  className="w-full rounded-xl bg-[#0c7474] text-white py-3 font-bold text-sm hover:bg-[#063b43] shadow-lg shadow-[#0c7474]/20 flex items-center justify-center gap-2"
                >
                  {isSigningQr ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Processando aceite...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" /> Assinar Ficha de EPI no Celular
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 text-center py-4 animate-in zoom-in-95 duration-300">
                <div className="mx-auto w-16 h-16 rounded-full bg-[#e8f6f1] text-[#0c7474] grid place-items-center ring-8 ring-[#f1fcf9] animate-bounce">
                  <CheckCircle2 className="h-8 w-8 text-[#0c7474]" />
                </div>
                <div>
                  <h5 className="text-base font-bold text-[#102b32]">Assinatura Concluída!</h5>
                  <p className="mt-1 text-xs text-[#5d7479]">O aceite digital foi registrado com sucesso na ficha do trabalhador.</p>
                </div>
                <div className="pt-2 space-y-2">
                  <Button 
                    onClick={() => handleDownloadReceipt(activeQrDelivery)}
                    className="w-full rounded-xl bg-[#3173a8] text-white py-2.5 font-bold text-xs hover:bg-[#235882] flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" /> Baixar Comprovante Digital (PDF)
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setActiveQrDelivery(null)}
                    className="w-full rounded-xl border-[#dcebe8] text-xs font-semibold text-[#5d7479]"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  </div></DashboardLayout>;
}

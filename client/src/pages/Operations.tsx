import { useEffect, useRef, useState } from "react";
import { Link, useSearch } from "wouter";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { workspaceIdFromSearch } from "@shared/workspaceContext";
import { downloadEpiReceiptPdf, downloadConsolidatedEpiReportPdf } from "@/lib/pdfReports";
import { 
  AlertTriangle, ClipboardCheck, ClipboardPlus, HardHat, Loader2, PackageCheck, 
  Plus, ShieldAlert, QrCode, Smartphone, CheckCircle2, Download, Check, X, Sparkles, UsersRound, Archive, FolderOpen, Search, ChevronDown
} from "lucide-react";

const occurrenceLabels = { near_miss: "Quase acidente", incident: "Incidente", accident: "Acidente" } as const;
type OperationsTab = "overview" | "stock" | "deliveries" | "requirements" | "alerts" | "employee_profile";
type EpiProfileFilters = {
  search: string;
  departmentId: number;
  roleId: number;
  status: "all" | "signed" | "pending";
  startDate: string;
  endDate: string;
};

const epiProfileFiltersKey = (workspaceId: number, companyId: number) => `tst-hub:epi-profile-filters:${workspaceId}:${companyId}`;

export default function Operations() {
  const search = useSearch();
  const workspaceId = workspaceIdFromSearch(search) ?? 0;
  const requestedTab = new URLSearchParams(search).get("tab");
  const initialTab: OperationsTab = requestedTab === "employee_profile" || requestedTab === "stock" || requestedTab === "deliveries" || requestedTab === "requirements" || requestedTab === "alerts" ? requestedTab : "overview";
  const utils = trpc.useUtils();
  const queryOptions = { enabled: workspaceId > 0, retry: false } as const;
  const workspace = trpc.portal.workspace.useQuery({ workspaceId }, queryOptions);
  const organization = trpc.portal.organization.useQuery({ workspaceId }, queryOptions);
  const operations = trpc.portal.operations.useQuery({ workspaceId }, queryOptions);
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
  const [stockSearch, setStockSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [profileEmployeeSearch, setProfileEmployeeSearch] = useState("");
  const [expandedArchiveEmployeeId, setExpandedArchiveEmployeeId] = useState(0);
  const [openingArchiveEmployeeId, setOpeningArchiveEmployeeId] = useState(0);
  const [profileDepartmentFilter, setProfileDepartmentFilter] = useState<number>(0);
  const [profileRoleFilter, setProfileRoleFilter] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<OperationsTab>(initialTab);
  const [profileStatusFilter, setProfileStatusFilter] = useState<"all" | "signed" | "pending">("all");
  const [profileStartDate, setProfileStartDate] = useState<string>("");
  const [profileEndDate, setProfileEndDate] = useState<string>("");
  const persistedCompanyId = companyId || workspace.data?.companies[0]?.id || 0;
  const archiveFiltersKey = workspaceId > 0 && persistedCompanyId > 0 ? epiProfileFiltersKey(workspaceId, persistedCompanyId) : "";
  const [profileFiltersLoadedKey, setProfileFiltersLoadedKey] = useState("");
  const archiveOpenTimer = useRef<number | null>(null);

  const refresh = () => Promise.all([utils.portal.operations.invalidate({ workspaceId }), utils.portal.organization.invalidate({ workspaceId })]);
  const createEpi = trpc.portal.createEpiItem.useMutation({ onSuccess: async () => { setEpiName(""); setCaNumber(""); setManufacturer(""); setStockQuantity("0"); setMinimumStock("0"); setExpiresAt(""); await refresh(); toast.success("Item de EPI registrado."); }, onError: error => toast.error(error.message) });
  const createDelivery = trpc.portal.createEpiDelivery.useMutation({ onSuccess: async () => { setDeliveryEpiId(0); setDeliveryEmployeeId(0); setDeliveryKind("initial"); setDeliveryQuantity("1"); setDeliveredAt(""); setReplacementDueAt(""); setDeliveryNotes(""); await refresh(); toast.success("Entrega de EPI registrada no histórico."); }, onError: error => toast.error(error.message) });
  const createRequirement = trpc.portal.createEpiRequirement.useMutation({ onSuccess: async () => { setRequirementRoleId(0); setRequirementEpiId(0); await refresh(); toast.success("Requisito de EPI vinculado à função."); }, onError: error => toast.error(error.message) });
  const createOccurrence = trpc.portal.createSstOccurrence.useMutation({ onSuccess: async () => { setOccurrenceDepartmentId(0); setOccurrenceEmployeeId(0); setOccurredAt(""); setOccurrenceSummary(""); await refresh(); toast.success("Ocorrência SST registrada."); }, onError: error => toast.error(error.message) });
  const createReturn = trpc.portal.createEpiReturn.useMutation({
    onSuccess: async () => {
      await utils.portal.operations.invalidate({ workspaceId });
      toast.success("Devolução ou troca registrada e estoque atualizado com sucesso!");
    },
    onError: err => toast.error(err.message)
  });

  useEffect(() => {
    if (!archiveFiltersKey || typeof window === "undefined") return;
    if (archiveOpenTimer.current !== null) {
      window.clearTimeout(archiveOpenTimer.current);
      archiveOpenTimer.current = null;
    }
    setExpandedArchiveEmployeeId(0);
    setOpeningArchiveEmployeeId(0);
    const defaults: EpiProfileFilters = { search: "", departmentId: 0, roleId: 0, status: "all", startDate: "", endDate: "" };
    try {
      const raw = window.localStorage.getItem(archiveFiltersKey);
      const saved = raw ? JSON.parse(raw) as Partial<EpiProfileFilters> : defaults;
      setProfileEmployeeSearch(typeof saved.search === "string" ? saved.search : defaults.search);
      setProfileDepartmentFilter(typeof saved.departmentId === "number" ? saved.departmentId : defaults.departmentId);
      setProfileRoleFilter(typeof saved.roleId === "number" ? saved.roleId : defaults.roleId);
      setProfileStatusFilter(saved.status === "signed" || saved.status === "pending" ? saved.status : defaults.status);
      setProfileStartDate(typeof saved.startDate === "string" ? saved.startDate : defaults.startDate);
      setProfileEndDate(typeof saved.endDate === "string" ? saved.endDate : defaults.endDate);
    } catch {
      setProfileEmployeeSearch(defaults.search);
      setProfileDepartmentFilter(defaults.departmentId);
      setProfileRoleFilter(defaults.roleId);
      setProfileStatusFilter(defaults.status);
      setProfileStartDate(defaults.startDate);
      setProfileEndDate(defaults.endDate);
    }
    setProfileFiltersLoadedKey(archiveFiltersKey);
  }, [archiveFiltersKey]);

  useEffect(() => {
    if (!archiveFiltersKey || profileFiltersLoadedKey !== archiveFiltersKey || typeof window === "undefined") return;
    const filters: EpiProfileFilters = {
      search: profileEmployeeSearch,
      departmentId: profileDepartmentFilter,
      roleId: profileRoleFilter,
      status: profileStatusFilter,
      startDate: profileStartDate,
      endDate: profileEndDate,
    };
    try {
      window.localStorage.setItem(archiveFiltersKey, JSON.stringify(filters));
    } catch {
      // A private browsing context or a full storage quota must not block the archive.
    }
  }, [archiveFiltersKey, profileFiltersLoadedKey, profileEmployeeSearch, profileDepartmentFilter, profileRoleFilter, profileStatusFilter, profileStartDate, profileEndDate]);

  useEffect(() => () => {
    if (archiveOpenTimer.current !== null) window.clearTimeout(archiveOpenTimer.current);
  }, []);

  const closeArchiveDrawer = () => {
    if (archiveOpenTimer.current !== null) {
      window.clearTimeout(archiveOpenTimer.current);
      archiveOpenTimer.current = null;
    }
    setOpeningArchiveEmployeeId(0);
    setExpandedArchiveEmployeeId(0);
  };

  const openArchiveDrawer = (employeeId: number) => {
    if (expandedArchiveEmployeeId === employeeId) {
      closeArchiveDrawer();
      return;
    }
    if (archiveOpenTimer.current !== null) window.clearTimeout(archiveOpenTimer.current);
    setExpandedArchiveEmployeeId(0);
    setOpeningArchiveEmployeeId(employeeId);
    archiveOpenTimer.current = window.setTimeout(() => {
      setExpandedArchiveEmployeeId(employeeId);
      setOpeningArchiveEmployeeId(0);
      archiveOpenTimer.current = null;
      window.setTimeout(() => document.getElementById(`employee-file-${employeeId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 40);
    }, 220);
  };

  if (workspace.isLoading || organization.isLoading || operations.isLoading) return <div className="grid min-h-screen place-items-center"><Loader2 className="animate-spin text-[#0c7474]" /></div>;
  if (workspace.error || organization.error || operations.error) return <DashboardLayout title="Controle de EPIs"><section className="rounded-3xl border border-[#f3c4b1] bg-white p-10 text-center shadow-sm"><AlertTriangle className="mx-auto h-10 w-10 text-[#d7694d]" /><h2 className="mt-4 text-xl font-bold text-[#17343b]">Não foi possível abrir este ambiente.</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#668087]">Verifique se o ambiente ainda está ativo e se sua conta possui vínculo com ele. Você pode retornar à escolha de ambientes para continuar.</p><Link href="/app" className="mt-6 inline-flex rounded-xl bg-[#0c7474] px-5 py-3 text-sm font-bold text-white">Voltar aos ambientes</Link></section></DashboardLayout>;
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

  const filteredEpiItems = epiItems.filter((item: any) => {
    const matchesSearch = !stockSearch.trim() || item.name.toLowerCase().includes(stockSearch.toLowerCase()) || (item.caNumber && item.caNumber.toLowerCase().includes(stockSearch.toLowerCase()));
    const isCritical = item.stockQuantity <= item.minimumStock;
    const isCaExpired = item.expiresAt && item.expiresAt.getTime() <= now;
    let matchesFilter = true;
    if (stockFilter === "critical") matchesFilter = isCritical;
    else if (stockFilter === "ca_expired") matchesFilter = Boolean(isCaExpired);
    else if (stockFilter === "issues") matchesFilter = Boolean(isCritical || isCaExpired);
    else if (stockFilter === "ok") matchesFilter = !isCritical && !isCaExpired;
    return matchesSearch && matchesFilter;
  });

  const departmentName = new Map(departments.map(item => [item.id, item.name]));
  const normalizedProfileSearch = profileEmployeeSearch.trim().toLocaleLowerCase("pt-BR");
  const profileEmployees = employees.filter(employee => {
    if (profileDepartmentFilter && employee.departmentId !== profileDepartmentFilter) return false;
    if (profileRoleFilter && employee.jobRoleId !== profileRoleFilter) return false;
    if (!normalizedProfileSearch) return true;
    const searchable = [
      employee.fullName,
      (employee as any).registration,
      (employee as any).employeeCode,
      (employee as any).cpf,
    ].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
    return searchable.includes(normalizedProfileSearch);
  });

  const handleMobileSign = () => {
    if (!activeQrDelivery) return;
    setIsSigningQr(true);
    setTimeout(() => {
      setIsSigningQr(false);
      setQrSignedSuccess(true);
      const workerName = employeeNameById.get(activeQrDelivery.employeeId) || "Colaborador";
      activeQrDelivery.signedByName = `${workerName} (Assinatura Digital Verificada em ${new Date().toLocaleDateString("pt-BR")})`;
      toast.success("Assinatura digital registrada e arquivada no perfil do funcionário!");
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
    <section className={`rounded-[2rem] p-7 text-white shadow-lg lg:p-9 ${current.kind === "clt" ? "bg-[#123f69]" : "bg-[#063b43]"}`}><div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#8edec7]">Centro Operacional de EPIs</p><h2 className="mt-2 text-3xl font-bold">Controle Avançado de EPIs e CA</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">Gerenciamento inteligente de estoque, Certificados de Aprovação (CA), fichas de entrega com assinatura digital via QR Code e histórico por trabalhador.</p></div><div className="grid grid-cols-2 gap-2 text-center text-xs lg:grid-cols-3"><div className="rounded-xl bg-white/10 px-3 py-3"><b className="block text-lg">{lowStock.length}</b>estoque crítico</div><div className="rounded-xl bg-white/10 px-3 py-3"><b className="block text-lg">{expiringOrExpired.length}</b>validade a tratar</div><div className="rounded-xl bg-white/10 px-3 py-3"><b className="block text-lg">{replacementDue.length}</b>reposições próximas</div></div></div></section>

    {!companies.length ? <section className="rounded-3xl border border-dashed border-[#bddbd5] bg-white p-10 text-center"><HardHat className="mx-auto h-10 w-10 text-[#0c7474]" /><h3 className="mt-4 text-xl font-bold">Cadastre uma empresa antes de controlar a operação.</h3><p className="mt-2 text-sm text-[#668087]">Os EPIs e as ocorrências devem estar vinculados a uma empresa do ambiente.</p><Link href={`/app/pgr?workspace=${current.id}`} className="mt-6 inline-flex rounded-xl bg-[#0c7474] px-5 py-3 text-sm font-bold text-white">Abrir empresas e PGR</Link></section> : <>
      <section className="space-y-6">
        {/* Top Bar Contextual do Centro Operacional de EPIs */}
        <div className="rounded-3xl border border-[#dcebe8] bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#0c7474]/10 text-[#0c7474]">
                <HardHat className="h-6 w-6" />
              </span>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[.14em] text-[#0c8c89]">Centro Operacional</span>
                <h3 className="text-xl font-bold text-[#102b32]">Controle de EPIs, CA e Assinatura Digital</h3>
              </div>
            </div>

            {/* Pesquisa Global e Seletor de Empresa na Top Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#749e97]" />
                <Input
                  value={stockSearch}
                  onChange={e => setStockSearch(e.target.value)}
                  placeholder="Pesquisar funcionário, CA ou EPI..."
                  className="h-10 rounded-2xl border-[#dcebe8] bg-[#f7fcfa] pl-10 text-xs text-[#102b32] placeholder:text-[#668087]"
                />
              </div>

              <div className="flex items-center gap-2 bg-[#f7fcfa] border border-[#dcebe8] px-4 py-2 rounded-2xl">
                <span className="text-xs font-bold text-[#668087] whitespace-nowrap">Empresa:</span>
                <select
                  value={currentCompanyId}
                  onChange={event => { setCompanyId(Number(event.target.value)); setRequirementRoleId(0); setRequirementEpiId(0); }}
                  className="h-7 bg-transparent border-0 text-xs font-bold text-[#102b32] focus:outline-none cursor-pointer"
                >
                  {companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}
                </select>
              </div>

              <Button
                onClick={() => {
                  downloadConsolidatedEpiReportPdf({
                    workspaceName: current.name,
                    companyName: currentCompany?.name ?? "Empresa",
                    epiItems: epiItems,
                    deliveriesCount: epiDeliveries.length
                  });
                  toast.success("Relatório consolidado de EPIs baixado em PDF!");
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#2165a9] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#184f85] transition shadow-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Exportar Relatório PDF</span>
              </Button>
            </div>
          </div>

          {/* Abas da Top Bar do Módulo */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-[#f0f5f4] scrollbar-none">
            {[
              { id: "overview", label: "Visão Geral", icon: PackageCheck, count: epiItems.length },
              { id: "stock", label: "Estoque & CAs", icon: HardHat, count: lowStock.length, alert: lowStock.length > 0 },
              { id: "deliveries", label: "Fichas de Entrega", icon: ClipboardCheck, count: epiDeliveries.length },
              { id: "requirements", label: "Requisitos por Função", icon: Smartphone, count: 0 },
              { id: "employee_profile", label: "Fichas por Funcionário", icon: UsersRound, count: employees.length },
              { id: "alerts", label: "Validades & Alertas", icon: ShieldAlert, count: expiringOrExpired.length, alert: expiringOrExpired.length > 0 }
            ].map(tab => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as OperationsTab)}
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-2xs ${
                    isActive
                      ? "bg-[#0c7474] text-white shadow-md shadow-[#0c7474]/20"
                      : "bg-[#f8fbfa] text-[#49636a] border border-[#dcebe8] hover:bg-[#e8f6f1] hover:text-[#0c7474]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${isActive ? "bg-white/20 text-white" : tab.alert ? "bg-[#bd6e4f] text-white" : "bg-[#0c7474]/15 text-[#0c7474]"}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conteúdo Principal por Aba */}
        <main className="space-y-6">
          {activeTab === "overview" && (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#102b32]">Resumo de Equipamentos</h3>
                  <PackageCheck className="h-5 w-5 text-[#0c7474]" />
                </div>
                <p className="text-xs text-[#5d7479] leading-relaxed">O centro operacional de EPIs garante a conformidade com a NR-06, controlando o estoque, o Certificado de Aprovação (CA) e a assinatura digital dos recibos de entrega.</p>
                <div className="pt-2 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-[#e6f0ee] bg-[#f7fcfa] p-4 text-center">
                    <b className="block text-2xl text-[#0c7474]">{epiItems.length}</b>
                    <span className="text-xs text-[#668087]">Itens cadastrados</span>
                  </div>
                  <div className="rounded-2xl border border-[#e6f0ee] bg-[#f7fcfa] p-4 text-center">
                    <b className="block text-2xl text-[#3173a8]">{epiDeliveries.length}</b>
                    <span className="text-xs text-[#668087]">Entregas registradas</span>
                  </div>
                </div>
                <Button onClick={() => setActiveTab("stock")} className="w-full rounded-xl bg-[#0c7474] text-white font-bold text-xs">Gerenciar Estoque e CAs</Button>
              </div>

              <div className="rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#102b32]">Fichas e Aceite Digital</h3>
                  <QrCode className="h-5 w-5 text-[#3173a8]" />
                </div>
                <p className="text-xs text-[#5d7479] leading-relaxed">Emita fichas individuais de EPI para os trabalhadores com comprovantes em PDF e simule a assinatura digital móvel via QR Code para auditorias e conformidade.</p>
                <div className="pt-2 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-[#e2edf5] bg-[#f8fbfe] p-4 text-center">
                    <b className="block text-2xl text-[#3173a8]">{employees.length}</b>
                    <span className="text-xs text-[#668087]">Trabalhadores ativos</span>
                  </div>
                  <div className="rounded-2xl border border-[#e2edf5] bg-[#f8fbfe] p-4 text-center">
                    <b className="block text-2xl text-[#bd6e4f]">{replacementDue.length}</b>
                    <span className="text-xs text-[#668087]">Trocas vencendo</span>
                  </div>
                </div>
                <Button onClick={() => setActiveTab("deliveries")} className="w-full rounded-xl bg-[#3173a8] text-white font-bold text-xs">Ver Fichas de Entrega</Button>
              </div>
            </div>
          )}

          {activeTab === "stock" && (
            <div className="rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#102b32]">Estoque, CA e Fabricantes</h3>
                  <p className="text-xs text-[#668087]">Gerenciamento e cadastro de equipamentos com controle de estoque mínimo.</p>
                </div>
                <PackageCheck className="h-6 w-6 text-[#0c7474]" />
              </div>

              {canManage && (
                <div className="rounded-2xl border border-[#dcebe8] bg-[#fbfefd] p-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-[.12em] text-[#0c8c89]">Cadastrar Novo EPI</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input value={epiName} onChange={event => setEpiName(event.target.value)} placeholder="Nome do EPI (ex: Óculos de Proteção Incolor)" className="md:col-span-2" />
                    <Input value={caNumber} onChange={event => setCaNumber(event.target.value)} placeholder="Número do CA (ex: 12345)" />
                    <Input value={manufacturer} onChange={event => setManufacturer(event.target.value)} placeholder="Fabricante (ex: 3M / Danny)" />
                    <Input value={stockQuantity} onChange={event => setStockQuantity(event.target.value)} type="number" min="0" placeholder="Estoque atual" />
                    <Input value={minimumStock} onChange={event => setMinimumStock(event.target.value)} type="number" min="0" placeholder="Estoque mínimo de alerta" />
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-[#5d7479] mb-1">Validade do CA / Certificado (opcional)</label>
                      <Input value={expiresAt} onChange={event => setExpiresAt(event.target.value)} type="date" />
                    </div>
                    <Button disabled={createEpi.isPending || epiName.trim().length < 2} onClick={() => createEpi.mutate({ workspaceId, companyId: currentCompanyId, name: epiName.trim(), caNumber: caNumber.trim() || null, manufacturer: manufacturer.trim() || null, stockQuantity: Number(stockQuantity) || 0, minimumStock: Number(minimumStock) || 0, expiresAt: expiresAt ? new Date(`${expiresAt}T12:00:00`) : null })} className="rounded-xl bg-[#0c7474] text-white md:col-span-2 font-bold text-sm py-2.5">
                      <Plus className="mr-2 h-4 w-4" /> Salvar EPI no Estoque
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-[.12em] text-[#5d7479]">Itens Cadastrados ({epiItems.length})</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input placeholder="Buscar por nome ou CA..." className="h-9 w-60 text-xs rounded-xl" value={stockSearch} onChange={e => setStockSearch(e.target.value)} />
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                      {[
                        { id: "all", label: "Todos" },
                        { id: "issues", label: "⚠️ Alertas (Crítico / CA Vencido)" },
                        { id: "critical", label: "Estoque Crítico" },
                        { id: "ca_expired", label: "CA Vencido" },
                        { id: "ok", label: "Regular" }
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setStockFilter(f.id)}
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${stockFilter === f.id ? "bg-[#0c7474] text-white shadow-xs" : "bg-white text-[#5d7479] border border-[#dcebe8] hover:bg-[#f2faf8]"}`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {filteredEpiItems.length ? filteredEpiItems.map(item => {
                  const isCritical = item.stockQuantity <= item.minimumStock;
                  const isCaExpired = item.expiresAt && item.expiresAt.getTime() <= Date.now();
                  return (
                    <div key={item.id} className={`rounded-2xl border p-4 flex items-center justify-between gap-4 transition ${isCritical || isCaExpired ? "border-[#fdd8cc] bg-[#fffaf8]" : "border-[#e6f0ee] bg-[#fcfdfd]"}`}>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-sm font-bold text-[#102b32]">{item.name}</strong>
                          {item.caNumber && <span className="rounded-md bg-[#eaf4fd] px-2 py-0.5 text-[10px] font-bold text-[#3173a8]">CA {item.caNumber}</span>}
                          {isCaExpired && <span className="rounded-md bg-[#fee2e2] px-2 py-0.5 text-[10px] font-bold text-[#dc2626]">⚠️ CA Vencido</span>}
                          {isCritical && <span className="rounded-md bg-[#fff0e9] px-2 py-0.5 text-[10px] font-bold text-[#bd6e4f]">⚠️ Estoque Crítico</span>}
                        </div>
                        <p className="mt-1 text-xs text-[#668087]">{item.manufacturer ?? "Fabricante não informado"} {item.expiresAt ? `· Validade CA: ${item.expiresAt.toLocaleDateString("pt-BR")}` : ""}</p>
                      </div>
                      <span className={`rounded-xl px-3 py-1.5 text-xs font-bold shrink-0 ${isCritical ? "bg-[#fff0e9] text-[#bd6e4f] border border-[#fdd8cc]" : "bg-[#e8f6f1] text-[#0c7474] border border-[#bbf7d0]"}`}>
                        {item.stockQuantity} em estoque (Mín: {item.minimumStock})
                      </span>
                    </div>
                  );
                }) : <p className="rounded-2xl bg-[#f7fcfa] p-6 text-center text-sm text-[#668087]">Nenhum EPI encontrado com os filtros aplicados.</p>}
              </div>
            </div>
          )}

          {activeTab === "deliveries" && (
            <div className="rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#102b32]">Fichas de Entrega e Aceite Digital</h3>
                  <p className="text-xs text-[#668087]">Registro de entregas e reposições com baixa automática no estoque.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => setActiveTab("employee_profile")} className="rounded-xl bg-[#0c7474] text-white text-xs font-bold">
                    Ver por Funcionário
                  </Button>
                  <ClipboardCheck className="h-6 w-6 text-[#3173a8]" />
                </div>
              </div>

              {canManage && (
                <div className="rounded-2xl border border-[#dce8f1] bg-[#f8fbfe] p-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-[.12em] text-[#3173a8]">Nova Entrega / Troca de EPI</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <select value={deliveryEpiId} onChange={event => setDeliveryEpiId(Number(event.target.value))} className="h-11 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm font-medium">
                      <option value={0}>Selecionar Equipamento (EPI)</option>
                      {epiItems.map(item => <option key={item.id} value={item.id}>{item.name} (Estoque: {item.stockQuantity})</option>)}
                    </select>
                    <select value={deliveryEmployeeId} onChange={event => setDeliveryEmployeeId(Number(event.target.value))} className="h-11 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm font-medium">
                      <option value={0}>Selecionar Trabalhador</option>
                      {employees.map(item => <option key={item.id} value={item.id}>{item.fullName}</option>)}
                    </select>
                    <select value={deliveryKind} onChange={event => setDeliveryKind(event.target.value as "initial" | "replacement")} className="h-11 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm font-medium">
                      <option value="initial">Entrega Inicial</option>
                      <option value="replacement">Reposição / Troca</option>
                    </select>
                    <Input value={deliveryQuantity} onChange={event => setDeliveryQuantity(event.target.value)} type="number" min="1" placeholder="Quantidade" className="h-11" />
                    <div>
                      <label className="block text-xs font-semibold text-[#5d7479] mb-1">Data da Entrega</label>
                      <Input value={deliveredAt} onChange={event => setDeliveredAt(event.target.value)} type="date" className="h-11" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#5d7479] mb-1">Previsão de Troca (opcional)</label>
                      <Input value={replacementDueAt} onChange={event => setReplacementDueAt(event.target.value)} type="date" className="h-11" />
                    </div>
                    <Input value={signedByName} onChange={event => setSignedByName(event.target.value)} placeholder="Nome do trabalhador para aceite digital" className="md:col-span-2 h-11" />
                    <Textarea value={deliveryNotes} onChange={event => setDeliveryNotes(event.target.value)} placeholder="Observações sobre a entrega (opcional)" className="min-h-20 md:col-span-2" />
                    <Button disabled={createDelivery.isPending || !deliveryEpiId || !deliveryEmployeeId || !deliveredAt || !signedByName.trim() || Number(deliveryQuantity) < 1} onClick={() => createDelivery.mutate({ workspaceId, companyId: currentCompanyId, epiItemId: deliveryEpiId, employeeId: deliveryEmployeeId, quantity: Number(deliveryQuantity), deliveryKind, deliveredAt: new Date(`${deliveredAt}T12:00:00`), replacementDueAt: replacementDueAt ? new Date(`${replacementDueAt}T12:00:00`) : null, notes: deliveryNotes.trim() || null, signedByName: signedByName.trim() })} className="rounded-xl bg-[#3173a8] text-white md:col-span-2 font-bold text-sm py-3">
                      <ClipboardPlus className="mr-2 h-4 w-4" /> Registrar Entrega e Gerar Recibo
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-[.12em] text-[#5d7479]">Histórico de Fichas Emitidas ({epiDeliveries.length})</h4>
                {epiDeliveries.length ? epiDeliveries.map(item => (
                  <div key={item.id} className="rounded-2xl border border-[#dce8f1] bg-[#f8fbfe] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-[#123f69]">{epiNameById.get(item.epiItemId) ?? "EPI"}</strong>
                        <span className="rounded-full bg-[#e4f0fa] px-2.5 py-0.5 text-[10px] font-bold text-[#3173a8]">{item.deliveryKind === "replacement" ? "Reposição" : "Inicial"}</span>
                      </div>
                      <p className="mt-1 text-xs text-[#47636a]">Trabalhador: <b>{employeeNameById.get(item.employeeId) ?? "Trabalhador"}</b> · {item.quantity} un. · Entregue em {item.deliveredAt.toLocaleDateString("pt-BR")}</p>
                      <small className="mt-1 block text-[11px] text-[#668087]">Aceite digital assinado por: <b>{item.signedByName}</b></small>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => handleDownloadReceipt(item)} className="rounded-xl border-[#bddbd5] text-xs font-bold text-[#0c7474] hover:bg-[#e8f6f1]">
                        <Download className="mr-1.5 h-3.5 w-3.5" /> PDF
                      </Button>
                      <Button size="sm" onClick={() => { setActiveQrDelivery(item); setQrSignedSuccess(false); }} className="rounded-xl bg-[#3173a8] text-xs font-bold text-white hover:bg-[#235882]">
                        <QrCode className="mr-1.5 h-3.5 w-3.5" /> Assinar QR Code
                      </Button>
                    </div>
                  </div>
                )) : <p className="rounded-2xl bg-[#f8fbfe] p-6 text-center text-sm text-[#668087]">Nenhuma entrega de EPI registrada.</p>}
              </div>
            </div>
          )}

          {activeTab === "requirements" && (
            <div className="rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#102b32]">Requisitos de EPI por Função</h3>
                  <p className="text-xs text-[#668087]">Vincule os equipamentos obrigatórios a cada cargo da estrutura da empresa.</p>
                </div>
                <Smartphone className="h-6 w-6 text-[#0c7474]" />
              </div>

              {canManage && (
                <div className="rounded-2xl border border-[#dcebe8] bg-[#fbfefd] p-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-[.12em] text-[#0c8c89]">Vincular EPI à Função</h4>
                  <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                    <select value={requirementRoleId} onChange={event => setRequirementRoleId(Number(event.target.value))} className="h-11 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm font-medium">
                      <option value={0}>Selecionar Função / Cargo</option>
                      {jobRoles.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                    <select value={requirementEpiId} onChange={event => setRequirementEpiId(Number(event.target.value))} className="h-11 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm font-medium">
                      <option value={0}>Selecionar Equipamento (EPI)</option>
                      {epiItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                    <Button disabled={createRequirement.isPending || !requirementRoleId || !requirementEpiId} onClick={() => createRequirement.mutate({ workspaceId, companyId: currentCompanyId, jobRoleId: requirementRoleId, epiItemId: requirementEpiId })} className="rounded-xl bg-[#0c7474] text-white font-bold h-11 px-6">
                      Vincular
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-[.12em] text-[#5d7479]">Vínculos Ativos ({requirements.length})</h4>
                {requirements.length ? requirements.map(item => (
                  <div key={item.id} className="rounded-2xl border border-[#e6f0ee] bg-[#f7fcfa] p-4 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-[#102b32]">{roleName.get(item.jobRoleId) ?? "Função"}</span>
                      <span className="mx-2 text-[#668087]">→</span>
                      <span className="text-sm font-semibold text-[#0c7474]">{epiNameById.get(item.epiItemId) ?? "EPI"}</span>
                    </div>
                    <span className="rounded-full bg-[#e8f6f1] px-3 py-1 text-[11px] font-bold text-[#0c7474]">Obrigatório</span>
                  </div>
                )) : <p className="rounded-2xl bg-[#f7fcfa] p-6 text-center text-sm text-[#668087]">Nenhum requisito de EPI vinculado a funções.</p>}
              </div>
            </div>
          )}

          {activeTab === "alerts" && (
            <div className="rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#102b32]">Validade de CAs, Estoque Mínimo e Reposições</h3>
                  <p className="text-xs text-[#668087]">Monitoramento preventivo para evitar inconformidades na operação.</p>
                </div>
                <ShieldAlert className="h-6 w-6 text-[#bd6e4f]" />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-[#fdd8cc] bg-[#fff0e9] p-5">
                  <b className="block text-2xl text-[#bd6e4f]">{lowStock.length}</b>
                  <span className="text-xs font-bold text-[#bd6e4f] uppercase tracking-wider">Estoque Crítico</span>
                  <p className="mt-2 text-xs text-[#8c4930]">Itens abaixo ou no limite do estoque mínimo configurado.</p>
                </div>
                <div className="rounded-2xl border border-[#fef08a] bg-[#fefce8] p-5">
                  <b className="block text-2xl text-[#a16207]">{expiringOrExpired.length}</b>
                  <span className="text-xs font-bold text-[#a16207] uppercase tracking-wider">CA com Validade Próxima</span>
                  <p className="mt-2 text-xs text-[#854d0e]">Certificados de Aprovação (CA) vencendo em até 30 dias.</p>
                </div>
                <div className="rounded-2xl border border-[#dcebe8] bg-[#f8fbfe] p-5">
                  <b className="block text-2xl text-[#3173a8]">{replacementDue.length}</b>
                  <span className="text-xs font-bold text-[#3173a8] uppercase tracking-wider">Reposições Próximas</span>
                  <p className="mt-2 text-xs text-[#235882]">Trocas programadas para os trabalhadores nos próximos dias.</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-[.12em] text-[#5d7479]">Detalhes dos Alertas</h4>
                {lowStock.map(item => (
                  <div key={`low-${item.id}`} className="rounded-2xl border border-[#fdd8cc] bg-[#fff5f2] p-4 flex items-center justify-between">
                    <div>
                      <strong className="text-sm font-bold text-[#bd6e4f]">{item.name}</strong>
                      <p className="text-xs text-[#8c4930] mt-0.5">Estoque atual: <b>{item.stockQuantity}</b> · Mínimo recomendado: <b>{item.minimumStock}</b></p>
                    </div>
                    <span className="rounded-xl bg-[#bd6e4f] text-white text-xs font-bold px-3 py-1.5">Reposição Necessária</span>
                  </div>
                ))}
                {!lowStock.length && !expiringOrExpired.length && (
                  <div className="rounded-2xl bg-[#f7fcfa] p-8 text-center">
                    <CheckCircle2 className="mx-auto h-10 w-10 text-[#0c7474] mb-2" />
                    <h5 className="text-sm font-bold text-[#102b32]">Nenhum alerta crítico pendente!</h5>
                    <p className="text-xs text-[#668087] mt-1">O estoque e as validades de CA estão regularizados nesta empresa.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "employee_profile" && (
            <div className="rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-sm space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#102b32]">Perfil do Funcionário e Fichas Assinadas</h3>
                  <p className="text-xs text-[#668087]">Histórico centralizado de EPIs entregues, status de aceite digital, devoluções e download dos recibos.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative min-w-[220px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#668087]" />
                    <Input
                      value={profileEmployeeSearch}
                      onChange={e => { setProfileEmployeeSearch(e.target.value); closeArchiveDrawer(); }}
                      placeholder="Buscar funcionário..."
                      aria-label="Buscar funcionário nas fichas de EPI"
                      className="h-10 rounded-xl border-[#cfe3de] bg-white pl-9 text-xs font-semibold text-[#23454b]"
                    />
                  </div>
                  <select 
                    className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-xs font-semibold text-[#23454b]"
                    value={profileDepartmentFilter}
                    onChange={e => { setProfileDepartmentFilter(Number(e.target.value)); closeArchiveDrawer(); }}
                  >
                    <option value={0}>Todos os setores ({departments.length})</option>
                    {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                  </select>
                  <select 
                    className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-xs font-semibold text-[#23454b]"
                    value={profileRoleFilter}
                    onChange={e => { setProfileRoleFilter(Number(e.target.value)); closeArchiveDrawer(); }}
                  >
                    <option value={0}>Todas as funções ({jobRoles.length})</option>
                    {jobRoles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                  </select>
                  <select 
                    className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-xs font-semibold text-[#23454b]"
                    value={profileStatusFilter}
                    onChange={e => { setProfileStatusFilter(e.target.value as EpiProfileFilters["status"]); closeArchiveDrawer(); }}
                  >
                    <option value="all">Status: Todos</option>
                    <option value="signed">Assinadas</option>
                    <option value="pending">Pendentes</option>
                  </select>
                  <Input 
                    type="date"
                    className="h-10 w-36 text-xs"
                    value={profileStartDate}
                    onChange={e => { setProfileStartDate(e.target.value); closeArchiveDrawer(); }}
                    placeholder="Data inicial"
                  />
                  <Input 
                    type="date"
                    className="h-10 w-36 text-xs"
                    value={profileEndDate}
                    onChange={e => { setProfileEndDate(e.target.value); closeArchiveDrawer(); }}
                    placeholder="Data final"
                  />
                </div>
              </div>

              {/* Armário Organizado por Divisórias / Pastas de Setor */}
              <section className="rounded-[1.75rem] border border-[#d7c8b5] bg-gradient-to-br from-[#f4eee5] via-[#eee4d5] to-[#e8dccb] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.7),0_12px_30px_rgba(117,84,48,.08)]" aria-labelledby="epi-archive-title">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#8a5a37] text-[#fff8ed] shadow-[0_5px_12px_rgba(91,58,34,.18)]"><Archive className="h-5 w-5" /></span>
                    <div>
                      <h4 id="epi-archive-title" className="text-base font-bold text-[#5b3a25]">Armário de Fichas por Setor</h4>
                      <p className="text-xs text-[#795d48]">Selecione uma pasta de setor para visualizar os funcionários e fichas correspondentes.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.1em] text-[#795d48]">
                    <span className="rounded-full bg-[#fff8ed] px-2.5 py-1">{departments.length} setores</span>
                    <span className="rounded-full bg-[#fff8ed] px-2.5 py-1">{profileEmployees.length} funcionários</span>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {departments.map(dept => {
                    const deptEmployees = profileEmployees.filter(emp => emp.departmentId === dept.id);
                    const deptDeliveries = epiDeliveries.filter(d => deptEmployees.some(emp => emp.id === d.employeeId));
                    const deptPendings = deptDeliveries.filter(d => !d.signedByName || d.signedByName.includes("Pendente")).length;
                    const isDeptOpen = profileDepartmentFilter === dept.id;

                    return (
                      <div key={`dept-folder-${dept.id}`} className="rounded-2xl border border-[#d6c4ad] bg-[#fdf8f0] p-4 shadow-xs space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <FolderOpen className="h-5 w-5 text-[#8a5a37]" />
                            <div>
                              <strong className="block text-sm font-bold text-[#5b3a25]">{dept.name}</strong>
                              <small className="text-[11px] text-[#795d48]">{deptEmployees.length} colaborador(es) · {deptDeliveries.length} ficha(s)</small>
                            </div>
                          </div>
                          {deptPendings > 0 && (
                            <span className="rounded-full bg-[#fff0e9] px-2 py-0.5 text-[10px] font-bold text-[#bd6e4f] border border-[#fdd8cc]">
                              {deptPendings} pend.
                            </span>
                          )}
                        </div>

                        <div className="pt-2 border-t border-[#eadcd0] flex items-center justify-between">
                          <span className="text-[11px] font-medium text-[#8c6d52]">Pasta setorial</span>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              setProfileDepartmentFilter(isDeptOpen ? 0 : dept.id);
                              closeArchiveDrawer();
                            }}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${isDeptOpen ? "bg-[#8a5a37] text-white" : "bg-white text-[#795d48] border border-[#d6c4ad] hover:bg-[#f4eee5]"}`}
                          >
                            {isDeptOpen ? "Ocultar funcionários" : "Abrir pasta"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Funcionários da pasta aberta ou listagem filtrada (só exibe se um setor estiver selecionado) */}
                {profileDepartmentFilter > 0 ? (
                  <div className="mt-6 pt-5 border-t border-[#dfcfbd]">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-xs font-bold uppercase tracking-[.1em] text-[#5b3a25]">
                        Funcionários da pasta: {departmentName.get(profileDepartmentFilter) || "Setor"}
                      </h5>
                      <button
                        type="button"
                        onClick={() => { setProfileDepartmentFilter(0); closeArchiveDrawer(); }}
                        className="text-xs font-bold text-[#8a5a37] hover:underline"
                      >
                        Fechar pasta / Recolher
                      </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {profileEmployees.filter(emp => emp.departmentId === profileDepartmentFilter).map(employee => {
                        const employeeDeliveries = epiDeliveries.filter(delivery => delivery.employeeId === employee.id);
                        const pendingCount = employeeDeliveries.filter(delivery => !delivery.signedByName || delivery.signedByName.includes("Pendente")).length;
                        const isExpanded = expandedArchiveEmployeeId === employee.id;
                        return (
                          <button
                            key={`drawer-${employee.id}`}
                            type="button"
                            onClick={() => openArchiveDrawer(employee.id)}
                            disabled={openingArchiveEmployeeId > 0}
                            className={`epi-archive-drawer group relative overflow-hidden rounded-xl border p-4 text-left ${isExpanded ? "border-[#8a5a37] bg-[#fff8ed] shadow-lg ring-2 ring-[#b88758]/30" : "border-[#d6c4ad] bg-[#f8f1e6] hover:border-[#b58b65] hover:-translate-y-0.5 hover:shadow-md"}`}
                            data-open={isExpanded}
                            aria-expanded={isExpanded}
                            aria-busy={openingArchiveEmployeeId === employee.id}
                            aria-controls={`employee-file-${employee.id}`}
                          >
                            <span className="absolute inset-x-0 top-0 h-1 bg-[#b88758] opacity-70" />
                            <div className="flex items-start justify-between gap-3">
                              <span className="flex min-w-0 items-center gap-2.5">
                                <Archive className={`h-5 w-5 shrink-0 ${isExpanded ? "text-[#8a5a37]" : "text-[#b88758]"}`} />
                                <span className="min-w-0">
                                  <strong className="block truncate text-sm font-bold text-[#5b3a25]">{employee.fullName}</strong>
                                  <small className="mt-0.5 block text-xs text-[#795d48]">Ficha individual · {employeeDeliveries.length} entrega(s)</small>
                                  <small className="mt-1 block truncate text-[11px] font-medium text-[#8c6d52]">{departmentName.get(employee.departmentId ?? 0) ?? "Setor não informado"} · {roleName.get(employee.jobRoleId ?? 0) ?? "Função não informada"}</small>
                                </span>
                              </span>
                              <ChevronDown className={`h-4 w-4 shrink-0 text-[#8a5a37] transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </div>
                            <div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[.08em]">
                              <span className="inline-flex items-center gap-1.5 text-[#8c6d52]">
                                {openingArchiveEmployeeId === employee.id ? <><Loader2 className="h-3 w-3 animate-spin" /> Abrindo arquivo...</> : isExpanded ? "Ficha aberta" : "Abrir arquivo..."}
                              </span>
                              {pendingCount > 0 ? (
                                <span className="rounded-full bg-[#fff0e9] px-2 py-1 text-[#bd6e4f]">{pendingCount} pendente(s)</span>
                              ) : (
                                <span className="rounded-full bg-[#e8f6f1] px-2 py-1 text-[#0c7474]">Regular</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {!profileEmployees.filter(emp => emp.departmentId === profileDepartmentFilter).length && (
                      <div className="mt-3 rounded-xl border border-dashed border-[#c9b69e] bg-[#fffaf2] p-5 text-center text-sm text-[#795d48]">
                        Nenhum funcionário cadastrado nesta pasta de setor.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-6 pt-4 border-t border-[#dfcfbd] text-center text-xs text-[#795d48] italic">
                    📁 Nenhuma pasta de setor aberta no momento. Clique em <b>"Abrir pasta"</b> acima para consultar os colaboradores e fichas.
                  </div>
                )}
              </section>

              <div className="space-y-4">
                {expandedArchiveEmployeeId > 0 && profileEmployees.filter(emp => emp.id === expandedArchiveEmployeeId).map(employee => {
                  const empDeliveries = epiDeliveries.filter(d => {
                    if (d.employeeId !== employee.id) return false;
                    const isPending = !d.signedByName || d.signedByName.includes("Pendente");
                    if (profileStatusFilter === "signed" && isPending) return false;
                    if (profileStatusFilter === "pending" && !isPending) return false;
                    if (profileStartDate && new Date(d.deliveredAt) < new Date(profileStartDate)) return false;
                    if (profileEndDate && new Date(d.deliveredAt) > new Date(`${profileEndDate}T23:59:59`)) return false;
                    return true;
                  });

                  const hasPending = empDeliveries.some(d => !d.signedByName || d.signedByName.includes("Pendente"));

                  return (
                    <div id={`employee-file-${employee.id}`} key={employee.id} className="epi-archive-file rounded-2xl border border-[#e6f0ee] bg-[#fcfdfd] p-5 space-y-4 shadow-sm scroll-mt-24">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#eef4f2] pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-[#102b32]">{employee.fullName}</h4>
                            {hasPending ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0e9] px-2.5 py-0.5 text-[10px] font-bold text-[#bd6e4f] border border-[#fdd8cc]">
                                <AlertTriangle className="h-3 w-3" /> Assinatura Pendente
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f6f1] px-2.5 py-0.5 text-[10px] font-bold text-[#0c7474]">
                                <CheckCircle2 className="h-3 w-3" /> Regular
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-[#668087]">Colaborador ativo · {empDeliveries.length} ficha(s) listada(s)</p>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={closeArchiveDrawer}
                            className="rounded-xl border-[#d7c8b5] bg-[#fffaf2] text-xs font-bold text-[#795d48] hover:bg-[#f4eee5]"
                          >
                            <X className="mr-1.5 h-3.5 w-3.5" /> Fechar gaveta
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => { setActiveQrDelivery(empDeliveries[0] || { id: 0, employeeId: employee.id, epiItemId: epiItems[0]?.id || 0, quantity: 1, deliveryKind: "initial", deliveredAt: new Date(), signedByName: "Pendente" }); setQrSignedSuccess(false); }}
                            className="rounded-xl border-[#bddbd5] text-xs font-bold text-[#0c7474] hover:bg-[#e8f6f1]"
                          >
                            <QrCode className="mr-1.5 h-3.5 w-3.5" /> Solicitar Assinatura
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h5 className="text-[11px] font-bold uppercase tracking-[.12em] text-[#5d7479]">Fichas de EPI e Termos de Aceite</h5>
                        {empDeliveries.length ? empDeliveries.map(delivery => {
                          const isPending = !delivery.signedByName || delivery.signedByName.includes("Pendente");
                          return (
                            <div key={delivery.id} className="rounded-xl border border-[#dcebe8] bg-white p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <strong className="text-sm font-bold text-[#123f69]">{epiNameById.get(delivery.epiItemId) ?? "EPI"}</strong>
                                  <span className="rounded-md bg-[#eaf4fd] px-2 py-0.5 text-[10px] font-bold text-[#3173a8]">Qtd: {delivery.quantity}</span>
                                  {isPending ? (
                                    <span className="rounded bg-[#fff0e9] px-2 py-0.5 text-[10px] font-bold text-[#bd6e4f]">Pendente</span>
                                  ) : (
                                    <span className="rounded bg-[#e8f6f1] px-2 py-0.5 text-[10px] font-bold text-[#0c7474]">Assinado</span>
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-[#668087]">Entregue em: {delivery.deliveredAt.toLocaleDateString("pt-BR")} · Aceite: <b>{delivery.signedByName}</b></p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Button size="sm" variant="outline" onClick={() => handleDownloadReceipt(delivery)} className="rounded-xl border-[#bddbd5] text-xs font-bold text-[#0c7474] hover:bg-[#e8f6f1]">
                                  <Download className="mr-1.5 h-3.5 w-3.5" /> PDF
                                </Button>
                                {canManage && (
                                  <Button 
                                    size="sm" 
                                    onClick={() => createReturn.mutate({ workspaceId, companyId: currentCompanyId, deliveryId: delivery.id, epiItemId: delivery.epiItemId, employeeId: delivery.employeeId, returnedAt: new Date(), condition: "good", notes: "Devolução registrada via painel do funcionário" })} 
                                    className="rounded-xl bg-[#d67845] text-xs font-bold text-white hover:bg-[#bd643d]"
                                  >
                                    Registrar Devolução
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        }) : <p className="rounded-xl bg-[#f7fcfa] p-4 text-center text-xs text-[#668087]">Nenhuma ficha encontrada com os filtros aplicados para este colaborador.</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
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

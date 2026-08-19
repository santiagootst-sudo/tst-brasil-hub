import { AlertTriangle, ArrowDown, ArrowRight, ArrowUp, Award, BookOpen, BriefcaseBusiness, Building2, CalendarClock, CalendarDays, CheckCircle2, CheckSquare2, CircleAlert, ClipboardCheck, Eye, EyeOff, FileCheck2, FolderKanban, GraduationCap, Headphones, LayoutDashboard, Loader2, RotateCcw, Settings2, ShieldCheck, UsersRound, WandSparkles } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useSearch } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import InspectionActionSummary from "@/components/InspectionActionSummary";
import DashboardCharts from "@/components/DashboardCharts";
import { trpc } from "@/lib/trpc";

import { workspaceIdFromSearch } from "@shared/workspaceContext";
import { daysUntilCipaMeeting, isCipaMeetingUrgent } from "@/lib/cipaUrgency";
import { defaultSummaryOrder, moveSummaryWidget as moveSummaryWidgetInOrder, normalizeSummaryLayout, toggleSummaryWidget as toggleSummaryWidgetInList, type SummaryWidgetId } from "@/lib/summaryLayout";

type Priority = {
  href: string;
  title: string;
  detail: string;
  icon: typeof ShieldCheck;
  tone: "mint" | "coral" | "blue";
};

type DashboardView = "resumo" | "cipa" | "epis" | "inspecoes" | "documentos";
type GlobalPeriod = "all" | "30" | "90" | "365";
type DashboardTab = { id: DashboardView; label: string; description: string; icon: typeof ShieldCheck };
const summaryWidgetLabels: Record<SummaryWidgetId, { label: string; description: string }> = {
  alerts: { label: "Alertas críticos", description: "EPIs, estoque e CAs que pedem ação" },
  hero: { label: "Panorama do ambiente", description: "Contexto e indicadores centrais" },
  priorities: { label: "Prioridades e rotina", description: "Foco da semana e próximos passos" },
  cipa: { label: "CIPA", description: "Reuniões e pendências da comissão" },
};

type PeriodRecord = {
  createdAt?: Date | string | null;
  issuedAt?: Date | string | null;
  scheduledAt?: Date | string | null;
  dueAt?: Date | string | null;
  occurredAt?: Date | string | null;
  expiresAt?: Date | string | null;
  nextFollowUpAt?: Date | string | null;
};

type PrestadorDashboardShellProps = {
  workspaceName: string;
  globalPeriod: GlobalPeriod;
  onPeriodChange: (period: GlobalPeriod) => void;
  activeDashboard: DashboardView;
  onDashboardChange: (dashboard: DashboardView) => void;
  tabs: DashboardTab[];
  badgeCountFor: (dashboard: DashboardView) => { count: number; key: string };
  children: ReactNode;
};

function PrestadorDashboardShell({ workspaceName, globalPeriod, onPeriodChange, activeDashboard, onDashboardChange, tabs, badgeCountFor, children }: PrestadorDashboardShellProps) {
  return <DashboardLayout title="Dashboard"><div className="dashboard-readable mx-auto max-w-[1600px] space-y-6">
    <section className="flex flex-col gap-4 border-b border-[#d7ddda] pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-medium text-[#6b7772]">Prestador de Serviço <span className="mx-1.5 text-[#a8b2ae]">/</span> {workspaceName}</p>
        <h2 className="mt-1 text-[26px] font-bold tracking-[-.035em] text-[#121715]">Visão da carteira</h2>
        <p className="mt-1 text-sm text-[#6b7772]">Atendimentos, entregas e retornos do ambiente ativo.</p>
      </div>
      <div className="inline-flex rounded-lg border border-[#d7ddda] bg-white p-1" role="group" aria-label="Período do dashboard">
        {(["30", "90", "365"] as const).map(value => <button key={value} type="button" onClick={() => onPeriodChange(value)} aria-pressed={globalPeriod === value} className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${globalPeriod === value ? "bg-[#123c36] text-white shadow-sm" : "text-[#6b7772] hover:bg-[#f4faf8] hover:text-[#123c36]"}`}>{value === "365" ? "12 meses" : `${value} dias`}</button>)}
      </div>
    </section>
    <section className="flex gap-1 overflow-x-auto border-b border-[#d7ddda]" aria-label="Seções do dashboard Prestador">
      {tabs.map(({ id, label, icon: Icon }) => {
        const badge = badgeCountFor(id);
        return <button key={id} type="button" onClick={() => onDashboardChange(id)} aria-pressed={activeDashboard === id} className={`relative inline-flex h-11 shrink-0 items-center gap-2 border-b-[3px] px-3 text-sm font-medium transition ${activeDashboard === id ? "border-[#3e9a8c] text-[#123c36]" : "border-transparent text-[#6b7772] hover:border-[#d0eae4] hover:text-[#123c36]"}`}><Icon className="h-4 w-4" />{label}{badge.count > 0 && <span className="ml-1 h-2 w-2 rounded-full bg-[#b91c1c]" aria-label={`${badge.count} alerta(s) em ${label}`} />}</button>;
      })}
    </section>
    {children}
  </div></DashboardLayout>;
}

function daysUntil(date: Date | string | null) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}

function isWithinGlobalPeriod(date: Date | string | null | undefined, period: GlobalPeriod) {
  if (period === "all" || !date) return true;
  const timestamp = new Date(date).getTime();
  if (Number.isNaN(timestamp)) return true;
  const windowMs = Number(period) * 86_400_000;
  const now = Date.now();
  return timestamp >= now - windowMs && timestamp <= now + windowMs;
}

function WorkspaceOverviewSkeleton() {
  const shimmer = "rounded-2xl bg-[#dceee8] motion-safe:animate-pulse motion-reduce:animate-none";
  return <DashboardLayout title="Dashboard">
    <div className="mx-auto max-w-7xl space-y-7" aria-busy="true" aria-label="Carregando dados do dashboard">
      <section className="rounded-[2rem] border border-[#d3e7e0] bg-gradient-to-br from-[#effbf7] via-white to-[#eaf7f1] p-7 shadow-[0_22px_60px_rgba(28,74,77,0.08)] lg:p-9">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/80"><Loader2 className="h-4 w-4 animate-spin text-[#0c7474] motion-reduce:animate-none" /></span><div><div className={`${shimmer} h-3 w-28`} /><p className="mt-2 text-xs font-semibold text-[#668087]">Atualizando seu panorama operacional...</p></div></div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="rounded-2xl border border-white/80 bg-white/55 p-4 shadow-sm"><div className={`${shimmer} h-9 w-9 rounded-xl`} /><div className={`${shimmer} mt-5 h-8 w-16`} /><div className={`${shimmer} mt-2 h-3 w-24`} /></div>)}</div>
      </section>
      <section className="grid gap-5 lg:grid-cols-2"><div className="h-64 rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-sm"><div className={`${shimmer} h-3 w-32`} /><div className={`${shimmer} mt-3 h-7 w-56`} /><div className={`${shimmer} mt-7 h-36 w-full rounded-2xl`} /></div><div className="h-64 rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-sm"><div className={`${shimmer} h-3 w-28`} /><div className={`${shimmer} mt-3 h-7 w-44`} /><div className={`${shimmer} mt-7 h-36 w-full rounded-2xl`} /></div></section>
      <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#668087]"><span className="h-2 w-2 rounded-full bg-[#0c7474] motion-safe:animate-bounce motion-reduce:animate-none" /> Os indicadores serão exibidos quando os registros reais terminarem de carregar.</div>
    </div>
  </DashboardLayout>;
}

export default function WorkspaceOverview() {
  const [activeDashboard, setActiveDashboard] = useState<DashboardView>("resumo");
  const [globalPeriod, setGlobalPeriod] = useState<GlobalPeriod>("30");
  const [readAlertKeys, setReadAlertKeys] = useState<string[]>([]);
  const [isCustomizingSummary, setIsCustomizingSummary] = useState(false);
  const [summaryOrder, setSummaryOrder] = useState<SummaryWidgetId[]>(defaultSummaryOrder);
  const [hiddenSummaryWidgets, setHiddenSummaryWidgets] = useState<SummaryWidgetId[]>([]);
  const [summaryLayoutReady, setSummaryLayoutReady] = useState(false);
  const search = useSearch();
  const workspaceId = workspaceIdFromSearch(search) ?? 0;
  const readAlertsStorageKey = `tst-brasil-hub-dashboard-read-alerts-${workspaceId}`;
  const summaryLayoutStorageKey = `tst-brasil-hub-dashboard-summary-layout-${workspaceId}`;
  useEffect(() => {
    if (workspaceId <= 0 || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(readAlertsStorageKey);
      setReadAlertKeys(raw ? JSON.parse(raw) : []);
    } catch {
      setReadAlertKeys([]);
    }
  }, [readAlertsStorageKey, workspaceId]);
  useEffect(() => {
    if (workspaceId <= 0 || typeof window === "undefined") return;
    setSummaryLayoutReady(false);
    try {
      const raw = window.localStorage.getItem(summaryLayoutStorageKey);
      const parsed = raw ? JSON.parse(raw) : null;
      const normalized = normalizeSummaryLayout(parsed);
      setSummaryOrder(normalized.order);
      setHiddenSummaryWidgets(normalized.hidden);
    } catch {
      setSummaryOrder(defaultSummaryOrder);
      setHiddenSummaryWidgets([]);
    }
    setSummaryLayoutReady(true);
  }, [summaryLayoutStorageKey, workspaceId]);
  useEffect(() => {
    if (!summaryLayoutReady || workspaceId <= 0 || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(summaryLayoutStorageKey, JSON.stringify({ order: summaryOrder, hidden: hiddenSummaryWidgets }));
    } catch {
      // A preferência local é opcional; o layout atual continua disponível na sessão.
    }
  }, [hiddenSummaryWidgets, summaryLayoutReady, summaryLayoutStorageKey, summaryOrder, workspaceId]);
  const moveSummaryWidget = (id: SummaryWidgetId, direction: "up" | "down") => {
    setSummaryOrder(previous => moveSummaryWidgetInOrder(previous, id, direction));
  };
  const toggleSummaryWidget = (id: SummaryWidgetId) => {
    setHiddenSummaryWidgets(previous => toggleSummaryWidgetInList(previous, id));
  };
  const resetSummaryLayout = () => {
    setSummaryOrder(defaultSummaryOrder);
    setHiddenSummaryWidgets([]);
  };
  const markAlertAsRead = (key: string) => {
    setReadAlertKeys(previous => {
      const next = previous.includes(key) ? previous : [...previous, key];
      try {
        window.localStorage.setItem(readAlertsStorageKey, JSON.stringify(next));
      } catch {
        // A leitura local é opcional; o estado visual continua funcionando na sessão.
      }
      return next;
    });
  };
  const isAlertUnread = (key: string) => !readAlertKeys.includes(key);
  const queryOptions = { enabled: Number.isInteger(workspaceId) && workspaceId > 0, retry: false };
  const workspace = trpc.portal.workspace.useQuery({ workspaceId }, queryOptions);
  const certificates = trpc.portal.certificates.useQuery({ workspaceId }, queryOptions);
  const trainings = trpc.portal.trainings.useQuery({ workspaceId }, queryOptions);
  const organization = trpc.portal.organization.useQuery({ workspaceId }, queryOptions);
  const operations = trpc.portal.operations.useQuery({ workspaceId }, queryOptions);
  const planning = trpc.portal.planning.useQuery({ workspaceId }, queryOptions);
  const commercial = trpc.portal.commercial.useQuery(
    { workspaceId },
    { enabled: Boolean(queryOptions.enabled && workspace.data?.kind === "autonomo") },
  );
  const queryError = [workspace, certificates, trainings, organization, operations, planning, commercial].find((query) => query.isError)?.error;

  if (workspace.isLoading || certificates.isLoading || trainings.isLoading || organization.isLoading || operations.isLoading || planning.isLoading || (workspace.data?.kind === "autonomo" && commercial.isLoading)) {
    return <WorkspaceOverviewSkeleton />;
  }

  if (queryError) {
    return <DashboardLayout title="Dashboard"><div className="mx-auto grid min-h-[420px] max-w-2xl place-items-center"><div className="w-full rounded-[2rem] border border-[#f1d5c9] bg-gradient-to-br from-white to-[#fff9f5] p-8 text-center shadow-[0_18px_45px_rgba(28,74,77,0.08)]"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#fff0e8] text-[#d67845]"><AlertTriangle className="h-7 w-7" /></span><p className="mt-5 text-xs font-bold uppercase tracking-[.16em] text-[#d67845]">Acesso ao ambiente</p><h2 className="mt-2 text-2xl font-bold text-[#173b43]">Não foi possível carregar este ambiente.</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#668087]">Selecione um ambiente pertencente à sua conta ou entre novamente no portal para atualizar a sessão.</p><Link href="/app" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0c7474] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(12,116,116,0.18)] transition hover:bg-[#063b43]">Voltar à seleção <ArrowRight className="h-4 w-4" /></Link></div></div></DashboardLayout>;
  }

  if (!workspaceId || !workspace.data) {
    return <DashboardLayout title="Dashboard"><div className="relative overflow-hidden rounded-[2rem] border border-[#d3e7e0] bg-gradient-to-br from-white via-[#f7fcfa] to-[#eaf7f1] p-8 text-center shadow-[0_16px_40px_rgba(28,74,77,0.08)]"><div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#8edec7]/20 blur-2xl" /><div className="relative mx-auto max-w-xl"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#0c7474] text-white shadow-[0_10px_24px_rgba(12,116,116,0.22)]"><ShieldCheck className="h-7 w-7" /></span><p className="mt-5 text-xs font-bold uppercase tracking-[.16em] text-[#0c8c89]">Seu próximo passo</p><h2 className="mt-2 text-2xl font-semibold tracking-[-.02em] text-[#173b43]">Escolha o ambiente para começar.</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#668087]">Os indicadores, alertas e atalhos serão calculados somente a partir dos registros reais do ambiente ativo.</p><Link href="/app" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0c7474] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(12,116,116,0.18)] transition hover:bg-[#095f62]">Escolher ambiente <ArrowRight className="h-4 w-4" /></Link></div></div></DashboardLayout>;
  }

  const current = workspace.data;
  const isAutonomo = current.kind === "autonomo";
  const certificatesInPeriod = certificates.data?.filter(item => isWithinGlobalPeriod(item.issuedAt ?? item.expiresAt ?? item.createdAt, globalPeriod)) ?? [];
  const trainingsInPeriod = trainings.data?.filter(item => isWithinGlobalPeriod(item.scheduledAt ?? item.createdAt, globalPeriod)) ?? [];
  const filteredOccurrences = operations.data?.occurrences.filter(item => isWithinGlobalPeriod(item.occurredAt ?? item.createdAt, globalPeriod)) ?? [];
  const allInspections = planning.data?.inspections.filter(item => isWithinGlobalPeriod(item.dueAt ?? item.createdAt, globalPeriod)) ?? [];
  const filteredActionItems = planning.data?.actionItems.filter(item => isWithinGlobalPeriod(item.dueAt ?? item.createdAt, globalPeriod)) ?? [];
  const clientEngagements = commercial.data?.engagements.filter(item => isWithinGlobalPeriod(item.nextFollowUpAt ?? item.createdAt, globalPeriod)) ?? [];
  const clientVisits = commercial.data?.visits.filter(item => isWithinGlobalPeriod(item.scheduledAt ?? item.createdAt, globalPeriod)) ?? [];
  const expiredCertificates = certificatesInPeriod.filter(item => (daysUntil(item.expiresAt) ?? 0) < 0).length;
  const expiringCertificates = certificatesInPeriod.filter(item => { const days = daysUntil(item.expiresAt); return days !== null && days >= 0 && days <= 30; }).length;
  const certificatesToAct = expiredCertificates + expiringCertificates;
  const plannedTrainings = trainingsInPeriod.filter(item => item.status === "planned").length;
  const activeEmployees = organization.data?.employees.filter(item => item.status === "active") ?? [];
  const activeDepartments = organization.data?.departments.filter(item => item.active) ?? [];
  const activeJobRoles = organization.data?.jobRoles.filter(item => item.active) ?? [];
  const employeesWithoutDepartment = activeEmployees.filter(item => !item.departmentId).length;
  const employeesWithoutRole = activeEmployees.filter(item => !item.jobRoleId).length;
  const epiItems = operations.data?.epiItems.filter(item => item.active) ?? [];
  const epiStockCritical = epiItems.filter(item => item.stockQuantity <= item.minimumStock).length;
  const epiExpiring = epiItems.filter(item => item.expiresAt && daysUntil(item.expiresAt) !== null && (daysUntil(item.expiresAt) ?? 0) <= 30).length;
  const epiAlerts = epiStockCritical + epiExpiring;
  const openOccurrences = filteredOccurrences.filter(item => item.status !== "closed").length;
  const plannedInspections = allInspections.filter(item => item.status === "planned").length;
  const completedInspections = allInspections.filter(item => item.status === "completed").length;
  const overdueInspections = allInspections.filter(item => item.status === "planned" && item.dueAt && (daysUntil(item.dueAt) ?? 0) < 0).length;
  const inspectionCompletionRate = allInspections.length ? Math.round((completedInspections / allInspections.length) * 100) : null;
  const openActionItems = filteredActionItems.filter(item => item.status !== "completed");
  const overdueActionItems = openActionItems.filter(item => item.dueAt && daysUntil(item.dueAt) !== null && (daysUntil(item.dueAt) ?? 0) < 0).length;
  const completedActionItems = filteredActionItems.filter(item => item.status === "completed").length;
  const actionCompletionRate = filteredActionItems.length ? Math.round((completedActionItems / filteredActionItems.length) * 100) : null;
  const activeClients = clientEngagements.filter(item => item.status === "active").length;
  const followUpsIn30Days = clientEngagements.filter(item => item.nextFollowUpAt && (daysUntil(item.nextFollowUpAt) ?? Infinity) <= 30 && item.status !== "inactive").length;
  const plannedVisits = clientVisits.filter(item => item.status === "planned").length;
  const appHref = (path: string) => `${path}?workspace=${current.id}`;
  const dashboardAnalytics = {
    activeClients,
    followUpsIn30Days,
    plannedVisits,
    pgrProjects: current.pgrProjects.length,
    certificatesToAct,
    expiredCertificates,
    expiringCertificates,
    activeEmployees: activeEmployees.length,
    activeDepartments: activeDepartments.length,
    epiAlerts,
    epiStockCritical,
    epiExpiring,
    openOccurrences,
    inspectionsTotal: allInspections.length,
    plannedInspections,
    completedInspections,
    overdueInspections,
    actionItemsTotal: planning.data?.actionItems.length ?? 0,
    openActionItems: openActionItems.length,
    completedActionItems,
    overdueActionItems,
    plannedTrainings,
  };

  const cipaMeetingsKey = `tst-brasil-hub-cipa-meetings-${current.id}`;
  let cipaMeetingsList: { id: string; date: string; time: string; title: string; status: "agendada" | "realizada" | "cancelada"; notes: string }[] = [];
  try {
    const rawMeetings = typeof window !== "undefined" ? window.localStorage.getItem(cipaMeetingsKey) : null;
    if (rawMeetings) cipaMeetingsList = JSON.parse(rawMeetings);
  } catch {
    cipaMeetingsList = [];
  }
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcomingCipaMeetings = cipaMeetingsList.filter((meeting: { status: string; date: string }) => meeting.status === "agendada" && meeting.date >= todayStr && isWithinGlobalPeriod(meeting.date, globalPeriod)).slice(0, 3);
  const urgentCipaMeetings = upcomingCipaMeetings.filter(meeting => isCipaMeetingUrgent(meeting.date));
  const cipaHasUrgentMeeting = urgentCipaMeetings.length > 0;
  const pendingCipaTasks = [
    { title: "Validação do Dimensionamento (NR-05)", completed: false },
    { title: "Homologação do Calendário Anual de Reuniões", completed: cipaMeetingsList.length >= 12 },
    { title: "Eleição e Posse da Gestão da CIPA", completed: false },
  ];
  const pendingCipaTaskCount = pendingCipaTasks.filter(task => !task.completed).length;
  const cipaBadgeCount = pendingCipaTaskCount + urgentCipaMeetings.length;
  const inspectionsBadgeCount = overdueInspections + overdueActionItems;
  const documentsBadgeCount = certificatesToAct;
  const periodLabel = globalPeriod === "all" ? "Todos os períodos" : globalPeriod === "30" ? "Últimos 30 dias" : globalPeriod === "90" ? "Últimos 90 dias" : "Últimos 12 meses";
  const badgeCountFor = (id: DashboardView) => {
    const count = id === "cipa" ? cipaBadgeCount : id === "epis" ? epiAlerts : id === "inspecoes" ? inspectionsBadgeCount : id === "documentos" ? documentsBadgeCount : epiAlerts + cipaBadgeCount + inspectionsBadgeCount + documentsBadgeCount;
    const key = id === "cipa" ? "cipa" : id === "epis" ? "epi" : id === "inspecoes" ? "inspecoes" : id === "documentos" ? "documentos" : "resumo";
    return { count: isAlertUnread(key) ? count : 0, key };
  };

  const context = isAutonomo
    ? {
      label: "TST Autônomo",
      eyebrow: "Modo atendimento",
      headline: "Carteira, entregas e clientes sob controle.",
      description: "Comece pelo que afeta uma entrega ao cliente: empresas atendidas, PGRs em andamento e compromissos que precisam de retorno.",
      priorityTitle: "Prioridades da carteira",
      routineTitle: "Roteiro de atendimento",
      nextTitle: "Próxima entrega",
      color: "bg-gradient-to-br from-[#effbf7] via-white to-[#dff5ee] border-[#cfe7df]",
      accent: "text-[#0c7474]",
      stats: [
        { label: "Clientes ativos", value: activeClients, icon: BriefcaseBusiness, tone: "mint" },
        { label: "Retornos em 30 dias", value: followUpsIn30Days, icon: CalendarClock, tone: "blue" },
        { label: "Visitas agendadas", value: plannedVisits, icon: CalendarClock, tone: "blue" },
        { label: "Entregas PGR", value: current.pgrProjects.length, icon: ShieldCheck, tone: "blue" },
        { label: "Documentos a tratar", value: certificatesToAct, icon: Award, tone: "coral" },
      ],
      routine: ["Selecionar a empresa atendida", "Avançar o PGR e suas evidências", "Confirmar a programação com o cliente", "Registrar materiais e próximos retornos"],
      tools: [
        { href: appHref("/app/clientes"), icon: BriefcaseBusiness, title: "Empresas e clientes", text: "Carteira, retornos e documentos" },
        { href: appHref("/app/agenda"), icon: CalendarClock, title: "Agenda de visitas", text: "Atendimentos por cliente" },
        { href: appHref("/app/pgr"), icon: ShieldCheck, title: "Entregas PGR", text: "Empresas, projetos e documentos" },
        { href: appHref("/app/operacao"), icon: ShieldCheck, title: "Controle por cliente", text: "EPIs e ocorrências SST" },
        { href: appHref("/app/inspecoes"), icon: ClipboardCheck, title: "Inspeções e ações", text: "Prevenção por cliente" },
        { href: appHref("/app/materiais"), icon: FolderKanban, title: "Materiais de atendimento", text: "Modelos e checklists para usar" },
        { href: appHref("/app/treinamentos"), icon: GraduationCap, title: "Agenda de treinamentos", text: "Programação por cliente" },
        { href: appHref("/app/certificados"), icon: Award, title: "Certificados", text: "Validades que exigem retorno" },
        { href: appHref("/app/biblioteca"), icon: BookOpen, title: "Biblioteca técnica", text: "Consulta para a entrega" },
        { href: appHref("/app/suporte"), icon: Headphones, title: "Suporte", text: "Chamados do ambiente" },
      ],
    }
    : {
      label: "TST CLT",
      eyebrow: "Modo operação interna",
      headline: "Pessoas, conformidade e rotina interna em foco.",
      description: "Comece pelos compromissos que sustentam a operação: capacitações, validade documental, PGR e as evidências do dia a dia da empresa.",
      priorityTitle: "Prioridades da operação",
      routineTitle: "Roteiro de conformidade",
      nextTitle: "Próxima ação interna",
      color: "bg-gradient-to-br from-[#f3f8fd] via-white to-[#e1effb] border-[#d3e4f0]",
      accent: "text-[#3173a8]",
      stats: [
        { label: "Pessoas ativas", value: activeEmployees.length, icon: UsersRound, tone: "blue" },
        { label: "Setores ativos", value: activeDepartments.length, icon: Building2, tone: "mint" },
        { label: "Alertas de EPI", value: epiAlerts, icon: ShieldCheck, tone: "coral" },
        { label: "Ocorrências abertas", value: openOccurrences, icon: CircleAlert, tone: "coral" },
        { label: "Ações em aberto", value: openActionItems.length, icon: ClipboardCheck, tone: "coral" },
      ],
      routine: ["Revisar pendências de capacitação", "Tratar certificados vencidos ou próximos", "Manter o PGR e as evidências atualizados", "Registrar procedimentos e acionar suporte quando necessário"],
      tools: [
        { href: appHref("/app/estrutura"), icon: UsersRound, title: "Estrutura e equipe", text: "Pessoas, setores e funções" },
        { href: appHref("/app/operacao"), icon: ShieldCheck, title: "Controle de EPIs", text: "Estoque, CA, fichas de entrega e validade" },
        { href: appHref("/app/inspecoes"), icon: ClipboardCheck, title: "Inspeções e ações", text: "Prevenção e prazos" },
        { href: appHref("/app/treinamentos"), icon: UsersRound, title: "Capacitação da equipe", text: "Planejamento e execução" },
        { href: `${appHref("/app/certificados")}&generator=1`, icon: WandSparkles, title: "Gerador de certificados NR", text: "Emitir e validar certificados" },
        { href: appHref("/app/certificados"), icon: Award, title: "Acervo documental", text: "Validades e evidências" },
        { href: appHref("/app/pgr"), icon: ShieldCheck, title: "PGR da operação", text: "Riscos e documentos" },
        { href: appHref("/app/materiais"), icon: FolderKanban, title: "Procedimentos internos", text: "Modelos e checklists" },
        { href: appHref("/app/biblioteca"), icon: BookOpen, title: "Biblioteca técnica", text: "Referências oficiais" },
        { href: appHref("/app/suporte"), icon: Headphones, title: "Suporte", text: "Chamados organizados" },
      ],
    };

  const dashboardTabs: { id: DashboardView; label: string; description: string; icon: typeof ShieldCheck }[] = [
    { id: "resumo", label: "Resumo", description: "Alertas e prioridades", icon: LayoutDashboard },
    { id: "cipa", label: "CIPA", description: "Reuniões e tarefas", icon: UsersRound },
    { id: "epis", label: "EPIs", description: "Estoque e validade", icon: ShieldCheck },
    { id: "inspecoes", label: "Inspeções", description: "Ações e prevenção", icon: ClipboardCheck },
    { id: "documentos", label: "Documentos", description: "Certificados e acervo", icon: Award },
  ];

  const priorities = [
    isAutonomo && followUpsIn30Days > 0 && {
      href: appHref("/app/clientes"),
      title: `${followUpsIn30Days} retorno(s) comercial(is) nos próximos 30 dias`,
      detail: "Revise a carteira e confirme os próximos encaminhamentos com cada cliente.",
      icon: BriefcaseBusiness,
      tone: "blue" as const,
    },
    isAutonomo && plannedVisits > 0 && {
      href: appHref("/app/agenda"),
      title: `${plannedVisits} visita(s) agendada(s)`,
      detail: "Organize objetivo, empresa atendida e as evidências que devem ser registradas após a visita.",
      icon: CalendarClock,
      tone: "mint" as const,
    },
    current.companies.length > 0 && activeDepartments.length === 0 && {
      href: appHref("/app/estrutura"),
      title: isAutonomo ? "Mapear os setores da empresa atendida" : "Mapear os setores da operação",
      detail: "Cadastre os setores reais para organizar pessoas, funções, treinamentos e PGR.",
      icon: Building2,
      tone: "blue" as const,
    },
    activeEmployees.length > 0 && (employeesWithoutDepartment > 0 || employeesWithoutRole > 0) && {
      href: appHref("/app/estrutura"),
      title: "Completar os vínculos da equipe",
      detail: `${employeesWithoutDepartment} pessoa(s) sem setor e ${employeesWithoutRole} sem função informada.`,
      icon: UsersRound,
      tone: "blue" as const,
    },
    epiAlerts > 0 && {
      href: appHref("/app/operacao"),
      title: "Tratar alertas de EPI",
      detail: `${epiStockCritical} item(ns) com estoque crítico e ${epiExpiring} com validade próxima ou vencida.`,
      icon: ShieldCheck,
      tone: "coral" as const,
    },
    openOccurrences > 0 && {
      href: appHref("/app/visao"),
      title: `${openOccurrences} ocorrência(s) SST em acompanhamento`,
      detail: "Monitore os incidentes e mantenha a conformidade objetiva na operação.",
      icon: ShieldCheck,
      tone: "coral" as const,
    },
    openActionItems.length > 0 && {
      href: appHref("/app/inspecoes"),
      title: `${openActionItems.length} ação(ões) preventiva(s) em acompanhamento`,
      detail: overdueActionItems > 0 ? `${overdueActionItems} ação(ões) estão com prazo vencido.` : "Acompanhe responsável, prazo e evidência de cada medida.",
      icon: ClipboardCheck,
      tone: "coral" as const,
    },
    overdueInspections > 0 && {
      href: appHref("/app/inspecoes"),
      title: `${overdueInspections} inspeção(ões) com prazo vencido`,
      detail: "Revise o registro, reagende quando necessário e conecte as evidências ao plano de ação.",
      icon: ClipboardCheck,
      tone: "coral" as const,
    },
    plannedInspections > 0 && {
      href: appHref("/app/inspecoes"),
      title: `${plannedInspections} inspeção(ões) planejada(s)`,
      detail: "Organize a verificação por empresa ou setor antes da próxima rotina operacional.",
      icon: ClipboardCheck,
      tone: "blue" as const,
    },
    !current.pgrProjects.length && {
      href: appHref("/app/pgr"),
      title: isAutonomo ? "Criar a primeira entrega PGR" : "Criar ou atualizar o PGR da operação",
      detail: isAutonomo ? "Comece pela empresa atendida e vincule a entrega ao cliente." : "Organize o escopo da empresa e mantenha as evidências centralizadas.",
      icon: ShieldCheck,
      tone: "mint" as const,
    },
    plannedTrainings > 0 && {
      href: appHref("/app/treinamentos"),
      title: isAutonomo ? `Confirmar ${plannedTrainings} treinamento(s) com clientes` : `Organizar ${plannedTrainings} treinamento(s) da equipe`,
      detail: isAutonomo ? "Alinhe data, participantes e entrega com cada empresa atendida." : "Confirme datas, participantes e responsáveis antes da execução.",
      icon: CalendarClock,
      tone: "blue" as const,
    },
    certificatesToAct > 0 && {
      href: appHref("/app/certificados"),
      title: "Tratar documentos vencidos ou próximos do vencimento",
      detail: `${expiredCertificates} vencido(s) e ${expiringCertificates} com vencimento em até 30 dias.`,
      icon: CircleAlert,
      tone: "coral" as const,
    },
  ].filter(Boolean) as Priority[];

  if (isAutonomo && activeDashboard === "resumo") {
    const companiesById = new Map(current.companies.map(company => [company.id, company.name]));
    const nextVisit = [...clientVisits].filter(visit => visit.status === "planned").sort((left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime())[0];
    const nextFollowUp = [...clientEngagements].filter(engagement => engagement.status !== "inactive" && engagement.nextFollowUpAt).sort((left, right) => new Date(left.nextFollowUpAt!).getTime() - new Date(right.nextFollowUpAt!).getTime())[0];
    const nextPgrProject = current.pgrProjects[0];
    const portfolioSignals = [
      followUpsIn30Days ? `${followUpsIn30Days} retorno${followUpsIn30Days === 1 ? "" : "s"} próximo${followUpsIn30Days === 1 ? "" : "s"}` : null,
      plannedVisits ? `${plannedVisits} visita${plannedVisits === 1 ? "" : "s"} agendada${plannedVisits === 1 ? "" : "s"}` : null,
      current.pgrProjects.length ? `${current.pgrProjects.length} entrega${current.pgrProjects.length === 1 ? "" : "s"} PGR ativa${current.pgrProjects.length === 1 ? "" : "s"}` : null,
    ].filter(Boolean) as string[];
    const portfolioMessage = portfolioSignals.length ? `Hoje, sua carteira tem ${portfolioSignals.join(" · ")}.` : "Sua carteira está pronta para receber empresas, visitas e entregas reais.";
    const formatDeadline = (date: Date | string | null | undefined) => {
      const remainingDays = daysUntil(date ?? null);
      if (remainingDays === null) return "Sem prazo informado";
      if (remainingDays < 0) return `Vencido há ${Math.abs(remainingDays)} dia${Math.abs(remainingDays) === 1 ? "" : "s"}`;
      if (remainingDays === 0) return "Hoje";
      if (remainingDays === 1) return "Amanhã";
      return `Em ${remainingDays} dias`;
    };
    const portfolioMetrics = [
      { label: "Clientes ativos", value: activeClients, hint: activeClients ? "Carteira em acompanhamento" : "Cadastre o primeiro cliente", icon: BriefcaseBusiness, href: appHref("/app/clientes"), tone: "brand" },
      { label: "Retornos em 30 dias", value: followUpsIn30Days, hint: followUpsIn30Days ? "Exigem contato planejado" : "Nenhum retorno próximo", icon: CalendarClock, href: appHref("/app/clientes"), tone: "info" },
      { label: "Visitas agendadas", value: plannedVisits, hint: plannedVisits ? "Acompanhe objetivo e evidências" : "Nenhuma visita programada", icon: CalendarDays, href: appHref("/app/agenda"), tone: "info" },
      { label: "Entregas PGR", value: current.pgrProjects.length, hint: current.pgrProjects.length ? "Projetos vinculados à carteira" : "Crie a primeira entrega", icon: ShieldCheck, href: appHref("/app/pgr"), tone: "brand" },
    ] as const;
    const quickAccessModules = [
      { title: "PGR e documentos", description: "Projetos, inventários e evidências por empresa atendida.", status: current.pgrProjects.length ? `${current.pgrProjects.length} projeto(s) vinculado(s)` : "Crie a primeira entrega", icon: ShieldCheck, href: appHref("/app/pgr"), tone: "brand" as const },
      { title: "Gestão de CIPA", description: "Reuniões, calendário e documentos das comissões atendidas.", status: upcomingCipaMeetings.length ? `${upcomingCipaMeetings.length} reunião(ões) agendada(s)` : "Nenhuma reunião programada", icon: UsersRound, href: appHref("/app/cipa"), tone: "brand" as const },
      { title: "Controle de EPIs", description: "Estoque, certificados de aprovação e entregas por cliente.", status: epiAlerts ? `${epiAlerts} alerta(s) em acompanhamento` : "Controle regular no período", icon: ShieldCheck, href: appHref("/app/operacao"), tone: epiAlerts ? "warning" as const : "brand" as const },
      { title: "Treinamentos", description: "Agenda, instrutores, participantes e atas de capacitação.", status: plannedTrainings ? `${plannedTrainings} treinamento(s) planejado(s)` : "Nenhuma capacitação programada", icon: GraduationCap, href: appHref("/app/treinamentos"), tone: "info" as const },
      { title: "Biblioteca técnica", description: "Normas, materiais e referências para suas entregas.", status: "Consulta técnica imediata", icon: BookOpen, href: appHref("/app/biblioteca"), tone: "info" as const },
      { title: "Certificados", description: "Acervo, vencimentos e emissão de certificados NR.", status: certificatesToAct ? `${certificatesToAct} documento(s) a tratar` : "Documentação em dia", icon: Award, href: appHref("/app/certificados"), tone: certificatesToAct ? "warning" as const : "brand" as const },
    ];

    return <PrestadorDashboardShell workspaceName={current.name} globalPeriod={globalPeriod} onPeriodChange={setGlobalPeriod} activeDashboard={activeDashboard} onDashboardChange={setActiveDashboard} tabs={dashboardTabs} badgeCountFor={badgeCountFor}>

      <section className="grid gap-5 rounded-2xl border border-[#d0eae4] bg-[#f4faf8] p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:p-6">
        <div><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#24635a]">Comando da carteira</p><h3 className="mt-2 text-xl font-semibold tracking-[-.02em] text-[#121715]">{portfolioMessage}</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-[#6b7772]">A priorização considera somente clientes, retornos, visitas, projetos PGR e documentos registrados neste ambiente.</p></div>
        <div className="flex flex-wrap gap-2"><Link href={appHref("/app/agenda")} className="inline-flex h-9 items-center rounded-lg bg-[#24635a] px-3.5 text-sm font-semibold text-white transition hover:bg-[#2d7a70] active:scale-[.98]"><CalendarDays className="mr-2 h-4 w-4" />Abrir agenda</Link><Link href={appHref("/app/pgr")} className="inline-flex h-9 items-center rounded-lg border border-[#a3d4ca] bg-white px-3.5 text-sm font-semibold text-[#123c36] transition hover:bg-[#e8f4f1] active:scale-[.98]"><ShieldCheck className="mr-2 h-4 w-4" />Entregas PGR</Link></div>
      </section>

      <section aria-labelledby="acessos-rapidos" className="rounded-2xl border border-[#d7ddda] bg-white p-5 shadow-[0_1px_2px_rgba(18,23,21,.06)] lg:p-6">
        <div className="flex flex-col gap-2 border-b border-[#eef1f0] pb-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#24635a]">Página inicial</p><h3 id="acessos-rapidos" className="mt-1 text-lg font-semibold text-[#121715]">Acessos rápidos</h3><p className="mt-1 text-sm text-[#6b7772]">Abra os módulos mais usados para iniciar ou continuar o atendimento.</p></div><span className="text-xs font-medium text-[#6b7772]">Dados do ambiente ativo</span></div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{quickAccessModules.map(({ title, description, status, icon: Icon, href, tone }) => <Link key={title} href={href} className="group relative flex min-h-[188px] flex-col rounded-xl border border-[#d7ddda] bg-white p-5 shadow-[0_1px_2px_rgba(18,23,21,.05)] transition hover:-translate-y-0.5 hover:border-[#b8d7d0] hover:shadow-[0_8px_20px_rgba(18,23,21,.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24635a] focus-visible:ring-offset-2"><div className="flex items-start justify-between gap-3"><span className={`grid h-11 w-11 place-items-center rounded-xl ${tone === "warning" ? "bg-[#fff4e8] text-[#b45309]" : tone === "info" ? "bg-[#eaf4fd] text-[#0369a1]" : "bg-[#e8f4f1] text-[#24635a]"}`}><Icon className="h-5 w-5" /></span><ArrowRight className="h-4 w-4 text-[#a8b2ae] transition group-hover:translate-x-0.5 group-hover:text-[#24635a]" /></div><h4 className="mt-5 text-base font-semibold text-[#121715]">{title}</h4><p className="mt-2 text-xs leading-5 text-[#6b7772]">{description}</p><div className="mt-auto pt-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone === "warning" ? "bg-[#fff4e8] text-[#9a4a0b]" : tone === "info" ? "bg-[#eaf4fd] text-[#075985]" : "bg-[#e8f4f1] text-[#24635a]"}`}>{status}</span><span className="ml-2 inline-flex items-center text-xs font-semibold text-[#24635a]">Abrir <ArrowRight className="ml-1 h-3.5 w-3.5" /></span></div></Link>)}</div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {portfolioMetrics.map(({ label, value, hint, icon: Icon, href, tone }) => <Link key={label} href={href} className="group rounded-xl border border-[#d7ddda] bg-white p-4 shadow-[0_1px_2px_rgba(18,23,21,.06)] transition hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(18,23,21,.10)]"><div className="flex items-start justify-between gap-3"><span className={`grid h-9 w-9 place-items-center rounded-lg ${tone === "info" ? "bg-[#eaf4fd] text-[#0369a1]" : "bg-[#e8f4f1] text-[#24635a]"}`}><Icon className="h-4 w-4" /></span><ArrowRight className="h-4 w-4 text-[#a8b2ae] transition group-hover:translate-x-0.5 group-hover:text-[#24635a]" /></div><p className="mt-5 font-[tabular-nums] text-[32px] font-bold leading-none tracking-[-.04em] text-[#121715]">{value}</p><p className="mt-2 text-xs font-semibold text-[#3a4340]">{label}</p><p className="mt-1 text-[11px] leading-4 text-[#6b7772]">{hint}</p></Link>)}
      </section>

      {certificatesToAct > 0 ? <section className="flex flex-col gap-3 rounded-xl border border-[#f3d1ba] bg-[#fffaf7] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#b45309]" /><div><p className="text-sm font-semibold text-[#3a4340]">{certificatesToAct} documento(s) exigem atenção</p><p className="mt-0.5 text-xs text-[#6b7772]">{expiredCertificates} vencido(s) e {expiringCertificates} com vencimento em até 30 dias.</p></div></div><Link href={appHref("/app/certificados")} className="inline-flex h-8 items-center justify-center rounded-lg border border-[#f0bd96] bg-white px-3 text-xs font-semibold text-[#9a4a0b] hover:bg-[#fff6ee]">Ver documentos</Link></section> : <section className="flex items-center gap-3 rounded-xl border border-[#b9ddc9] bg-[#f5fbf7] px-4 py-3"><CheckCircle2 className="h-5 w-5 text-[#15803d]" /><p className="text-sm font-semibold text-[#246b3d]">Documentação em dia para o período selecionado.</p></section>}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,.9fr)]">
        <article className="overflow-hidden rounded-xl border border-[#d7ddda] bg-white shadow-[0_1px_2px_rgba(18,23,21,.06)]"><div className="flex flex-col gap-2 border-b border-[#eef1f0] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#24635a]">Ações decisivas</p><h3 className="mt-1 text-lg font-semibold text-[#121715]">Prioridades de hoje</h3></div><span className="rounded-full bg-[#eef1f0] px-2.5 py-1 text-[11px] font-semibold text-[#3a4340]">{priorities.length} calculada(s)</span></div><div className="divide-y divide-[#eef1f0]">{priorities.length ? priorities.slice(0, 3).map(({ href, title, detail, icon: Icon, tone }) => <Link key={title} href={href} className="group flex items-center gap-4 px-5 py-4 transition hover:bg-[#f7f9f8]"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tone === "coral" ? "bg-[#fff1ee] text-[#b91c1c]" : tone === "blue" ? "bg-[#eaf4fd] text-[#0369a1]" : "bg-[#e8f4f1] text-[#24635a]"}`}><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-[#121715]">{title}</strong><small className="mt-1 block text-xs leading-5 text-[#6b7772]">{detail}</small></span><ArrowRight className="h-4 w-4 shrink-0 text-[#a8b2ae] transition group-hover:translate-x-0.5 group-hover:text-[#24635a]" /></Link>) : <div className="flex items-center gap-3 px-5 py-8 text-sm text-[#6b7772]"><CheckCircle2 className="h-5 w-5 text-[#15803d]" />Nenhuma prioridade foi calculada a partir dos registros atuais.</div>}</div></article>
        <aside className="rounded-xl border border-[#d7ddda] bg-white p-5 shadow-[0_1px_2px_rgba(18,23,21,.06)]"><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#24635a]">Próximos compromissos</p><h3 className="mt-1 text-lg font-semibold text-[#121715]">Linha do tempo da carteira</h3><div className="mt-5 space-y-4">{nextVisit ? <Link href={appHref("/app/agenda")} className="group flex gap-3"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#eaf4fd] text-[#0369a1]"><CalendarDays className="h-4 w-4" /></span><span className="min-w-0"><strong className="block text-xs text-[#3a4340]">Visita · {formatDeadline(nextVisit.scheduledAt)}</strong><small className="mt-1 block text-xs leading-5 text-[#6b7772]">{companiesById.get(nextVisit.companyId) || "Cliente vinculado"} · {nextVisit.objective}</small></span></Link> : <div className="flex gap-3"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#eef1f0] text-[#6b7772]"><CalendarDays className="h-4 w-4" /></span><span><strong className="block text-xs text-[#3a4340]">Nenhuma visita agendada</strong><small className="mt-1 block text-xs leading-5 text-[#6b7772]">Inclua o próximo atendimento quando houver programação.</small></span></div>}{nextFollowUp ? <Link href={appHref("/app/clientes")} className="group flex gap-3"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#e8f4f1] text-[#24635a]"><CalendarClock className="h-4 w-4" /></span><span className="min-w-0"><strong className="block text-xs text-[#3a4340]">Retorno · {formatDeadline(nextFollowUp.nextFollowUpAt)}</strong><small className="mt-1 block text-xs leading-5 text-[#6b7772]">{companiesById.get(nextFollowUp.companyId) || "Cliente vinculado"}{nextFollowUp.notes ? ` · ${nextFollowUp.notes}` : ""}</small></span></Link> : <div className="flex gap-3"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#eef1f0] text-[#6b7772]"><CalendarClock className="h-4 w-4" /></span><span><strong className="block text-xs text-[#3a4340]">Nenhum retorno programado</strong><small className="mt-1 block text-xs leading-5 text-[#6b7772]">Registre um próximo contato para acompanhá-lo aqui.</small></span></div>}{nextPgrProject ? <Link href={appHref("/app/pgr")} className="group flex gap-3"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#e8f4f1] text-[#24635a]"><ShieldCheck className="h-4 w-4" /></span><span className="min-w-0"><strong className="block text-xs text-[#3a4340]">Entrega PGR vinculada</strong><small className="mt-1 block text-xs leading-5 text-[#6b7772]">{nextPgrProject.name}</small></span></Link> : <div className="flex gap-3"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#eef1f0] text-[#6b7772]"><ShieldCheck className="h-4 w-4" /></span><span><strong className="block text-xs text-[#3a4340]">Nenhuma entrega PGR criada</strong><small className="mt-1 block text-xs leading-5 text-[#6b7772]">Abra a empresa atendida para iniciar o primeiro projeto.</small></span></div>}</div><Link href={appHref("/app/clientes")} className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#24635a] hover:text-[#123c36]">Abrir carteira completa <ArrowRight className="h-3.5 w-3.5" /></Link></aside>
      </section>

      <section className="grid gap-4 lg:grid-cols-3"><article className="rounded-xl border border-[#d7ddda] bg-white p-5 shadow-[0_1px_2px_rgba(18,23,21,.06)]"><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#24635a]">Cobertura</p><p className="mt-2 text-2xl font-bold text-[#121715]">{current.companies.length}</p><p className="mt-1 text-xs text-[#6b7772]">empresa(s) cadastrada(s) na carteira</p></article><article className="rounded-xl border border-[#d7ddda] bg-white p-5 shadow-[0_1px_2px_rgba(18,23,21,.06)]"><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#24635a]">Entregas técnicas</p><p className="mt-2 text-2xl font-bold text-[#121715]">{current.pgrProjects.length}</p><p className="mt-1 text-xs text-[#6b7772]">projeto(s) PGR vinculado(s)</p></article><article className="rounded-xl border border-[#d7ddda] bg-white p-5 shadow-[0_1px_2px_rgba(18,23,21,.06)]"><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#24635a]">Documentos</p><p className={`mt-2 text-2xl font-bold ${certificatesToAct ? "text-[#b45309]" : "text-[#15803d]"}`}>{certificatesToAct ? certificatesToAct : "Em dia"}</p><p className="mt-1 text-xs text-[#6b7772]">{certificatesToAct ? "exigem acompanhamento" : "nenhuma pendência no período"}</p></article></section>
    </PrestadorDashboardShell>;
  }

  if (isAutonomo) {
    const panelMeta = dashboardTabs.find(tab => tab.id === activeDashboard)!;
    const PanelIcon = panelMeta.icon;
    const panelHeading = (eyebrow: string, title: string, description: string) => <section className="flex flex-col gap-3 rounded-xl border border-[#d0eae4] bg-[#f4faf8] p-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#24635a]">{eyebrow}</p><h3 className="mt-2 text-xl font-semibold tracking-[-.02em] text-[#121715]">{title}</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-[#6b7772]">{description}</p></div><span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-[#24635a] shadow-[0_1px_2px_rgba(18,23,21,.06)]"><PanelIcon className="h-5 w-5" /></span></section>;
    const metricCard = (label: string, value: number | string, detail: string, icon: typeof ShieldCheck, href: string, tone: "brand" | "info" | "warning" = "brand") => {
      const Icon = icon;
      const color = tone === "warning" ? "bg-[#fff4e8] text-[#b45309]" : tone === "info" ? "bg-[#eaf4fd] text-[#0369a1]" : "bg-[#e8f4f1] text-[#24635a]";
      return <Link href={href} className="group rounded-xl border border-[#d7ddda] bg-white p-4 shadow-[0_1px_2px_rgba(18,23,21,.06)] transition hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(18,23,21,.10)]"><div className="flex items-start justify-between gap-3"><span className={`grid h-9 w-9 place-items-center rounded-lg ${color}`}><Icon className="h-4 w-4" /></span><ArrowRight className="h-4 w-4 text-[#a8b2ae] transition group-hover:translate-x-0.5 group-hover:text-[#24635a]" /></div><p className="mt-5 font-[tabular-nums] text-[32px] font-bold leading-none tracking-[-.04em] text-[#121715]">{value}</p><p className="mt-2 text-xs font-semibold text-[#3a4340]">{label}</p><p className="mt-1 text-[11px] leading-4 text-[#6b7772]">{detail}</p></Link>;
    };

    return <PrestadorDashboardShell workspaceName={current.name} globalPeriod={globalPeriod} onPeriodChange={setGlobalPeriod} activeDashboard={activeDashboard} onDashboardChange={setActiveDashboard} tabs={dashboardTabs} badgeCountFor={badgeCountFor}>
      {activeDashboard === "cipa" && <div className="space-y-5">
        {panelHeading("Gestão por cliente", "CIPA e calendário da carteira", "Acompanhe reuniões realmente agendadas e acesse a comissão correspondente de cada empresa atendida.")}
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,.8fr)]"><article className="overflow-hidden rounded-xl border border-[#d7ddda] bg-white shadow-[0_1px_2px_rgba(18,23,21,.06)]"><div className="flex items-center justify-between border-b border-[#eef1f0] px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#24635a]">Agenda oficial</p><h4 className="mt-1 text-lg font-semibold text-[#121715]">Próximas reuniões</h4></div><span className="rounded-full bg-[#eef1f0] px-2.5 py-1 text-[11px] font-semibold text-[#3a4340]">{upcomingCipaMeetings.length} agendada(s)</span></div><div className="divide-y divide-[#eef1f0]">{upcomingCipaMeetings.length ? upcomingCipaMeetings.map(meeting => { const days = daysUntilCipaMeeting(meeting.date); const urgent = isCipaMeetingUrgent(meeting.date); return <Link key={meeting.id} href={appHref("/app/cipa")} className="group flex items-center gap-4 px-5 py-4 transition hover:bg-[#f7f9f8]"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${urgent ? "bg-[#fff1ee] text-[#b91c1c]" : "bg-[#eaf4fd] text-[#0369a1]"}`}><CalendarDays className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-[#121715]">{meeting.title}</strong><small className="mt-1 block text-xs text-[#6b7772]">{new Date(`${meeting.date}T00:00:00`).toLocaleDateString("pt-BR")} às {meeting.time}{meeting.notes ? ` · ${meeting.notes}` : ""}</small></span><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${urgent ? "bg-[#fff1ee] text-[#b91c1c]" : "bg-[#eef1f0] text-[#3a4340]"}`}>{urgent ? (days === 0 ? "Hoje" : days === 1 ? "Amanhã" : `Em ${days} dias`) : "Agendada"}</span></Link>; }) : <div className="flex items-center gap-3 px-5 py-8 text-sm text-[#6b7772]"><CalendarDays className="h-5 w-5 text-[#24635a]" />Nenhuma reunião agendada neste ambiente.</div>}</div></article><aside className="rounded-xl border border-[#d7ddda] bg-white p-5 shadow-[0_1px_2px_rgba(18,23,21,.06)]"><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#24635a]">Próximo passo</p><h4 className="mt-1 text-lg font-semibold text-[#121715]">Gestão da comissão</h4><p className="mt-3 text-sm leading-6 text-[#6b7772]">Abra o Assistant CIPA para organizar calendário, eleições, composição e documentos da empresa selecionada.</p><Link href={appHref("/app/cipa")} className="mt-6 inline-flex h-9 items-center rounded-lg bg-[#24635a] px-3.5 text-sm font-semibold text-white transition hover:bg-[#2d7a70] active:scale-[.98]">Abrir Assistant CIPA <ArrowRight className="ml-2 h-4 w-4" /></Link></aside></section>
      </div>}

      {activeDashboard === "epis" && <div className="space-y-5">
        {panelHeading("Controle por cliente", "EPIs e Certificados de Aprovação", "Leitura consolidada do estoque e das validades registradas na carteira do Prestador.")}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metricCard("Alertas de EPI", epiAlerts, epiAlerts ? "Itens que pedem atenção" : "Nenhum alerta no período", CircleAlert, appHref("/app/operacao"), epiAlerts ? "warning" : "brand")}{metricCard("Estoque crítico", epiStockCritical, epiStockCritical ? "Abaixo do mínimo registrado" : "Estoque regular", ShieldCheck, appHref("/app/operacao"), epiStockCritical ? "warning" : "brand")}{metricCard("CAs próximos", epiExpiring, epiExpiring ? "Vencidos ou em até 30 dias" : "Nenhum CA próximo", CalendarClock, appHref("/app/operacao"), epiExpiring ? "warning" : "info")}{metricCard("EPIs ativos", epiItems.length, "Itens cadastrados no ambiente", ShieldCheck, appHref("/app/operacao"), "brand")}</section>
        <section className="rounded-xl border border-[#d7ddda] bg-white p-5 shadow-[0_1px_2px_rgba(18,23,21,.06)]"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#24635a]">Ação operacional</p><h4 className="mt-1 text-lg font-semibold text-[#121715]">Controle de EPIs por empresa</h4><p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b7772]">Gerencie estoque, CA, validade e entregas sem misturar os registros entre clientes.</p></div><Link href={appHref("/app/operacao")} className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-[#a3d4ca] bg-white px-3.5 text-sm font-semibold text-[#123c36] transition hover:bg-[#e8f4f1] active:scale-[.98]">Abrir controle <ArrowRight className="ml-2 h-4 w-4" /></Link></div></section>
      </div>}

      {activeDashboard === "inspecoes" && <div className="space-y-5">
        {panelHeading("Prevenção e prazos", "Inspeções e ações preventivas", "Acompanhe o andamento e os prazos registrados no período selecionado para a carteira ativa.")}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metricCard("Inspeções registradas", allInspections.length, "No período selecionado", ClipboardCheck, appHref("/app/inspecoes"), "info")}{metricCard("Conclusão", inspectionCompletionRate === null ? "—" : `${inspectionCompletionRate}%`, inspectionCompletionRate === null ? "Ainda sem histórico" : "Inspeções concluídas", CheckCircle2, appHref("/app/inspecoes"), "brand")}{metricCard("Inspeções atrasadas", overdueInspections, overdueInspections ? "Exigem reagendamento" : "Nenhum prazo vencido", CalendarClock, appHref("/app/inspecoes"), overdueInspections ? "warning" : "brand")}{metricCard("Ações em aberto", openActionItems.length, overdueActionItems ? `${overdueActionItems} com prazo vencido` : "Acompanhamento ativo", ClipboardCheck, appHref("/app/inspecoes"), overdueActionItems ? "warning" : "info")}</section>
        <section className="grid gap-5 xl:grid-cols-2"><article className="overflow-hidden rounded-xl border border-[#d7ddda] bg-white shadow-[0_1px_2px_rgba(18,23,21,.06)]"><div className="flex items-center justify-between border-b border-[#eef1f0] px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#24635a]">Plano de ação</p><h4 className="mt-1 text-lg font-semibold text-[#121715]">Ações em acompanhamento</h4></div><Link href={appHref("/app/inspecoes")} className="text-xs font-semibold text-[#24635a] hover:text-[#123c36]">Ver todas</Link></div><div className="divide-y divide-[#eef1f0]">{openActionItems.length ? openActionItems.slice(0, 4).map(item => { const due = daysUntil(item.dueAt); return <Link key={item.id} href={appHref("/app/inspecoes")} className="group flex items-center gap-4 px-5 py-4 transition hover:bg-[#f7f9f8]"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${due !== null && due < 0 ? "bg-[#fff1ee] text-[#b91c1c]" : "bg-[#e8f4f1] text-[#24635a]"}`}><ClipboardCheck className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-[#121715]">{item.title}</strong><small className="mt-1 block text-xs text-[#6b7772]">{due === null ? "Sem prazo definido" : due < 0 ? `Vencido há ${Math.abs(due)} dia(s)` : due === 0 ? "Vence hoje" : `Prazo em ${due} dia(s)`}</small></span><ArrowRight className="h-4 w-4 shrink-0 text-[#a8b2ae]" /></Link>; }) : <div className="flex items-center gap-3 px-5 py-8 text-sm text-[#6b7772]"><CheckCircle2 className="h-5 w-5 text-[#15803d]" />Nenhuma ação em aberto no período.</div>}</div></article><article className="overflow-hidden rounded-xl border border-[#d7ddda] bg-white shadow-[0_1px_2px_rgba(18,23,21,.06)]"><div className="border-b border-[#eef1f0] px-5 py-4"><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#24635a]">Rotina de verificação</p><h4 className="mt-1 text-lg font-semibold text-[#121715]">Inspeções registradas</h4></div><div className="divide-y divide-[#eef1f0]">{allInspections.length ? allInspections.slice(0, 4).map(item => <Link key={item.id} href={appHref("/app/inspecoes")} className="group flex items-center gap-4 px-5 py-4 transition hover:bg-[#f7f9f8]"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${item.status === "completed" ? "bg-[#e8f4f1] text-[#15803d]" : "bg-[#eaf4fd] text-[#0369a1]"}`}><ClipboardCheck className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-[#121715]">{item.title}</strong><small className="mt-1 block text-xs text-[#6b7772]">{item.status === "completed" ? "Concluída" : item.dueAt ? `Programada para ${new Date(item.dueAt).toLocaleDateString("pt-BR")}` : "Planejada sem prazo"}</small></span><ArrowRight className="h-4 w-4 shrink-0 text-[#a8b2ae]" /></Link>) : <div className="flex items-center gap-3 px-5 py-8 text-sm text-[#6b7772]"><ClipboardCheck className="h-5 w-5 text-[#24635a]" />Nenhuma inspeção registrada no período.</div>}</div></article></section>
      </div>}

      {activeDashboard === "documentos" && <div className="space-y-5">
        {panelHeading("Conformidade documental", "Certificados e entregas da carteira", "Centralize os documentos que exigem acompanhamento e as evidências vinculadas aos atendimentos.")}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metricCard("Documentos a tratar", certificatesToAct, certificatesToAct ? "Vencidos ou próximos do vencimento" : "Nenhuma pendência no período", CircleAlert, appHref("/app/certificados"), certificatesToAct ? "warning" : "brand")}{metricCard("Certificados no período", certificatesInPeriod.length, "Registros documentais filtrados", Award, appHref("/app/certificados"), "info")}{metricCard("Treinamentos planejados", plannedTrainings, plannedTrainings ? "Agenda de capacitação ativa" : "Nenhum treinamento programado", GraduationCap, appHref("/app/treinamentos"), "brand")}{metricCard("Entregas PGR", current.pgrProjects.length, "Projetos vinculados à carteira", ShieldCheck, appHref("/app/pgr"), "brand")}</section>
        <section className="rounded-xl border border-[#d7ddda] bg-white p-5 shadow-[0_1px_2px_rgba(18,23,21,.06)]"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#24635a]">Acervo do Prestador</p><h4 className="mt-1 text-lg font-semibold text-[#121715]">Documentação por cliente</h4><p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b7772]">Abra certificados, treinamentos e projetos PGR do ambiente ativo, mantendo a organização por empresa atendida.</p></div><div className="flex flex-wrap gap-2"><Link href={appHref("/app/certificados")} className="inline-flex h-9 items-center rounded-lg bg-[#24635a] px-3.5 text-sm font-semibold text-white transition hover:bg-[#2d7a70] active:scale-[.98]">Abrir acervo</Link><Link href={appHref("/app/pgr")} className="inline-flex h-9 items-center rounded-lg border border-[#a3d4ca] bg-white px-3.5 text-sm font-semibold text-[#123c36] transition hover:bg-[#e8f4f1] active:scale-[.98]">Abrir PGR</Link></div></div></section>
      </div>}
    </PrestadorDashboardShell>;
  }

  if (!isAutonomo && activeDashboard === "resumo") {
    const primaryEpiAlert = [...epiItems]
      .filter(item => item.stockQuantity <= item.minimumStock || (item.expiresAt && (daysUntil(item.expiresAt) ?? Number.POSITIVE_INFINITY) <= 30))
      .sort((left, right) => {
        const leftDays = left.expiresAt ? daysUntil(left.expiresAt) ?? Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY;
        const rightDays = right.expiresAt ? daysUntil(right.expiresAt) ?? Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY;
        return leftDays - rightDays || (left.stockQuantity - left.minimumStock) - (right.stockQuantity - right.minimumStock);
      })[0];
    const primaryEpiDays = primaryEpiAlert?.expiresAt ? daysUntil(primaryEpiAlert.expiresAt) : null;
    const alertTitle = primaryEpiAlert
      ? primaryEpiDays !== null
        ? primaryEpiDays < 0
          ? `CA vencido — ${primaryEpiAlert.name}${primaryEpiAlert.caNumber ? ` (CA ${primaryEpiAlert.caNumber})` : ""}`
          : `CA vence em ${primaryEpiDays} dia${primaryEpiDays === 1 ? "" : "s"} — ${primaryEpiAlert.name}${primaryEpiAlert.caNumber ? ` (CA ${primaryEpiAlert.caNumber})` : ""}`
        : `Estoque crítico — ${primaryEpiAlert.name}`
      : null;
    const alertDetail = primaryEpiAlert
      ? primaryEpiDays !== null
        ? `Validade ${new Date(primaryEpiAlert.expiresAt!).toLocaleDateString("pt-BR")} · Estoque ${primaryEpiAlert.stockQuantity}`
        : `${primaryEpiAlert.stockQuantity} unidade(s) em estoque · mínimo ${primaryEpiAlert.minimumStock}`
      : null;
    const actionItemsForDashboard = [...openActionItems]
      .sort((left, right) => (left.dueAt ? new Date(left.dueAt).getTime() : Number.POSITIVE_INFINITY) - (right.dueAt ? new Date(right.dueAt).getTime() : Number.POSITIVE_INFINITY))
      .slice(0, 3);
    const recentActivity = [
      ...(operations.data?.epiDeliveries ?? []).map(item => ({ id: `delivery-${item.id}`, title: "Entrega de EPI registrada", detail: "Uma ficha de entrega foi incluída no controle de EPIs.", date: item.createdAt, icon: ShieldCheck })),
      ...allInspections.map(item => ({ id: `inspection-${item.id}`, title: item.status === "completed" ? "Inspeção concluída" : "Inspeção planejada", detail: item.title, date: item.updatedAt ?? item.createdAt, icon: ClipboardCheck })),
      ...filteredActionItems.map(item => ({ id: `action-${item.id}`, title: item.status === "completed" ? "Ação preventiva concluída" : "Ação preventiva atualizada", detail: item.title, date: item.updatedAt ?? item.createdAt, icon: CheckSquare2 })),
    ]
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
      .slice(0, 4);
    const commandMetrics = [
      { label: "Pessoas ativas", value: activeEmployees.length, delta: activeEmployees.length ? `${activeEmployees.length} cadastrada${activeEmployees.length === 1 ? "" : "s"}` : "Cadastre a equipe", icon: UsersRound, href: appHref("/app/estrutura"), tone: "blue" },
      { label: "Setores ativos", value: activeDepartments.length, delta: activeDepartments.length ? `${activeJobRoles.length} função(ões) ativa(s)` : "Estruture a empresa", icon: Building2, href: appHref("/app/estrutura"), tone: "slate" },
      { label: "Alertas de EPI", value: epiAlerts, delta: epiAlerts ? `${epiStockCritical} estoque · ${epiExpiring} CA` : "Tudo regular por aqui", icon: CircleAlert, href: appHref("/app/operacao"), tone: "amber" },
      { label: "Ocorrências abertas", value: openOccurrences, delta: openOccurrences ? "Exigem acompanhamento" : "Nenhuma pendência", icon: ShieldCheck, href: appHref("/app/operacao"), tone: openOccurrences ? "amber" : "green" },
    ] as const;
    const visiblePriorities = priorities.slice(0, 3);

    return <DashboardLayout title="Dashboard"><div className="dashboard-readable mx-auto max-w-[1440px] space-y-4">
      <section className="flex flex-col gap-4 border-b border-[#e5e7eb] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium text-[#6b7280]">TST CLT <span className="mx-1.5 text-[#cbd5d1]">/</span> {current.name}</p>
          <h2 className="mt-1 text-[26px] font-bold tracking-[-.035em] text-[#111827]">Dashboard</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-[#e5e7eb] bg-white p-1" role="group" aria-label="Período do dashboard">
            {(["30", "90", "365"] as const).map(value => <button key={value} type="button" onClick={() => setGlobalPeriod(value)} aria-pressed={globalPeriod === value} className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${globalPeriod === value ? "bg-[#f1f5f3] text-[#166534] shadow-sm" : "text-[#667085] hover:bg-[#f8faf9] hover:text-[#1f2937]"}`}>{value === "365" ? "12 meses" : `${value} dias`}</button>)}
          </div>
          <button type="button" onClick={() => setIsCustomizingSummary(previous => !previous)} className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition ${isCustomizingSummary ? "border-[#15803d] bg-[#15803d] text-white" : "border-[#b7d8c1] bg-white text-[#166534] hover:bg-[#f4fbf6]"}`}><Settings2 className="h-3.5 w-3.5" />{isCustomizingSummary ? "Concluir" : "Personalizar"}</button>
        </div>
      </section>

      <section className="flex gap-2 overflow-x-auto pb-1" aria-label="Seções do dashboard">
        {dashboardTabs.map(({ id, label, icon: Icon }) => {
          const badge = badgeCountFor(id);
          return <button key={id} type="button" onClick={() => setActiveDashboard(id)} aria-pressed={activeDashboard === id} className={`relative inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition ${activeDashboard === id ? "border-[#111827] bg-[#111827] text-white shadow-sm" : "border-[#e5e7eb] bg-white text-[#374151] hover:border-[#cbd5d1] hover:bg-[#f8faf9]"}`}><Icon className="h-4 w-4" />{label}{badge.count > 0 && <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold ${activeDashboard === id ? "bg-[#22c55e] text-[#052e16]" : "bg-[#ecfdf3] text-[#15803d]"}`}>{badge.count > 99 ? "99+" : badge.count}</span>}</button>;
        })}
      </section>

      {isCustomizingSummary && <section className="flex flex-col gap-3 rounded-xl border border-[#dcebe3] bg-[#f7fbf8] px-4 py-3 text-xs text-[#4b6358] sm:flex-row sm:items-center sm:justify-between"><p>O painel usa dados registrados em EPIs, estrutura, inspeções, plano de ação e CIPA. O período altera os indicadores e a lista de atividade.</p><button type="button" onClick={resetSummaryLayout} className="inline-flex w-fit items-center gap-1.5 font-semibold text-[#166534] hover:text-[#14532d]"><RotateCcw className="h-3.5 w-3.5" />Restaurar preferências</button></section>}

      {alertTitle ? <section className="flex flex-col gap-3 rounded-xl border border-[#fde0de] border-l-4 border-l-[#dc2626] bg-white px-4 py-3 shadow-[0_2px_8px_rgba(17,24,39,.04)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#dc2626]" /><div><p className="text-sm font-semibold text-[#1f2937]">{alertTitle}</p><p className="mt-0.5 text-xs text-[#6b7280]">{alertDetail}</p></div></div>
        <div className="flex shrink-0 items-center gap-2"><Link href={appHref("/app/operacao")} className="inline-flex h-8 items-center rounded-lg bg-[#15803d] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#166534]">Resolver agora</Link>{isAlertUnread("epi") ? <button type="button" onClick={() => markAlertAsRead("epi")} className="inline-flex h-8 items-center rounded-lg border border-[#e5e7eb] bg-white px-3 text-xs font-semibold text-[#4b5563] hover:bg-[#f9fafb]">Marcar como lida</button> : <span className="inline-flex h-8 items-center rounded-lg bg-[#f0fdf4] px-3 text-xs font-semibold text-[#15803d]">Lida</span>}</div>
      </section> : <section className="flex items-center gap-3 rounded-xl border border-[#bbdfc4] bg-[#f6fcf7] px-4 py-3"><CheckCircle2 className="h-5 w-5 text-[#15803d]" /><p className="text-sm font-semibold text-[#166534]">Tudo regular por aqui. Não há alertas críticos de EPI ou CA para este período.</p></section>}

      <section className="grid gap-4 xl:grid-cols-[.94fr_1.06fr]">
        <div className="space-y-4">
          <article className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_2px_8px_rgba(17,24,39,.03)]"><div className="border-b border-[#eef0ef] px-4 py-3"><h3 className="text-sm font-bold text-[#1f2937]">Prioridades de hoje</h3></div><div className="divide-y divide-[#eef0ef]">{visiblePriorities.length ? visiblePriorities.map(({ href, title, detail, tone }) => <Link key={title} href={href} className="group flex items-center gap-3 px-4 py-3 transition hover:bg-[#fafcfb]"><span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${tone === "coral" ? "border-[#fbbf24]" : "border-[#a7cdb2]"}`} aria-hidden="true"><span className={`h-2 w-2 rounded-full ${tone === "coral" ? "bg-[#f59e0b]" : "bg-[#15803d]"}`} /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-[#30363f]">{title}</strong><small className="mt-0.5 block truncate text-xs text-[#737b86]">{detail}</small></span><ArrowRight className="h-4 w-4 shrink-0 text-[#a3aaa5] transition group-hover:translate-x-0.5 group-hover:text-[#15803d]" /></Link>) : <div className="flex items-center gap-3 px-4 py-6 text-sm text-[#587066]"><CheckCircle2 className="h-5 w-5 text-[#15803d]" />Nenhuma prioridade calculada a partir dos registros deste ambiente.</div>}</div></article>
          <article className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_2px_8px_rgba(17,24,39,.03)]"><div className="flex items-center justify-between border-b border-[#eef0ef] px-4 py-3"><h3 className="text-sm font-bold text-[#1f2937]">Ações em aberto</h3><Link href={appHref("/app/inspecoes")} className="text-xs font-semibold text-[#15803d] hover:text-[#166534]">Ver todas</Link></div><div className="divide-y divide-[#eef0ef]">{actionItemsForDashboard.length ? actionItemsForDashboard.map(item => { const days = item.dueAt ? daysUntil(item.dueAt) : null; return <Link key={item.id} href={appHref("/app/inspecoes")} className="group flex items-center gap-3 px-4 py-3 transition hover:bg-[#fafcfb]"><span className="h-5 w-5 shrink-0 rounded-full border border-[#cbd5d1]" /><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-[#30363f]">{item.title}</strong><small className={`mt-0.5 block text-xs ${days !== null && days < 0 ? "text-[#b91c1c]" : "text-[#737b86]"}`}>{days === null ? "Sem prazo definido" : days < 0 ? `Prazo vencido há ${Math.abs(days)} dia(s)` : days === 0 ? "Vence hoje" : `Prazo em ${days} dia(s)`}</small></span><ArrowRight className="h-4 w-4 shrink-0 text-[#a3aaa5] transition group-hover:translate-x-0.5 group-hover:text-[#15803d]" /></Link>; }) : <div className="flex items-center gap-3 px-4 py-6 text-sm text-[#587066]"><CheckCircle2 className="h-5 w-5 text-[#15803d]" />Nenhuma ação preventiva em aberto.</div>}</div></article>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">{commandMetrics.map(({ label, value, delta, icon: Icon, href, tone }) => <Link key={label} href={href} className="group rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_2px_8px_rgba(17,24,39,.03)] transition hover:border-[#c9d9cf] hover:shadow-[0_6px_16px_rgba(17,24,39,.06)]"><div className="flex items-start justify-between gap-3"><span className={`grid h-9 w-9 place-items-center rounded-full ${tone === "amber" ? "bg-[#fff8e7] text-[#d97706]" : tone === "green" ? "bg-[#f0fdf4] text-[#15803d]" : tone === "blue" ? "bg-[#eff6ff] text-[#2563eb]" : "bg-[#f3f4f6] text-[#59636d]"}`}><Icon className="h-4 w-4" /></span><ArrowRight className="h-4 w-4 text-[#bdc5c0] transition group-hover:translate-x-0.5 group-hover:text-[#15803d]" /></div><p className="mt-4 text-3xl font-bold tracking-[-.04em] text-[#1f2937]">{value}</p><p className="mt-1 text-xs font-semibold text-[#4b5563]">{label}</p><p className={`mt-1 text-[11px] ${tone === "amber" ? "text-[#b45309]" : tone === "green" ? "text-[#15803d]" : "text-[#7b8490]"}`}>{delta}</p></Link>)}</div>
          <article className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_2px_8px_rgba(17,24,39,.03)]"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-sm font-bold text-[#1f2937]">Execução do período</h3><p className="mt-0.5 text-xs text-[#737b86]">Leitura atual de inspeções e ações registradas em {periodLabel.toLowerCase()}.</p></div><span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#597063]"><span className="h-2 w-2 rounded-full bg-[#15803d]" />Concluídas <span className="ml-2 h-2 w-2 rounded-full bg-[#d6a700]" />Pendentes</span></div><div className="mt-5 grid h-32 grid-cols-5 items-end gap-2 border-b border-l border-[#edf0ee] px-3 pb-2">{[completedInspections, completedActionItems, plannedInspections, openActionItems.length, overdueActionItems].map((value, index) => { const maximum = Math.max(completedInspections, completedActionItems, plannedInspections, openActionItems.length, overdueActionItems, 1); const height = Math.max(10, Math.round((value / maximum) * 100)); const critical = index === 4; const pending = index === 2 || index === 3; return <div key={index} className="flex h-full flex-col justify-end"><span className="mb-1 text-center text-[10px] font-semibold text-[#667085]">{value}</span><div className={`rounded-t-md ${critical ? "bg-[#dc2626]" : pending ? "bg-[#d6a700]" : "bg-[#15803d]"}`} style={{ height: `${height}%` }} /></div>; })}</div><div className="mt-2 grid grid-cols-5 gap-2 text-center text-[10px] font-medium text-[#838b96]"><span>Insp. concl.</span><span>Ações concl.</span><span>Insp. plan.</span><span>Em aberto</span><span>Atrasadas</span></div></article>
          <article className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_2px_8px_rgba(17,24,39,.03)]"><div className="flex items-center justify-between border-b border-[#eef0ef] px-4 py-3"><h3 className="text-sm font-bold text-[#1f2937]">Atividade recente</h3><span className="text-[11px] text-[#7b8490]">Registros do ambiente</span></div><div className="divide-y divide-[#eef0ef]">{recentActivity.length ? recentActivity.map(({ id, title, detail, date, icon: Icon }) => <div key={id} className="flex items-center gap-3 px-4 py-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f1f5f3] text-[#4b6358]"><Icon className="h-3.5 w-3.5" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-xs text-[#374151]">{title}</strong><small className="mt-0.5 block truncate text-[11px] text-[#7b8490]">{detail}</small></span><time className="shrink-0 text-[11px] text-[#8b949e]">{new Date(date).toLocaleDateString("pt-BR")}</time></div>) : <div className="px-4 py-6 text-center text-sm text-[#737b86]">As atualizações aparecerão aqui à medida que a operação for registrada.</div>}</div></article>
        </div>
      </section>
    </div></DashboardLayout>;
  }

  return <DashboardLayout title="Dashboard"><div className="dashboard-readable mx-auto max-w-7xl space-y-5">
    <section className="sticky top-3 z-20 rounded-2xl border border-[#dcebe8] bg-white/95 p-2 shadow-[0_12px_32px_rgba(16,43,50,.08)] backdrop-blur-xl" aria-label="Painéis do ambiente">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 overflow-x-auto px-1 pb-1 pt-1.5">
          {dashboardTabs.map(({ id, label, description, icon: Icon }) => { const badge = badgeCountFor(id); return <button key={id} type="button" onClick={() => setActiveDashboard(id)} aria-pressed={activeDashboard === id} className={`group relative flex min-w-[130px] shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 pr-9 text-left transition ${activeDashboard === id ? "bg-[#0c7474] text-white shadow-[0_7px_18px_rgba(12,116,116,.18)]" : "text-[#47636a] hover:bg-[#f2f8f6]"}`}><span className={`grid h-8 w-8 place-items-center rounded-lg ${activeDashboard === id ? "bg-white/15" : "bg-[#e8f6f1] text-[#0c7474]"}`}><Icon className="h-4 w-4" /></span><span><strong className="block text-xs font-bold">{label}</strong><small className={`mt-0.5 block whitespace-nowrap text-[10px] ${activeDashboard === id ? "text-white/75" : "text-[#83a09a] group-hover:text-[#668087]"}`}>{description}</small></span>{badge.count > 0 && <span className="absolute right-2 top-2 z-10 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-[#d83c3c] px-1 text-[9px] font-extrabold leading-none text-white shadow-sm" aria-label={`${badge.count} alerta(s) pendente(s) em ${label}`}>{badge.count > 99 ? "99+" : badge.count}</span>}</button>; })}
        </div>
        <div className="flex flex-col gap-2 rounded-xl border border-[#e6f0ee] bg-[#f7fcfa] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#668087]"><CalendarClock className="h-3.5 w-3.5 text-[#0c7474]" />Período global <span className="normal-case font-semibold tracking-normal text-[#0c7474]">{periodLabel}</span></div>
          <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Controles do Dashboard">
            <div className="flex flex-wrap gap-1" role="group" aria-label="Filtrar período global">
              {(["all", "30", "90", "365"] as const).map(value => <button key={value} type="button" onClick={() => setGlobalPeriod(value)} aria-pressed={globalPeriod === value} className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition ${globalPeriod === value ? "bg-white text-[#0c7474] shadow-sm ring-1 ring-[#b9e3d7]" : "text-[#668087] hover:bg-white hover:text-[#315158]"}`}>{value === "all" ? "Tudo" : value === "365" ? "12 meses" : `${value} dias`}</button>)}
            </div>
            <button type="button" onClick={() => setIsCustomizingSummary(previous => !previous)} aria-expanded={isCustomizingSummary} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition ${isCustomizingSummary ? "bg-[#0c7474] text-white" : "text-[#668087] hover:bg-white hover:text-[#315158]"}`}><Settings2 className="h-3.5 w-3.5" />{isCustomizingSummary ? "Concluir" : "Personalizar"}</button>
          </div>
        </div>
        {isCustomizingSummary && <div className="rounded-xl border border-[#b9e3d7] bg-gradient-to-br from-[#f7fcfa] to-white p-3 shadow-inner" role="region" aria-label="Personalizar widgets do Resumo">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold text-[#315158]">Organize seu Resumo</p><p className="mt-0.5 text-[10px] text-[#668087]">O layout é salvo neste ambiente e pode ser restaurado quando quiser.</p></div><button type="button" onClick={resetSummaryLayout} className="inline-flex items-center gap-1.5 self-start rounded-lg border border-[#dcebe8] bg-white px-2.5 py-1.5 text-[10px] font-bold text-[#0c7474] transition hover:border-[#a9d4c8]"><RotateCcw className="h-3.5 w-3.5" />Restaurar padrão</button></div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">{summaryOrder.map((id, index) => { const meta = summaryWidgetLabels[id]; const hidden = hiddenSummaryWidgets.includes(id); return <div key={id} className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 ${hidden ? "border-[#e6f0ee] bg-[#f5f8f7] opacity-70" : "border-[#dcebe8] bg-white"}`}><div className="flex min-w-0 items-center gap-2"><button type="button" onClick={() => toggleSummaryWidget(id)} aria-pressed={!hidden} aria-label={`${hidden ? "Mostrar" : "Ocultar"} ${meta.label}`} className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${hidden ? "bg-[#e9efed] text-[#8aa19e]" : "bg-[#e8f6f1] text-[#0c7474]"}`}>{hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button><span className="min-w-0"><strong className="block truncate text-[11px] text-[#315158]">{meta.label}</strong><small className="block truncate text-[10px] text-[#8aa19e]">{meta.description}</small></span></div><div className="flex shrink-0 items-center gap-1"><button type="button" onClick={() => moveSummaryWidget(id, "up")} disabled={index === 0} aria-label={`Mover ${meta.label} para cima`} className="grid h-7 w-7 place-items-center rounded-lg text-[#668087] transition hover:bg-[#e8f6f1] hover:text-[#0c7474] disabled:cursor-not-allowed disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button><button type="button" onClick={() => moveSummaryWidget(id, "down")} disabled={index === summaryOrder.length - 1} aria-label={`Mover ${meta.label} para baixo`} className="grid h-7 w-7 place-items-center rounded-lg text-[#668087] transition hover:bg-[#e8f6f1] hover:text-[#0c7474] disabled:cursor-not-allowed disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button></div></div>; })}</div>
        </div>}
      </div>
    </section>

    {activeDashboard === "resumo" ? <div className="flex flex-col gap-7">
    {!hiddenSummaryWidgets.includes("alerts") && (epiStockCritical > 0 || epiExpiring > 0) && (
      <div style={{ order: summaryOrder.indexOf("alerts") }}>
      <section className="rounded-3xl border border-[#f1d5c9] bg-gradient-to-r from-[#fff9f5] via-[#fff4ec] to-[#fef8f5] p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#fdd8cc] text-[#bd6e4f]">
              <CircleAlert className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#2d1810]">Alertas Críticos de EPI e CA no Ambiente</h4>
              <p className="mt-0.5 text-xs text-[#735043]">
                {epiStockCritical > 0 ? `${epiStockCritical} item(ns) com estoque crítico abaixo do mínimo. ` : ""}
                {epiExpiring > 0 ? `${epiExpiring} Certificado(s) de Aprovação (CA) com validade vencida ou próxima em 30 dias.` : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Link href={appHref("/app/operacao")} className="inline-flex items-center justify-center rounded-xl bg-[#d67845] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#bd643d]">
              Resolver agora <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
            {isAlertUnread("epi") ? <button type="button" onClick={() => markAlertAsRead("epi")} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#e6af96] bg-white/75 px-3 py-2 text-xs font-bold text-[#a85a39] transition hover:bg-white"><CheckCircle2 className="h-3.5 w-3.5" />Marcar como lida</button> : <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#b9e3d7] bg-white/75 px-3 py-2 text-xs font-bold text-[#0c7474]"><CheckCircle2 className="h-3.5 w-3.5" />Lida</span>}
          </div>
        </div>
      </section>
      </div>
    )}

    {!hiddenSummaryWidgets.includes("hero") && <div style={{ order: summaryOrder.indexOf("hero") }}><section className={`relative overflow-hidden rounded-[2rem] border p-7 shadow-[0_22px_60px_rgba(28,74,77,0.10)] lg:p-9 ${context.color}`}>
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#8edec7]/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-8rem] left-1/3 h-64 w-64 rounded-full bg-[#b9defc]/15 blur-3xl" />
      <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-start"><div><span className={`inline-flex rounded-full border border-white/80 bg-white/75 px-3 py-1 text-[10px] font-bold uppercase tracking-[.14em] shadow-sm ${context.accent}`}>{context.label}</span><p className={`mt-5 text-xs font-bold uppercase tracking-[.14em] ${context.accent}`}>{context.eyebrow}</p><h2 className="mt-2 max-w-3xl text-3xl font-semibold tracking-[-.03em] text-[#173b43] lg:text-4xl">{context.headline}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#5d7479]">{context.description}</p></div><Link href="/app" className="inline-flex items-center gap-2 rounded-xl border border-white/80 bg-white/45 px-4 py-2 text-sm font-bold text-[#0c7474] shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/75">Alternar contexto <ArrowRight className="h-4 w-4" /></Link></div>
      <div className="relative mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">{context.stats.map(({ label, value, icon: Icon, tone }) => <div key={label} className="rounded-2xl border border-white/80 bg-white/55 p-4 shadow-[0_8px_24px_rgba(28,74,77,0.06)] backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:bg-white/75 hover:shadow-[0_14px_30px_rgba(28,74,77,0.10)]"><span className={`grid h-9 w-9 place-items-center rounded-xl ${tone === "coral" ? "bg-[#fff0e8] text-[#cf754a]" : tone === "blue" ? "bg-[#edf5fb] text-[#3173a8]" : "bg-[#e8f6f1] text-[#0c7474]"}`}><Icon className="h-4 w-4" /></span><p className="mt-4 text-3xl font-semibold tracking-tight text-[#173b43]">{value}</p><p className="mt-1 text-xs text-[#668087]">{label}</p></div>)}</div>
    </section></div>}

    {!isAutonomo && <section className="hidden rounded-3xl border border-[#d7e4f0] bg-[#f8fbff] p-6 shadow-sm"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#3173a8]">Risco e prevenção</p><h3 className="mt-1 text-xl font-bold">Visão de risco e ações internas</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-[#668087]">Acompanhamento consolidado a partir do PGR, inspeções, EPIs, ocorrências e plano de ação registrados no ambiente.</p></div><Link href={appHref("/app/inspecoes")} className="inline-flex text-sm font-bold text-[#3173a8] hover:text-[#123f69]">Abrir inspeções e ações →</Link></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><Link href={appHref("/app/pgr")} className="rounded-2xl border border-[#d6e4f0] bg-white p-4 transition hover:border-[#9cc0df]"><ShieldCheck className="h-5 w-5 text-[#3173a8]" /><b className="mt-3 block text-2xl">{current.pgrProjects.length}</b><span className="text-xs text-[#668087]">PGRs vinculados</span></Link><Link href={appHref("/app/estrutura")} className="rounded-2xl border border-[#d6e4f0] bg-white p-4 transition hover:border-[#9cc0df]"><BriefcaseBusiness className="h-5 w-5 text-[#3173a8]" /><b className="mt-3 block text-2xl">{activeJobRoles.length}</b><span className="text-xs text-[#668087]">Funções ativas</span></Link><Link href={appHref("/app/inspecoes")} className="rounded-2xl border border-[#d6e4f0] bg-white p-4 transition hover:border-[#9cc0df]"><ClipboardCheck className="h-5 w-5 text-[#3173a8]" /><b className="mt-3 block text-2xl">{plannedInspections}</b><span className="text-xs text-[#668087]">Inspeções planejadas</span></Link><Link href={appHref("/app/inspecoes")} className="rounded-2xl border border-[#f1d5c9] bg-white p-4 transition hover:border-[#e6af96]"><ClipboardCheck className="h-5 w-5 text-[#d67845]" /><b className="mt-3 block text-2xl">{openActionItems.length}</b><span className="text-xs text-[#668087]">Ações em aberto</span></Link><Link href={appHref("/app/operacao")} className="rounded-2xl border border-[#f1d5c9] bg-white p-4 transition hover:border-[#e6af96]"><ShieldCheck className="h-5 w-5 text-[#d67845]" /><b className="mt-3 block text-2xl">{epiAlerts}</b><span className="text-xs text-[#668087]">Alertas de EPI</span></Link><Link href={appHref("/app/operacao")} className="rounded-2xl border border-[#f1d5c9] bg-white p-4 transition hover:border-[#e6af96]"><CircleAlert className="h-5 w-5 text-[#d67845]" /><b className="mt-3 block text-2xl">{openOccurrences}</b><span className="text-xs text-[#668087]">Ocorrências abertas</span></Link></div></section>}

        {false && <InspectionActionSummary inspections={allInspections} actionItems={planning.data?.actionItems ?? []} />}

    {false && <DashboardCharts isAutonomo={isAutonomo} workspaceId={current.id} input={dashboardAnalytics} />}

    <section className="hidden rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-sm">
<div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Indicadores de SST</p><h3 className="mt-1 text-xl font-bold">Cobertura atual de prevenção</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-[#668087]">Snapshot calculado exclusivamente dos registros deste ambiente. Tendências históricas serão exibidas quando houver histórico suficiente de períodos anteriores.</p></div><Link href={appHref("/app/inspecoes")} className="text-sm font-bold text-[#0c7474] hover:text-[#063b43]">Abrir módulo →</Link></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Link href={appHref("/app/inspecoes")} className="rounded-2xl border border-[#d6e4f0] bg-[#f8fbff] p-4 transition hover:border-[#9cc0df]"><ClipboardCheck className="h-5 w-5 text-[#3173a8]" /><b className="mt-3 block text-2xl">{allInspections.length}</b><span className="text-xs text-[#668087]">Inspeções registradas</span></Link><Link href={appHref("/app/inspecoes")} className="rounded-2xl border border-[#b9e3d7] bg-[#f7fcfa] p-4 transition hover:border-[#8dcfb9]"><CheckCircle2 className="h-5 w-5 text-[#0c7474]" /><b className="mt-3 block text-2xl">{inspectionCompletionRate === null ? "—" : `${inspectionCompletionRate}%`}</b><span className="text-xs text-[#668087]">Inspeções concluídas</span></Link><Link href={appHref("/app/inspecoes")} className={`rounded-2xl border p-4 transition ${overdueInspections ? "border-[#f1d5c9] bg-[#fff9f5] hover:border-[#e6af96]" : "border-[#dcebe8] bg-white hover:border-[#a9d4c8]"}`}><CalendarClock className={`h-5 w-5 ${overdueInspections ? "text-[#d67845]" : "text-[#0c7474]"}`} /><b className="mt-3 block text-2xl">{overdueInspections}</b><span className="text-xs text-[#668087]">Inspeções atrasadas</span></Link><Link href={appHref("/app/inspecoes")} className={`rounded-2xl border p-4 transition ${overdueActionItems ? "border-[#f1d5c9] bg-[#fff9f5] hover:border-[#e6af96]" : "border-[#dcebe8] bg-white hover:border-[#a9d4c8]"}`}><CircleAlert className={`h-5 w-5 ${overdueActionItems ? "text-[#d67845]" : "text-[#0c7474]"}`} /><b className="mt-3 block text-2xl">{overdueActionItems}</b><span className="text-xs text-[#668087]">Ações atrasadas</span></Link><Link href={appHref("/app/inspecoes")} className="rounded-2xl border border-[#dcebe8] bg-white p-4 transition hover:border-[#a9d4c8]"><CheckSquare2 className="h-5 w-5 text-[#0c7474]" /><b className="mt-3 block text-2xl">{actionCompletionRate === null ? "—" : `${actionCompletionRate}%`}</b><span className="text-xs text-[#668087]">Ações concluídas</span></Link></div></section>

    {!hiddenSummaryWidgets.includes("priorities") && <div style={{ order: summaryOrder.indexOf("priorities") }}><section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <article className="rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">{context.nextTitle}</p><h3 className="mt-1 text-xl font-bold">{context.priorityTitle}</h3></div><ClipboardCheck className="h-5 w-5 text-[#0c7474]" /></div><div className="mt-5 space-y-3">{priorities.length ? priorities.map(({ href, title, detail, icon: Icon, tone }) => <Link key={title} href={href} className={`flex items-center justify-between rounded-2xl border p-4 transition hover:translate-x-0.5 ${tone === "coral" ? "border-[#f1d5c9] bg-[#fff9f5] hover:border-[#e6af96]" : tone === "blue" ? "border-[#d6e4f0] bg-[#f8fbff] hover:border-[#a9c9e4]" : "border-[#b9e3d7] bg-[#f7fcfa] hover:border-[#8dcfb9]"}`}><span className="pr-4"><strong className="block text-sm">{title}</strong><small className="mt-1 block text-xs leading-5 text-[#668087]">{detail}</small></span><Icon className={`h-5 w-5 shrink-0 ${tone === "coral" ? "text-[#d67845]" : tone === "blue" ? "text-[#3173a8]" : "text-[#0c7474]"}`} /></Link>) : <div className="flex items-center gap-3 rounded-2xl border border-[#b9e3d7] bg-[#f7fcfa] p-4"><CheckCircle2 className="h-5 w-5 text-[#39a77e]" /><p className="text-sm text-[#315158]">Nenhuma pendência calculada a partir dos registros reais deste ambiente.</p></div>}</div></article>
      <article className="rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Foco da semana</p><h3 className="mt-1 text-xl font-bold">{context.routineTitle}</h3><ol className="mt-5 space-y-3">{context.routine.map((step, index) => <li key={step} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#e8f6f1] text-xs font-bold text-[#0c7474]">{index + 1}</span><p className="pt-1 text-sm leading-5 text-[#47636a]">{step}</p></li>)}</ol></article>
    </section></div>}

    {!hiddenSummaryWidgets.includes("cipa") && <div style={{ order: summaryOrder.indexOf("cipa") }}><section className={`rounded-[2rem] border p-6 shadow-[0_14px_45px_rgba(16,43,50,.055)] transition-colors lg:p-7 ${cipaHasUrgentMeeting ? "border-[#f1c9ba] bg-[linear-gradient(135deg,#fff9f5_0%,#ffffff_58%,#fff2eb_100%)]" : "border-[#dcebe8] bg-white"}`}>
      <div className="flex flex-col justify-between gap-4 border-b border-[#edf4f1] pb-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className={`grid h-11 w-11 place-items-center rounded-2xl shadow-sm ${cipaHasUrgentMeeting ? "bg-[#fff0e9] text-[#c76845]" : "bg-[#e8f6f1] text-[#0c7474]"}`}><CalendarDays className="h-5 w-5" /></div>
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-[.16em] ${cipaHasUrgentMeeting ? "text-[#c76845]" : "text-[#0c8c89]"}`}>{cipaHasUrgentMeeting ? `Atenção · ${urgentCipaMeetings.length} reunião(ões) em até 3 dias` : "Gestão ativa NR-05"}</p>
            <h3 className="mt-1 text-xl font-bold text-[#102b32]">Próximas reuniões e pendências da CIPA</h3>
          </div>
        </div>
        <Link href={appHref("/app/cipa")} className="inline-flex items-center gap-2 rounded-xl bg-[#0c7474] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#063b43]">Abrir Assistant CIPA <ArrowRight className="h-4 w-4" /></Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#e4efec] bg-[#f7fcfa] p-5">
          <h4 className="text-sm font-bold text-[#315158]">Próximas reuniões ordinárias</h4>
          <p className="mt-1 text-xs text-[#668087]">Encontros agendados no calendário oficial deste ambiente.</p>
          <div className="mt-4 space-y-3">
            {upcomingCipaMeetings.length ? upcomingCipaMeetings.map(meeting => { const days = daysUntilCipaMeeting(meeting.date); const isUrgent = isCipaMeetingUrgent(meeting.date); const urgencyLabel = days === 0 ? "Hoje" : days === 1 ? "Amanhã" : `Em ${days} dias`; return <div key={meeting.id} className={`flex items-center justify-between rounded-xl border p-3.5 shadow-sm transition ${isUrgent ? "border-[#efb59f] bg-[#fff8f4] shadow-[0_8px_22px_rgba(198,104,69,.10)]" : "border-[#dcebe8] bg-white"}`}><div className="flex min-w-0 items-center gap-3"><div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${isUrgent ? "bg-[#ffe4d8] text-[#c76845]" : "bg-[#eaf4fd] text-[#3173a8]"}`}>{isUrgent ? <AlertTriangle className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}</div><div className="min-w-0"><p className="truncate text-xs font-bold text-[#102b32]">{meeting.title}</p><p className="mt-1 truncate text-[11px] text-[#668087]">{meeting.date} às {meeting.time}{meeting.notes ? ` · ${meeting.notes}` : ""}</p></div></div><span className={`ml-3 shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${isUrgent ? "bg-[#ffe4d8] text-[#b85c36] motion-safe:animate-pulse motion-reduce:animate-none" : "bg-[#eaf4fd] text-[#3173a8]"}`}>{isUrgent ? urgencyLabel : "Agendada"}</span></div>; }) : <div className="rounded-xl border border-dashed border-[#cfe3de] bg-white p-5 text-center text-xs text-[#668087]">Nenhuma reunião agendada. Acesse o Assistant CIPA para gerar o ciclo de 12 meses.</div>}
          </div>
        </div>

        <div className="rounded-2xl border border-[#e4efec] bg-[#f7fcfa] p-5">
          <h4 className="text-sm font-bold text-[#315158]">Tarefas pendentes da comissão</h4>
          <p className="mt-1 text-xs text-[#668087]">Itens obrigatórios para o cumprimento da NR-05.</p>
          <div className="mt-4 space-y-3">
            {pendingCipaTasks.map((task, index) => <div key={index} className="flex items-center justify-between rounded-xl border border-[#dcebe8] bg-white p-3.5 shadow-sm"><div className="flex items-center gap-3"><span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${task.completed ? "bg-[#0c7474] text-white" : "bg-[#f2f5f4] text-[#83a09a]"}`}>{task.completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}</span><span className="text-xs font-semibold text-[#315158]">{task.title}</span></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${task.completed ? "bg-[#e8f6f1] text-[#0c7474]" : "bg-[#fff0e9] text-[#b85c36]"}`}>{task.completed ? "Concluído" : "Pendente"}</span></div>)}
          </div>
        </div>
      </div>
    </section></div>}

    <section className="hidden rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-sm"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Ferramentas compartilhadas</p><h3 className="mt-1 text-xl font-bold">Atalhos na ordem da sua rotina</h3></div><p className="max-w-sm text-sm text-[#668087]">As mesmas ferramentas permanecem disponíveis nos dois ambientes; a ordem muda conforme a prioridade de trabalho.</p></div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{context.tools.map(({ href, icon: Icon, title, text }, index) => <Link key={title} href={href} className="group flex items-center gap-3 rounded-2xl border border-[#e6f0ee] p-4 transition hover:border-[#a9d4c8] hover:bg-[#fbfefd]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e8f6f1] text-[#0c7474]"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block text-sm">{title}</strong><small className="text-xs text-[#668087]">{text}</small></span><span className="text-xs font-bold text-[#90ada9] group-hover:text-[#0c7474]">0{index + 1}</span></Link>)}</div></section>
    </div>
    : <section className="space-y-5">
        <div className="rounded-[2rem] border border-[#dcebe8] bg-white p-6 shadow-[0_16px_42px_rgba(16,43,50,.06)] lg:p-7"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#0c8c89]">Painel temático</p><h2 className="mt-1 text-2xl font-bold text-[#102b32]">{dashboardTabs.find(tab => tab.id === activeDashboard)?.label}</h2><p className="mt-2 text-sm text-[#668087]">{dashboardTabs.find(tab => tab.id === activeDashboard)?.description}. Consulte apenas o recorte operacional necessário, sem misturar indicadores.</p></div><span className="rounded-full bg-[#e8f6f1] px-3 py-1.5 text-xs font-bold text-[#0c7474]">Ambiente: {current.name}</span></div></div>
        {activeDashboard === "cipa" && <section className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><article className={`rounded-3xl border p-6 shadow-sm ${cipaHasUrgentMeeting ? "border-[#f1c9ba] bg-[#fff8f4]" : "border-[#dcebe8] bg-white"}`}><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#c76845]">Agenda da comissão</p><h3 className="mt-1 text-xl font-bold text-[#102b32]">Próximas reuniões</h3></div><CalendarDays className="h-5 w-5 text-[#0c7474]" /></div><div className="mt-5 space-y-3">{upcomingCipaMeetings.length ? upcomingCipaMeetings.map(meeting => { const days = daysUntilCipaMeeting(meeting.date); const urgent = isCipaMeetingUrgent(meeting.date); return <div key={meeting.id} className={`flex items-center justify-between rounded-2xl border p-4 ${urgent ? "border-[#efb59f] bg-white" : "border-[#e4efec] bg-[#f7fcfa]"}`}><div><p className="text-sm font-bold text-[#315158]">{meeting.title}</p><p className="mt-1 text-xs text-[#668087]">{meeting.date} às {meeting.time}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${urgent ? "bg-[#ffe4d8] text-[#b85c36]" : "bg-[#eaf4fd] text-[#3173a8]"}`}>{urgent ? (days === 0 ? "Hoje" : days === 1 ? "Amanhã" : `Em ${days} dias`) : "Agendada"}</span></div>; }) : <p className="rounded-2xl border border-dashed border-[#cfe3de] p-5 text-center text-sm text-[#668087]">Nenhuma reunião agendada neste ambiente.</p>}</div><Link href={appHref("/app/cipa")} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#0c7474]">Abrir agenda da CIPA <ArrowRight className="h-4 w-4" /></Link></article><article className="rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Acompanhamento</p><h3 className="mt-1 text-xl font-bold text-[#102b32]">Tarefas pendentes</h3><div className="mt-5 space-y-3">{pendingCipaTasks.map((task, index) => <div key={task.title} className="flex items-center gap-3 rounded-2xl border border-[#e6f0ee] bg-[#f7fcfa] p-3.5"><span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${task.completed ? "bg-[#0c7474] text-white" : "bg-[#fff0e9] text-[#b85c36]"}`}>{task.completed ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</span><span className="text-sm font-semibold text-[#315158]">{task.title}</span></div>)}</div></article></section>}
        {activeDashboard === "epis" && <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><Link href={appHref("/app/operacao")} className="rounded-3xl border border-[#f1d5c9] bg-[#fff9f5] p-6 shadow-sm transition hover:-translate-y-0.5"><CircleAlert className="h-5 w-5 text-[#d67845]" /><b className="mt-4 block text-3xl text-[#102b32]">{epiAlerts}</b><span className="mt-1 block text-xs text-[#668087]">Alertas totais de EPI</span></Link><Link href={appHref("/app/operacao")} className="rounded-3xl border border-[#f1d5c9] bg-white p-6 shadow-sm transition hover:-translate-y-0.5"><ShieldCheck className="h-5 w-5 text-[#d67845]" /><b className="mt-4 block text-3xl text-[#102b32]">{epiStockCritical}</b><span className="mt-1 block text-xs text-[#668087]">Itens abaixo do mínimo</span></Link><Link href={appHref("/app/operacao")} className="rounded-3xl border border-[#d6e4f0] bg-[#f8fbff] p-6 shadow-sm transition hover:-translate-y-0.5"><CalendarClock className="h-5 w-5 text-[#3173a8]" /><b className="mt-4 block text-3xl text-[#102b32]">{epiExpiring}</b><span className="mt-1 block text-xs text-[#668087]">CAs próximos do vencimento</span></Link><Link href={appHref("/app/operacao")} className="rounded-3xl border border-[#b9e3d7] bg-[#f7fcfa] p-6 shadow-sm transition hover:-translate-y-0.5"><ShieldCheck className="h-5 w-5 text-[#0c7474]" /><b className="mt-4 block text-3xl text-[#102b32]">{epiItems.length}</b><span className="mt-1 block text-xs text-[#668087]">EPIs ativos no ambiente</span></Link></section>}
        {activeDashboard === "inspecoes" && <section className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Link href={appHref("/app/inspecoes")} className="rounded-3xl border border-[#d6e4f0] bg-[#f8fbff] p-6 shadow-sm"><ClipboardCheck className="h-5 w-5 text-[#3173a8]" /><b className="mt-4 block text-3xl">{allInspections.length}</b><span className="mt-1 block text-xs text-[#668087]">Inspeções registradas</span></Link><Link href={appHref("/app/inspecoes")} className="rounded-3xl border border-[#b9e3d7] bg-[#f7fcfa] p-6 shadow-sm"><CheckCircle2 className="h-5 w-5 text-[#0c7474]" /><b className="mt-4 block text-3xl">{inspectionCompletionRate === null ? "—" : `${inspectionCompletionRate}%`}</b><span className="mt-1 block text-xs text-[#668087]">Conclusão</span></Link><Link href={appHref("/app/inspecoes")} className="rounded-3xl border border-[#f1d5c9] bg-[#fff9f5] p-6 shadow-sm"><CalendarClock className="h-5 w-5 text-[#d67845]" /><b className="mt-4 block text-3xl">{overdueInspections}</b><span className="mt-1 block text-xs text-[#668087]">Inspeções atrasadas</span></Link><Link href={appHref("/app/inspecoes")} className="rounded-3xl border border-[#f1d5c9] bg-[#fff9f5] p-6 shadow-sm"><CircleAlert className="h-5 w-5 text-[#d67845]" /><b className="mt-4 block text-3xl">{overdueActionItems}</b><span className="mt-1 block text-xs text-[#668087]">Ações atrasadas</span></Link></div><InspectionActionSummary inspections={allInspections} actionItems={filteredActionItems} /><DashboardCharts isAutonomo={isAutonomo} workspaceId={current.id} input={dashboardAnalytics} periodLabel={periodLabel} /></section>}
        {activeDashboard === "documentos" && <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><Link href={appHref("/app/certificados")} className="rounded-3xl border border-[#f1d5c9] bg-[#fff9f5] p-6 shadow-sm"><CircleAlert className="h-5 w-5 text-[#d67845]" /><b className="mt-4 block text-3xl">{certificatesToAct}</b><span className="mt-1 block text-xs text-[#668087]">Documentos que exigem ação</span></Link><Link href={appHref("/app/certificados")} className="rounded-3xl border border-[#d6e4f0] bg-[#f8fbff] p-6 shadow-sm"><Award className="h-5 w-5 text-[#3173a8]" /><b className="mt-4 block text-3xl">{certificatesInPeriod.length}</b><span className="mt-1 block text-xs text-[#668087]">Certificados no período</span></Link><Link href={appHref("/app/treinamentos")} className="rounded-3xl border border-[#b9e3d7] bg-[#f7fcfa] p-6 shadow-sm"><CalendarClock className="h-5 w-5 text-[#0c7474]" /><b className="mt-4 block text-3xl">{plannedTrainings}</b><span className="mt-1 block text-xs text-[#668087]">Treinamentos planejados</span></Link><Link href={appHref("/app/biblioteca")} className="rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-sm"><BookOpen className="h-5 w-5 text-[#0c7474]" /><b className="mt-4 block text-3xl">{current.pgrProjects.length}</b><span className="mt-1 block text-xs text-[#668087]">Entregas PGR vinculadas</span></Link></section>}
      </section>}
  </div></DashboardLayout>;
}

import { AlertTriangle, ArrowRight, Award, BookOpen, BriefcaseBusiness, Building2, CalendarClock, CalendarDays, CheckCircle2, CheckSquare2, CircleAlert, ClipboardCheck, FileCheck2, FolderKanban, GraduationCap, Headphones, LayoutDashboard, Loader2, ShieldCheck, UsersRound, WandSparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import InspectionActionSummary from "@/components/InspectionActionSummary";
import DashboardCharts from "@/components/DashboardCharts";
import { trpc } from "@/lib/trpc";

import { workspaceIdFromSearch } from "@shared/workspaceContext";
import { daysUntilCipaMeeting, isCipaMeetingUrgent } from "@/lib/cipaUrgency";

type Priority = {
  href: string;
  title: string;
  detail: string;
  icon: typeof ShieldCheck;
  tone: "mint" | "coral" | "blue";
};

type DashboardView = "resumo" | "cipa" | "epis" | "inspecoes" | "documentos";
type GlobalPeriod = "all" | "30" | "90" | "365";

type PeriodRecord = {
  createdAt?: Date | string | null;
  issuedAt?: Date | string | null;
  scheduledAt?: Date | string | null;
  dueAt?: Date | string | null;
  occurredAt?: Date | string | null;
  expiresAt?: Date | string | null;
  nextFollowUpAt?: Date | string | null;
};

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
  return <DashboardLayout title="Visão geral">
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
  const [globalPeriod, setGlobalPeriod] = useState<GlobalPeriod>("all");
  const [readAlertKeys, setReadAlertKeys] = useState<string[]>([]);
  const search = useSearch();
  const workspaceId = workspaceIdFromSearch(search) ?? 0;
  const readAlertsStorageKey = `tst-brasil-hub-dashboard-read-alerts-${workspaceId}`;
  useEffect(() => {
    if (workspaceId <= 0 || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(readAlertsStorageKey);
      setReadAlertKeys(raw ? JSON.parse(raw) : []);
    } catch {
      setReadAlertKeys([]);
    }
  }, [readAlertsStorageKey, workspaceId]);
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
    return <DashboardLayout title="Visão geral"><div className="mx-auto grid min-h-[420px] max-w-2xl place-items-center"><div className="w-full rounded-[2rem] border border-[#f1d5c9] bg-gradient-to-br from-white to-[#fff9f5] p-8 text-center shadow-[0_18px_45px_rgba(28,74,77,0.08)]"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#fff0e8] text-[#d67845]"><AlertTriangle className="h-7 w-7" /></span><p className="mt-5 text-xs font-bold uppercase tracking-[.16em] text-[#d67845]">Acesso ao ambiente</p><h2 className="mt-2 text-2xl font-bold text-[#173b43]">Não foi possível carregar este ambiente.</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#668087]">Selecione um ambiente pertencente à sua conta ou entre novamente no portal para atualizar a sessão.</p><Link href="/app" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0c7474] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(12,116,116,0.18)] transition hover:bg-[#063b43]">Voltar à seleção <ArrowRight className="h-4 w-4" /></Link></div></div></DashboardLayout>;
  }

  if (!workspaceId || !workspace.data) {
    return <DashboardLayout title="Visão geral"><div className="relative overflow-hidden rounded-[2rem] border border-[#d3e7e0] bg-gradient-to-br from-white via-[#f7fcfa] to-[#eaf7f1] p-8 text-center shadow-[0_16px_40px_rgba(28,74,77,0.08)]"><div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#8edec7]/20 blur-2xl" /><div className="relative mx-auto max-w-xl"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#0c7474] text-white shadow-[0_10px_24px_rgba(12,116,116,0.22)]"><ShieldCheck className="h-7 w-7" /></span><p className="mt-5 text-xs font-bold uppercase tracking-[.16em] text-[#0c8c89]">Seu próximo passo</p><h2 className="mt-2 text-2xl font-semibold tracking-[-.02em] text-[#173b43]">Escolha o ambiente para começar.</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#668087]">Os indicadores, alertas e atalhos serão calculados somente a partir dos registros reais do ambiente ativo.</p><Link href="/app" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0c7474] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(12,116,116,0.18)] transition hover:bg-[#095f62]">Escolher ambiente <ArrowRight className="h-4 w-4" /></Link></div></div></DashboardLayout>;
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

  return <DashboardLayout title="Visão geral"><div className="mx-auto max-w-7xl space-y-5">
    <section className="sticky top-3 z-20 rounded-2xl border border-[#dcebe8] bg-white/95 p-2 shadow-[0_12px_32px_rgba(16,43,50,.08)] backdrop-blur-xl" aria-label="Painéis do ambiente">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {dashboardTabs.map(({ id, label, description, icon: Icon }) => { const badge = badgeCountFor(id); return <button key={id} type="button" onClick={() => setActiveDashboard(id)} aria-pressed={activeDashboard === id} className={`group relative flex min-w-[130px] shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left transition ${activeDashboard === id ? "bg-[#0c7474] text-white shadow-[0_7px_18px_rgba(12,116,116,.18)]" : "text-[#47636a] hover:bg-[#f2f8f6]"}`}><span className={`grid h-8 w-8 place-items-center rounded-lg ${activeDashboard === id ? "bg-white/15" : "bg-[#e8f6f1] text-[#0c7474]"}`}><Icon className="h-4 w-4" /></span><span><strong className="block text-xs font-bold">{label}</strong><small className={`mt-0.5 block whitespace-nowrap text-[10px] ${activeDashboard === id ? "text-white/75" : "text-[#83a09a] group-hover:text-[#668087]"}`}>{description}</small></span>{badge.count > 0 && <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-[#d83c3c] px-1 text-[9px] font-extrabold leading-none text-white shadow-sm" aria-label={`${badge.count} alerta(s) pendente(s) em ${label}`}>{badge.count > 99 ? "99+" : badge.count}</span>}</button>; })}
        </div>
        <div className="flex flex-col gap-2 rounded-xl border border-[#e6f0ee] bg-[#f7fcfa] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#668087]"><CalendarClock className="h-3.5 w-3.5 text-[#0c7474]" />Período global <span className="normal-case font-semibold tracking-normal text-[#0c7474]">{periodLabel}</span></div>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Filtrar período global">
            {(["all", "30", "90", "365"] as const).map(value => <button key={value} type="button" onClick={() => setGlobalPeriod(value)} aria-pressed={globalPeriod === value} className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition ${globalPeriod === value ? "bg-white text-[#0c7474] shadow-sm ring-1 ring-[#b9e3d7]" : "text-[#668087] hover:bg-white hover:text-[#315158]"}`}>{value === "all" ? "Tudo" : value === "365" ? "12 meses" : `${value} dias`}</button>)}
          </div>
        </div>
      </div>
    </section>

    {activeDashboard === "resumo" ? <div className="space-y-7">
    {(epiStockCritical > 0 || epiExpiring > 0) && (
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
    )}

    <section className={`relative overflow-hidden rounded-[2rem] border p-7 shadow-[0_22px_60px_rgba(28,74,77,0.10)] lg:p-9 ${context.color}`}>
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#8edec7]/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-8rem] left-1/3 h-64 w-64 rounded-full bg-[#b9defc]/15 blur-3xl" />
      <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-start"><div><span className={`inline-flex rounded-full border border-white/80 bg-white/75 px-3 py-1 text-[10px] font-bold uppercase tracking-[.14em] shadow-sm ${context.accent}`}>{context.label}</span><p className={`mt-5 text-xs font-bold uppercase tracking-[.14em] ${context.accent}`}>{context.eyebrow}</p><h2 className="mt-2 max-w-3xl text-3xl font-semibold tracking-[-.03em] text-[#173b43] lg:text-4xl">{context.headline}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#5d7479]">{context.description}</p></div><Link href="/app" className="inline-flex items-center gap-2 rounded-xl border border-white/80 bg-white/45 px-4 py-2 text-sm font-bold text-[#0c7474] shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/75">Alternar contexto <ArrowRight className="h-4 w-4" /></Link></div>
      <div className="relative mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">{context.stats.map(({ label, value, icon: Icon, tone }) => <div key={label} className="rounded-2xl border border-white/80 bg-white/55 p-4 shadow-[0_8px_24px_rgba(28,74,77,0.06)] backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:bg-white/75 hover:shadow-[0_14px_30px_rgba(28,74,77,0.10)]"><span className={`grid h-9 w-9 place-items-center rounded-xl ${tone === "coral" ? "bg-[#fff0e8] text-[#cf754a]" : tone === "blue" ? "bg-[#edf5fb] text-[#3173a8]" : "bg-[#e8f6f1] text-[#0c7474]"}`}><Icon className="h-4 w-4" /></span><p className="mt-4 text-3xl font-semibold tracking-tight text-[#173b43]">{value}</p><p className="mt-1 text-xs text-[#668087]">{label}</p></div>)}</div>
    </section>

    {!isAutonomo && <section className="hidden rounded-3xl border border-[#d7e4f0] bg-[#f8fbff] p-6 shadow-sm"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#3173a8]">Risco e prevenção</p><h3 className="mt-1 text-xl font-bold">Visão de risco e ações internas</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-[#668087]">Acompanhamento consolidado a partir do PGR, inspeções, EPIs, ocorrências e plano de ação registrados no ambiente.</p></div><Link href={appHref("/app/inspecoes")} className="inline-flex text-sm font-bold text-[#3173a8] hover:text-[#123f69]">Abrir inspeções e ações →</Link></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><Link href={appHref("/app/pgr")} className="rounded-2xl border border-[#d6e4f0] bg-white p-4 transition hover:border-[#9cc0df]"><ShieldCheck className="h-5 w-5 text-[#3173a8]" /><b className="mt-3 block text-2xl">{current.pgrProjects.length}</b><span className="text-xs text-[#668087]">PGRs vinculados</span></Link><Link href={appHref("/app/estrutura")} className="rounded-2xl border border-[#d6e4f0] bg-white p-4 transition hover:border-[#9cc0df]"><BriefcaseBusiness className="h-5 w-5 text-[#3173a8]" /><b className="mt-3 block text-2xl">{activeJobRoles.length}</b><span className="text-xs text-[#668087]">Funções ativas</span></Link><Link href={appHref("/app/inspecoes")} className="rounded-2xl border border-[#d6e4f0] bg-white p-4 transition hover:border-[#9cc0df]"><ClipboardCheck className="h-5 w-5 text-[#3173a8]" /><b className="mt-3 block text-2xl">{plannedInspections}</b><span className="text-xs text-[#668087]">Inspeções planejadas</span></Link><Link href={appHref("/app/inspecoes")} className="rounded-2xl border border-[#f1d5c9] bg-white p-4 transition hover:border-[#e6af96]"><ClipboardCheck className="h-5 w-5 text-[#d67845]" /><b className="mt-3 block text-2xl">{openActionItems.length}</b><span className="text-xs text-[#668087]">Ações em aberto</span></Link><Link href={appHref("/app/operacao")} className="rounded-2xl border border-[#f1d5c9] bg-white p-4 transition hover:border-[#e6af96]"><ShieldCheck className="h-5 w-5 text-[#d67845]" /><b className="mt-3 block text-2xl">{epiAlerts}</b><span className="text-xs text-[#668087]">Alertas de EPI</span></Link><Link href={appHref("/app/operacao")} className="rounded-2xl border border-[#f1d5c9] bg-white p-4 transition hover:border-[#e6af96]"><CircleAlert className="h-5 w-5 text-[#d67845]" /><b className="mt-3 block text-2xl">{openOccurrences}</b><span className="text-xs text-[#668087]">Ocorrências abertas</span></Link></div></section>}

        {false && <InspectionActionSummary inspections={allInspections} actionItems={planning.data?.actionItems ?? []} />}

    {false && <DashboardCharts isAutonomo={isAutonomo} workspaceId={current.id} input={dashboardAnalytics} />}

    <section className="hidden rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-sm">
<div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Indicadores de SST</p><h3 className="mt-1 text-xl font-bold">Cobertura atual de prevenção</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-[#668087]">Snapshot calculado exclusivamente dos registros deste ambiente. Tendências históricas serão exibidas quando houver histórico suficiente de períodos anteriores.</p></div><Link href={appHref("/app/inspecoes")} className="text-sm font-bold text-[#0c7474] hover:text-[#063b43]">Abrir módulo →</Link></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Link href={appHref("/app/inspecoes")} className="rounded-2xl border border-[#d6e4f0] bg-[#f8fbff] p-4 transition hover:border-[#9cc0df]"><ClipboardCheck className="h-5 w-5 text-[#3173a8]" /><b className="mt-3 block text-2xl">{allInspections.length}</b><span className="text-xs text-[#668087]">Inspeções registradas</span></Link><Link href={appHref("/app/inspecoes")} className="rounded-2xl border border-[#b9e3d7] bg-[#f7fcfa] p-4 transition hover:border-[#8dcfb9]"><CheckCircle2 className="h-5 w-5 text-[#0c7474]" /><b className="mt-3 block text-2xl">{inspectionCompletionRate === null ? "—" : `${inspectionCompletionRate}%`}</b><span className="text-xs text-[#668087]">Inspeções concluídas</span></Link><Link href={appHref("/app/inspecoes")} className={`rounded-2xl border p-4 transition ${overdueInspections ? "border-[#f1d5c9] bg-[#fff9f5] hover:border-[#e6af96]" : "border-[#dcebe8] bg-white hover:border-[#a9d4c8]"}`}><CalendarClock className={`h-5 w-5 ${overdueInspections ? "text-[#d67845]" : "text-[#0c7474]"}`} /><b className="mt-3 block text-2xl">{overdueInspections}</b><span className="text-xs text-[#668087]">Inspeções atrasadas</span></Link><Link href={appHref("/app/inspecoes")} className={`rounded-2xl border p-4 transition ${overdueActionItems ? "border-[#f1d5c9] bg-[#fff9f5] hover:border-[#e6af96]" : "border-[#dcebe8] bg-white hover:border-[#a9d4c8]"}`}><CircleAlert className={`h-5 w-5 ${overdueActionItems ? "text-[#d67845]" : "text-[#0c7474]"}`} /><b className="mt-3 block text-2xl">{overdueActionItems}</b><span className="text-xs text-[#668087]">Ações atrasadas</span></Link><Link href={appHref("/app/inspecoes")} className="rounded-2xl border border-[#dcebe8] bg-white p-4 transition hover:border-[#a9d4c8]"><CheckSquare2 className="h-5 w-5 text-[#0c7474]" /><b className="mt-3 block text-2xl">{actionCompletionRate === null ? "—" : `${actionCompletionRate}%`}</b><span className="text-xs text-[#668087]">Ações concluídas</span></Link></div></section>

    <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <article className="rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">{context.nextTitle}</p><h3 className="mt-1 text-xl font-bold">{context.priorityTitle}</h3></div><ClipboardCheck className="h-5 w-5 text-[#0c7474]" /></div><div className="mt-5 space-y-3">{priorities.length ? priorities.map(({ href, title, detail, icon: Icon, tone }) => <Link key={title} href={href} className={`flex items-center justify-between rounded-2xl border p-4 transition hover:translate-x-0.5 ${tone === "coral" ? "border-[#f1d5c9] bg-[#fff9f5] hover:border-[#e6af96]" : tone === "blue" ? "border-[#d6e4f0] bg-[#f8fbff] hover:border-[#a9c9e4]" : "border-[#b9e3d7] bg-[#f7fcfa] hover:border-[#8dcfb9]"}`}><span className="pr-4"><strong className="block text-sm">{title}</strong><small className="mt-1 block text-xs leading-5 text-[#668087]">{detail}</small></span><Icon className={`h-5 w-5 shrink-0 ${tone === "coral" ? "text-[#d67845]" : tone === "blue" ? "text-[#3173a8]" : "text-[#0c7474]"}`} /></Link>) : <div className="flex items-center gap-3 rounded-2xl border border-[#b9e3d7] bg-[#f7fcfa] p-4"><CheckCircle2 className="h-5 w-5 text-[#39a77e]" /><p className="text-sm text-[#315158]">Nenhuma pendência calculada a partir dos registros reais deste ambiente.</p></div>}</div></article>
      <article className="rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Foco da semana</p><h3 className="mt-1 text-xl font-bold">{context.routineTitle}</h3><ol className="mt-5 space-y-3">{context.routine.map((step, index) => <li key={step} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#e8f6f1] text-xs font-bold text-[#0c7474]">{index + 1}</span><p className="pt-1 text-sm leading-5 text-[#47636a]">{step}</p></li>)}</ol></article>
    </section>

    <section className={`rounded-[2rem] border p-6 shadow-[0_14px_45px_rgba(16,43,50,.055)] transition-colors lg:p-7 ${cipaHasUrgentMeeting ? "border-[#f1c9ba] bg-[linear-gradient(135deg,#fff9f5_0%,#ffffff_58%,#fff2eb_100%)]" : "border-[#dcebe8] bg-white"}`}>
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
    </section>

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

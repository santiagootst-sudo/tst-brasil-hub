import { ArrowRight, Award, BookOpen, BriefcaseBusiness, Building2, CalendarClock, CheckCircle2, CircleAlert, ClipboardCheck, FileCheck2, FolderKanban, GraduationCap, Headphones, LayoutDashboard, Loader2, ShieldCheck, UsersRound } from "lucide-react";
import { Link, useSearch } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import InspectionActionSummary from "@/components/InspectionActionSummary";
import { trpc } from "@/lib/trpc";
import { workspaceIdFromSearch } from "@shared/workspaceContext";

type Priority = {
  href: string;
  title: string;
  detail: string;
  icon: typeof ShieldCheck;
  tone: "mint" | "coral" | "blue";
};

function daysUntil(date: Date | string | null) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}

export default function WorkspaceOverview() {
  const search = useSearch();
  const workspaceId = workspaceIdFromSearch(search) ?? 0;
  const queryOptions = { enabled: Number.isInteger(workspaceId) && workspaceId > 0 };
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

  if (workspace.isLoading || certificates.isLoading || trainings.isLoading || organization.isLoading || operations.isLoading || planning.isLoading || (workspace.data?.kind === "autonomo" && commercial.isLoading)) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="animate-spin text-[#0c7474]" /></div>;
  }

  if (!workspaceId || !workspace.data) {
    return <DashboardLayout title="Visão geral"><div className="rounded-3xl border border-dashed border-[#bddbd5] bg-white p-10 text-center"><LayoutDashboard className="mx-auto h-9 w-9 text-[#0c7474]" /><h2 className="mt-4 text-2xl font-bold">Selecione um ambiente para ver o painel.</h2><p className="mt-2 text-sm text-[#668087]">Os indicadores são calculados somente a partir dos registros reais do ambiente ativo.</p><Link href="/app" className="mt-6 inline-flex rounded-xl bg-[#0c7474] px-5 py-3 text-sm font-bold text-white">Escolher ambiente</Link></div></DashboardLayout>;
  }

  const current = workspace.data;
  const isAutonomo = current.kind === "autonomo";
  const expiredCertificates = certificates.data?.filter(item => (daysUntil(item.expiresAt) ?? 0) < 0).length ?? 0;
  const expiringCertificates = certificates.data?.filter(item => { const days = daysUntil(item.expiresAt); return days !== null && days >= 0 && days <= 30; }).length ?? 0;
  const certificatesToAct = expiredCertificates + expiringCertificates;
  const plannedTrainings = trainings.data?.filter(item => item.status === "planned").length ?? 0;
  const activeEmployees = organization.data?.employees.filter(item => item.status === "active") ?? [];
  const activeDepartments = organization.data?.departments.filter(item => item.active) ?? [];
  const activeJobRoles = organization.data?.jobRoles.filter(item => item.active) ?? [];
  const employeesWithoutDepartment = activeEmployees.filter(item => !item.departmentId).length;
  const employeesWithoutRole = activeEmployees.filter(item => !item.jobRoleId).length;
  const epiItems = operations.data?.epiItems.filter(item => item.active) ?? [];
  const epiStockCritical = epiItems.filter(item => item.stockQuantity <= item.minimumStock).length;
  const epiExpiring = epiItems.filter(item => item.expiresAt && daysUntil(item.expiresAt) !== null && (daysUntil(item.expiresAt) ?? 0) <= 30).length;
  const epiAlerts = epiStockCritical + epiExpiring;
  const openOccurrences = operations.data?.occurrences.filter(item => item.status !== "closed").length ?? 0;
  const plannedInspections = planning.data?.inspections.filter(item => item.status === "planned").length ?? 0;
  const openActionItems = planning.data?.actionItems.filter(item => item.status !== "completed") ?? [];
  const overdueActionItems = openActionItems.filter(item => item.dueAt && daysUntil(item.dueAt) !== null && (daysUntil(item.dueAt) ?? 0) < 0).length;
  const clientEngagements = commercial.data?.engagements ?? [];
  const clientVisits = commercial.data?.visits ?? [];
  const activeClients = clientEngagements.filter(item => item.status === "active").length;
  const followUpsIn30Days = clientEngagements.filter(item => item.nextFollowUpAt && (daysUntil(item.nextFollowUpAt) ?? Infinity) <= 30 && item.status !== "inactive").length;
  const plannedVisits = clientVisits.filter(item => item.status === "planned").length;
  const appHref = (path: string) => `${path}?workspace=${current.id}`;

  const context = isAutonomo
    ? {
      label: "TST Autônomo",
      eyebrow: "Modo atendimento",
      headline: "Carteira, entregas e clientes sob controle.",
      description: "Comece pelo que afeta uma entrega ao cliente: empresas atendidas, PGRs em andamento e compromissos que precisam de retorno.",
      priorityTitle: "Prioridades da carteira",
      routineTitle: "Roteiro de atendimento",
      nextTitle: "Próxima entrega",
      color: "bg-[#063b43]",
      accent: "text-[#8edec7]",
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
      color: "bg-[#123f69]",
      accent: "text-[#b9defc]",
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
        { href: appHref("/app/operacao"), icon: ShieldCheck, title: "Controle operacional", text: "EPIs e ocorrências SST" },
        { href: appHref("/app/inspecoes"), icon: ClipboardCheck, title: "Inspeções e ações", text: "Prevenção e prazos" },
        { href: appHref("/app/treinamentos"), icon: UsersRound, title: "Capacitação da equipe", text: "Planejamento e execução" },
        { href: appHref("/app/certificados"), icon: Award, title: "Conformidade documental", text: "Validades e evidências" },
        { href: appHref("/app/pgr"), icon: ShieldCheck, title: "PGR da operação", text: "Riscos e documentos" },
        { href: appHref("/app/materiais"), icon: FolderKanban, title: "Procedimentos internos", text: "Modelos e checklists" },
        { href: appHref("/app/biblioteca"), icon: BookOpen, title: "Biblioteca técnica", text: "Referências oficiais" },
        { href: appHref("/app/suporte"), icon: Headphones, title: "Suporte", text: "Chamados organizados" },
      ],
    };

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
      href: appHref("/app/operacao"),
      title: `${openOccurrences} ocorrência(s) SST em acompanhamento`,
      detail: "Registre a análise e mantenha o acompanhamento objetivo, sem dados médicos sensíveis.",
      icon: CircleAlert,
      tone: "coral" as const,
    },
    openActionItems.length > 0 && {
      href: appHref("/app/inspecoes"),
      title: `${openActionItems.length} ação(ões) preventiva(s) em acompanhamento`,
      detail: overdueActionItems > 0 ? `${overdueActionItems} ação(ões) estão com prazo vencido.` : "Acompanhe responsável, prazo e evidência de cada medida.",
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

  return <DashboardLayout title="Visão geral"><div className="mx-auto max-w-7xl space-y-7">
    <section className={`overflow-hidden rounded-[2rem] p-7 text-white shadow-lg lg:p-9 ${context.color}`}>
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start"><div><span className={`rounded-lg bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[.14em] ${context.accent}`}>{context.label}</span><p className={`mt-5 text-xs font-bold uppercase tracking-[.14em] ${context.accent}`}>{context.eyebrow}</p><h2 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight lg:text-4xl">{context.headline}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">{context.description}</p></div><Link href="/app" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-white hover:bg-white/10">Alternar contexto <ArrowRight className="h-4 w-4" /></Link></div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">{context.stats.map(({ label, value, icon: Icon, tone }) => <div key={label} className="rounded-2xl border border-white/10 bg-white/8 p-4"><span className={`grid h-9 w-9 place-items-center rounded-xl ${tone === "coral" ? "bg-[#e98766]/15 text-[#ffb69d]" : tone === "blue" ? "bg-[#b9defc]/15 text-[#b9defc]" : "bg-[#8edec7]/15 text-[#8edec7]"}`}><Icon className="h-4 w-4" /></span><p className="mt-4 text-3xl font-bold">{value}</p><p className="mt-1 text-xs text-white/70">{label}</p></div>)}</div>
    </section>

    {!isAutonomo && <section className="rounded-3xl border border-[#d7e4f0] bg-[#f8fbff] p-6 shadow-sm"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#3173a8]">Risco e prevenção</p><h3 className="mt-1 text-xl font-bold">Visão de risco e ações internas</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-[#668087]">Acompanhamento consolidado a partir do PGR, inspeções, EPIs, ocorrências e plano de ação registrados no ambiente.</p></div><Link href={appHref("/app/inspecoes")} className="inline-flex text-sm font-bold text-[#3173a8] hover:text-[#123f69]">Abrir inspeções e ações →</Link></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><Link href={appHref("/app/pgr")} className="rounded-2xl border border-[#d6e4f0] bg-white p-4 transition hover:border-[#9cc0df]"><ShieldCheck className="h-5 w-5 text-[#3173a8]" /><b className="mt-3 block text-2xl">{current.pgrProjects.length}</b><span className="text-xs text-[#668087]">PGRs vinculados</span></Link><Link href={appHref("/app/estrutura")} className="rounded-2xl border border-[#d6e4f0] bg-white p-4 transition hover:border-[#9cc0df]"><BriefcaseBusiness className="h-5 w-5 text-[#3173a8]" /><b className="mt-3 block text-2xl">{activeJobRoles.length}</b><span className="text-xs text-[#668087]">Funções ativas</span></Link><Link href={appHref("/app/inspecoes")} className="rounded-2xl border border-[#d6e4f0] bg-white p-4 transition hover:border-[#9cc0df]"><ClipboardCheck className="h-5 w-5 text-[#3173a8]" /><b className="mt-3 block text-2xl">{plannedInspections}</b><span className="text-xs text-[#668087]">Inspeções planejadas</span></Link><Link href={appHref("/app/inspecoes")} className="rounded-2xl border border-[#f1d5c9] bg-white p-4 transition hover:border-[#e6af96]"><ClipboardCheck className="h-5 w-5 text-[#d67845]" /><b className="mt-3 block text-2xl">{openActionItems.length}</b><span className="text-xs text-[#668087]">Ações em aberto</span></Link><Link href={appHref("/app/operacao")} className="rounded-2xl border border-[#f1d5c9] bg-white p-4 transition hover:border-[#e6af96]"><ShieldCheck className="h-5 w-5 text-[#d67845]" /><b className="mt-3 block text-2xl">{epiAlerts}</b><span className="text-xs text-[#668087]">Alertas de EPI</span></Link><Link href={appHref("/app/operacao")} className="rounded-2xl border border-[#f1d5c9] bg-white p-4 transition hover:border-[#e6af96]"><CircleAlert className="h-5 w-5 text-[#d67845]" /><b className="mt-3 block text-2xl">{openOccurrences}</b><span className="text-xs text-[#668087]">Ocorrências abertas</span></Link></div></section>}

    <InspectionActionSummary inspections={planning.data?.inspections ?? []} actionItems={planning.data?.actionItems ?? []} />

    <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <article className="rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">{context.nextTitle}</p><h3 className="mt-1 text-xl font-bold">{context.priorityTitle}</h3></div><ClipboardCheck className="h-5 w-5 text-[#0c7474]" /></div><div className="mt-5 space-y-3">{priorities.length ? priorities.map(({ href, title, detail, icon: Icon, tone }) => <Link key={title} href={href} className={`flex items-center justify-between rounded-2xl border p-4 transition hover:translate-x-0.5 ${tone === "coral" ? "border-[#f1d5c9] bg-[#fff9f5] hover:border-[#e6af96]" : tone === "blue" ? "border-[#d6e4f0] bg-[#f8fbff] hover:border-[#a9c9e4]" : "border-[#b9e3d7] bg-[#f7fcfa] hover:border-[#8dcfb9]"}`}><span className="pr-4"><strong className="block text-sm">{title}</strong><small className="mt-1 block text-xs leading-5 text-[#668087]">{detail}</small></span><Icon className={`h-5 w-5 shrink-0 ${tone === "coral" ? "text-[#d67845]" : tone === "blue" ? "text-[#3173a8]" : "text-[#0c7474]"}`} /></Link>) : <div className="flex items-center gap-3 rounded-2xl border border-[#b9e3d7] bg-[#f7fcfa] p-4"><CheckCircle2 className="h-5 w-5 text-[#39a77e]" /><p className="text-sm text-[#315158]">Nenhuma pendência calculada a partir dos registros reais deste ambiente.</p></div>}</div></article>
      <article className="rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Foco da semana</p><h3 className="mt-1 text-xl font-bold">{context.routineTitle}</h3><ol className="mt-5 space-y-3">{context.routine.map((step, index) => <li key={step} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#e8f6f1] text-xs font-bold text-[#0c7474]">{index + 1}</span><p className="pt-1 text-sm leading-5 text-[#47636a]">{step}</p></li>)}</ol></article>
    </section>

    <section className="rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-sm"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Ferramentas compartilhadas</p><h3 className="mt-1 text-xl font-bold">Atalhos na ordem da sua rotina</h3></div><p className="max-w-sm text-sm text-[#668087]">As mesmas ferramentas permanecem disponíveis nos dois ambientes; a ordem muda conforme a prioridade de trabalho.</p></div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{context.tools.map(({ href, icon: Icon, title, text }, index) => <Link key={title} href={href} className="group flex items-center gap-3 rounded-2xl border border-[#e6f0ee] p-4 transition hover:border-[#a9d4c8] hover:bg-[#fbfefd]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e8f6f1] text-[#0c7474]"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block text-sm">{title}</strong><small className="text-xs text-[#668087]">{text}</small></span><span className="text-xs font-bold text-[#90ada9] group-hover:text-[#0c7474]">0{index + 1}</span></Link>)}</div></section>
  </div></DashboardLayout>;
}

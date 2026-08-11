import { ArrowRight, Award, BookOpen, Building2, CalendarClock, CheckCircle2, CircleAlert, ClipboardList, FolderKanban, GraduationCap, Headphones, LayoutDashboard, Loader2, ShieldCheck, UsersRound } from "lucide-react";
import { Link, useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";

function daysUntil(date: Date | string | null) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}

export default function WorkspaceOverview() {
  const [location] = useLocation();
  const workspaceId = Number(new URLSearchParams(location.split("?")[1] ?? "").get("workspace"));
  const workspace = trpc.portal.workspace.useQuery({ workspaceId }, { enabled: Number.isInteger(workspaceId) && workspaceId > 0 });
  const certificates = trpc.portal.certificates.useQuery({ workspaceId }, { enabled: Number.isInteger(workspaceId) && workspaceId > 0 });
  const trainings = trpc.portal.trainings.useQuery({ workspaceId }, { enabled: Number.isInteger(workspaceId) && workspaceId > 0 });

  if (workspace.isLoading || certificates.isLoading || trainings.isLoading) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="animate-spin text-[#0c7474]" /></div>;
  }

  if (!workspaceId || !workspace.data) {
    return <DashboardLayout title="Visão geral"><div className="rounded-3xl border border-dashed border-[#bddbd5] bg-white p-10 text-center"><LayoutDashboard className="mx-auto h-9 w-9 text-[#0c7474]" /><h2 className="mt-4 text-2xl font-bold">Selecione um ambiente para ver o painel.</h2><p className="mt-2 text-sm text-[#668087]">Os indicadores são calculados a partir dos registros reais do ambiente ativo.</p><Link href="/app" className="mt-6 inline-flex rounded-xl bg-[#0c7474] px-5 py-3 text-sm font-bold text-white">Escolher ambiente</Link></div></DashboardLayout>;
  }

  const current = workspace.data;
  const expiringCertificates = certificates.data?.filter(certificate => { const days = daysUntil(certificate.expiresAt); return days !== null && days >= 0 && days <= 30; }).length ?? 0;
  const expiredCertificates = certificates.data?.filter(certificate => { const days = daysUntil(certificate.expiresAt); return days !== null && days < 0; }).length ?? 0;
  const plannedTrainings = trainings.data?.filter(training => training.status === "planned").length ?? 0;
  const isAutonomo = current.kind === "autonomo";
  const statCards = isAutonomo ? [
    { label: "Empresas atendidas", value: current.companies.length, icon: Building2, tone: "mint" },
    { label: "Projetos PGR", value: current.pgrProjects.length, icon: ShieldCheck, tone: "blue" },
    { label: "Treinamentos de clientes", value: plannedTrainings, icon: GraduationCap, tone: "mint" },
    { label: "Certificados a tratar", value: expiringCertificates + expiredCertificates, icon: Award, tone: "coral" },
  ] : [
    { label: "Treinamentos planejados", value: plannedTrainings, icon: GraduationCap, tone: "blue" },
    { label: "Certificados a tratar", value: expiringCertificates + expiredCertificates, icon: Award, tone: "coral" },
    { label: "Projetos PGR", value: current.pgrProjects.length, icon: ShieldCheck, tone: "mint" },
    { label: "Empresas vinculadas", value: current.companies.length, icon: Building2, tone: "blue" },
  ];
  const focus = isAutonomo
    ? { eyebrow: "Operação de consultoria", title: "Prioridades da carteira", empty: "Nenhuma pendência calculada para a carteira. Continue mantendo PGRs, treinamentos e certificados atualizados." }
    : { eyebrow: "Rotina interna de SST", title: "Prioridades da empresa", empty: "Nenhuma pendência calculada para a empresa. Continue mantendo PGR, treinamentos e certificados atualizados." };
  const quickTools = [
    { href: `/app/pgr?workspace=${current.id}`, icon: ShieldCheck, title: "Gerador de PGR", text: "Projetos, riscos e documentos" },
    { href: "/app/treinamentos", icon: UsersRound, title: "Treinamentos", text: "Planejamento por ambiente" },
    { href: "/app/certificados", icon: Award, title: "Certificados", text: "Validade e evidências" },
    { href: "/app/biblioteca", icon: BookOpen, title: "Biblioteca", text: "Fontes oficiais e orientação" },
    { href: "/app/materiais", icon: FolderKanban, title: "Materiais", text: "Modelos, checklists e procedimentos" },
    { href: "/app/suporte", icon: Headphones, title: "Suporte", text: "Chamados organizados por ambiente" },
  ];

  return <DashboardLayout title="Visão geral"><div className="mx-auto max-w-6xl"><section className={`overflow-hidden rounded-[2rem] p-7 text-white shadow-lg lg:p-9 ${isAutonomo ? "bg-[#063b43]" : "bg-[#123f69]"}`}><div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start"><div><span className={`rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em] ${isAutonomo ? "bg-[#8edec7]/15 text-[#8edec7]" : "bg-[#b9defc]/15 text-[#b9defc]"}`}>TST {isAutonomo ? "Autônomo" : "CLT"}</span><h2 className="mt-5 text-3xl font-bold tracking-tight">{current.name}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#c5e2dc]">{isAutonomo ? "Priorize clientes, empresas, entregas e a gestão da sua carteira de serviços." : "Priorize pessoas, conformidade, capacitações e a rotina interna de SST."}</p></div><Link href="/app" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-white hover:bg-white/10">Trocar ambiente <ArrowRight className="h-4 w-4" /></Link></div><div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{statCards.map(({ label, value, icon: Icon, tone }) => <div key={label} className="rounded-2xl border border-white/10 bg-white/8 p-4"><span className={`grid h-9 w-9 place-items-center rounded-xl ${tone === "coral" ? "bg-[#e98766]/15 text-[#ffb69d]" : tone === "blue" ? "bg-[#b9defc]/15 text-[#b9defc]" : "bg-[#8edec7]/15 text-[#8edec7]"}`}><Icon className="h-4 w-4" /></span><p className="mt-4 text-3xl font-bold">{value}</p><p className="mt-1 text-xs text-[#c5e2dc]">{label}</p></div>)}</div></section><section className="mt-7 grid gap-5 lg:grid-cols-[1.25fr_.75fr]"><article className="rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">{focus.eyebrow}</p><h3 className="mt-1 text-xl font-bold">{focus.title}</h3></div><ClipboardList className="h-5 w-5 text-[#0c7474]" /></div><div className="mt-5 space-y-3">{current.pgrProjects.length === 0 && <Link href={`/app/pgr?workspace=${current.id}`} className="flex items-center justify-between rounded-2xl border border-[#b9e3d7] bg-[#f7fcfa] p-4"><span><strong className="block text-sm">Criar o primeiro projeto PGR</strong><small className="mt-1 block text-xs text-[#668087]">{isAutonomo ? "Inicie pelo cliente e mantenha cada entrega organizada." : "Inicie pela empresa e mantenha o escopo organizado."}</small></span><ArrowRight className="h-4 w-4 text-[#0c7474]" /></Link>}{plannedTrainings > 0 && <Link href="/app/treinamentos" className="flex items-center justify-between rounded-2xl border border-[#dcebe8] p-4 hover:border-[#9ccfc4]"><span><strong className="block text-sm">Revisar {plannedTrainings} treinamento(s) planejado(s)</strong><small className="mt-1 block text-xs text-[#668087]">{isAutonomo ? "Confirme a programação com a empresa atendida." : "Confirme data, participantes e execução interna."}</small></span><CalendarClock className="h-4 w-4 text-[#0c7474]" /></Link>}{(expiringCertificates + expiredCertificates) > 0 && <Link href="/app/certificados" className="flex items-center justify-between rounded-2xl border border-[#f1d5c9] bg-[#fff9f5] p-4"><span><strong className="block text-sm">Tratar certificados vencidos ou próximos do vencimento</strong><small className="mt-1 block text-xs text-[#8c6a58]">{expiredCertificates} vencido(s) e {expiringCertificates} com vencimento em até 30 dias.</small></span><CircleAlert className="h-4 w-4 text-[#d67845]" /></Link>}{current.pgrProjects.length > 0 && plannedTrainings === 0 && expiringCertificates + expiredCertificates === 0 && <div className="flex items-center gap-3 rounded-2xl border border-[#b9e3d7] bg-[#f7fcfa] p-4"><CheckCircle2 className="h-5 w-5 text-[#39a77e]" /><p className="text-sm text-[#315158]">{focus.empty}</p></div>}</div></article><article className="rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Ecossistema compartilhado</p><h3 className="mt-1 text-xl font-bold">Ferramentas deste contexto</h3><div className="mt-5 grid gap-3">{quickTools.map(({ href, icon: Icon, title, text }) => <Link key={title} href={href} className="flex items-center gap-3 rounded-2xl border border-[#e6f0ee] p-3 transition hover:border-[#a9d4c8] hover:bg-[#fbfefd]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e8f6f1] text-[#0c7474]"><Icon className="h-4 w-4" /></span><span><strong className="block text-sm">{title}</strong><small className="text-xs text-[#668087]">{text}</small></span></Link>)}</div></article></section></div></DashboardLayout>;
}

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { withWorkspaceContext, workspaceIdFromSearch } from "@shared/workspaceContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { LayoutDashboard, BriefcaseBusiness, CalendarDays, UsersRound, ShieldCheck, ShieldAlert, FolderKanban, Trophy, HardHat, GraduationCap, Library, Headphones, Bell, Menu, X, Award, BookOpen } from "lucide-react";

type DashboardLayoutProps = {
  children: ReactNode;
  title?: string;
};

export default function DashboardLayout({ children, title = "Portal TST Brasil" }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const collapsed = false;
  const workspaceId = workspaceIdFromSearch(search);
  const workspace = trpc.portal.workspace.useQuery(
    { workspaceId: workspaceId ?? 0 },
    { enabled: Boolean(workspaceId && workspaceId > 0) },
  );
  const developmentWorkspaces = trpc.portal.workspaces.useQuery();
  const currentWorkspace = workspace.data;
  const [switchingWorkspaceId, setSwitchingWorkspaceId] = useState<number | null>(null);
  const [switchingToastId, setSwitchingToastId] = useState<string | number | undefined>(undefined);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!switchingWorkspaceId || currentWorkspace?.id !== switchingWorkspaceId) return;
    const label = currentWorkspace.kind === "autonomo" ? "TST Autônomo" : "TST CLT";
    toast.success(`${label} aberto com sucesso.`, { id: switchingToastId });
    setSwitchingWorkspaceId(null);
    setSwitchingToastId(undefined);
  }, [currentWorkspace?.id, currentWorkspace?.kind, switchingToastId, switchingWorkspaceId]);

  const switchWorkspace = (workspaceId: number, kind: "autonomo" | "clt") => {
    if (workspaceId === currentWorkspace?.id) return;
    setSwitchingWorkspaceId(workspaceId);
    setSwitchingToastId(toast.loading(`Abrindo TST ${kind === "autonomo" ? "Autônomo" : "CLT"}...`));
    setLocation(`/app/visao?workspace=${workspaceId}`);
  };
  const isAutonomo = currentWorkspace?.kind === "autonomo";
  const isClt = currentWorkspace?.kind === "clt";
  const menuSections = isAutonomo ? [
    { label: "Principal", items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/app" },
      { label: "Empresas e clientes", icon: BriefcaseBusiness, path: "/app/clientes" },
      { label: "Agenda de visitas", icon: CalendarDays, path: "/app/agenda" },
      { label: "Estrutura dos clientes", icon: UsersRound, path: "/app/estrutura" },
    ] },
    { label: "Documentos", items: [
      { label: "Gerador de PGR", icon: ShieldCheck, path: "/app/pgr" },
      { label: "Riscos Psicossociais (COPSOQ)", icon: ShieldAlert, path: "/app/copsoq" },
      { label: "Modelos e anexos", icon: FolderKanban, path: "/app/materiais" },
      { label: "Documentos e certificados", icon: Trophy, path: "/app/certificados" },
    ] },
    { label: "Negócio", items: [
      { label: "Controle por cliente", icon: HardHat, path: "/app/operacao" },
      { label: "Inspeções e ações", icon: ShieldCheck, path: "/app/inspecoes" },
    ] },
    { label: "Conhecimento", items: [
      { label: "Cursos e treinamentos", icon: GraduationCap, path: "/app/treinamentos" },
      { label: "Biblioteca técnica", icon: Library, path: "/app/biblioteca" },
      { label: "Suporte", icon: Headphones, path: "/app/suporte" },
    ] },
  ] : isClt ? [
    { label: "Operação", items: [
      { label: "Visão geral", icon: LayoutDashboard, path: "/app" },
      { label: "Estrutura e equipe", icon: UsersRound, path: "/app/estrutura" },
      { label: "Controle operacional", icon: HardHat, path: "/app/operacao" },
      { label: "Inspeções e ações", icon: ShieldCheck, path: "/app/inspecoes" },
    ] },
    { label: "Conformidade", items: [
      { label: "Capacitação da equipe", icon: GraduationCap, path: "/app/treinamentos" },
      { label: "Documentos e certificados", icon: Trophy, path: "/app/certificados" },
      { label: "PGR da operação", icon: ShieldCheck, path: "/app/pgr" },
      { label: "Riscos Psicossociais (COPSOQ)", icon: ShieldAlert, path: "/app/copsoq" },
      { label: "Procedimentos internos", icon: FolderKanban, path: "/app/materiais" },
    ] },
    { label: "Conhecimento", items: [
      { label: "Biblioteca técnica", icon: Library, path: "/app/biblioteca" },
      { label: "Suporte", icon: Headphones, path: "/app/suporte" },
    ] },
  ] : [{ label: "Aplicativos", items: [
    { label: "Visão geral", icon: LayoutDashboard, path: "/app" },
    { label: "Gerador de PGR", icon: ShieldCheck, path: "/app/pgr" },
    { label: "Riscos Psicossociais (COPSOQ)", icon: ShieldAlert, path: "/app/copsoq" },
    { label: "Estrutura e equipe", icon: UsersRound, path: "/app/estrutura" },
    { label: "Controle operacional", icon: HardHat, path: "/app/operacao" },
    { label: "Inspeções e ações", icon: ShieldCheck, path: "/app/inspecoes" },
    { label: "Treinamentos", icon: GraduationCap, path: "/app/treinamentos" },
    { label: "Biblioteca", icon: Library, path: "/app/biblioteca" },
    { label: "Materiais", icon: FolderKanban, path: "/app/materiais" },
    { label: "Suporte", icon: Headphones, path: "/app/suporte" },
    { label: "Certificados", icon: Trophy, path: "/app/certificados" },
  ] }];
  const pathWithWorkspace = (path: string) => {
    if (path === "/app") return withWorkspaceContext("/app/visao", workspaceId);
    return withWorkspaceContext(path, workspaceId);
  };

  return (
    <div className="min-h-screen bg-[#f6faf9] text-[#102b32]">
      <aside className={`fixed inset-y-0 left-0 z-30 hidden w-72 flex-col px-3 py-5 text-[#d9eeea] shadow-2xl lg:flex ${isClt ? "bg-[#123f69]" : "bg-[#063b43]"}`}>
        <div className="mb-7 flex items-center px-3">
          <img src="/manus-storage/portal-tst-logo-clean_28523a59.png" alt="Portal TST Brasil" className="h-14 w-[214px] object-contain object-left" />
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto pr-1">
          {user?.role === "admin" && <section><p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8abfb5]">Administração</p><Link href="/admin" className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${location === "/admin" ? "bg-[#77cdb2]/18 text-white shadow-inner" : "text-[#c4e2dc] hover:bg-white/8 hover:text-white"}`}><UsersRound className="h-4 w-4" /><span>Gestão de acessos</span></Link></section>}
          {menuSections.map(section => <section key={section.label}><p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8abfb5]">{section.label}</p>{section.items.map(({ label, icon: Icon, path }) => {
            const active = path === "/app" ? location === "/app" || location === "/app/visao" : location === path;
            return <Link key={path} href={pathWithWorkspace(path)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-[#77cdb2]/18 text-white shadow-inner" : "text-[#c4e2dc] hover:bg-white/8 hover:text-white"}`}><Icon className="h-4 w-4" /><span>{label}</span></Link>;
          })}</section>)}
        </nav>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          {currentWorkspace ? <>
            <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9ecfc5]">{isAutonomo ? "TST Autônomo" : "TST CLT"}</p>
            <p className="mt-1 truncate text-sm font-semibold text-white">{currentWorkspace.name}</p>
            <p className="mt-2 text-xs leading-5 text-[#9ecfc5]">{isAutonomo ? "Prioridade: carteira, entregas e retorno aos clientes." : "Prioridade: pessoas, capacitação e conformidade interna."}</p>
            {developmentWorkspaces.data && developmentWorkspaces.data.length > 1 ? <div className="mt-3 border-t border-white/10 pt-3"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#9ecfc5]">Alternar contexto</p><div className="flex flex-wrap gap-2">{developmentWorkspaces.data.map(item => <button key={item.id} type="button" onClick={() => switchWorkspace(item.id, item.kind)} disabled={switchingWorkspaceId !== null} className={`rounded-lg px-2 py-1 text-[10px] font-bold transition disabled:cursor-wait disabled:opacity-70 ${item.id === currentWorkspace.id ? "bg-[#8edec7] text-[#063b43]" : "bg-white/10 text-[#d9eeea] hover:bg-white/20"}`}>{item.id === switchingWorkspaceId ? "Abrindo..." : item.kind === "autonomo" ? "Autônomo" : "CLT"}</button>)}</div></div> : <Link href="/app" className="mt-3 inline-flex text-xs font-bold text-[#8edec7] hover:text-white">Adicionar contexto CLT</Link>}
          </> : <>
            <p className="text-xs font-semibold text-white">Ambiente protegido</p>
            <p className="mt-1 text-xs leading-5 text-[#9ecfc5]">Seus dados ficam organizados por empresa e perfil de trabalho.</p>
          </>}
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-[#deece9] bg-white/90 px-5 backdrop-blur lg:px-9">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-xs font-medium text-[#668087]">{currentWorkspace ? `${isAutonomo ? "TST Autônomo" : "TST CLT"} · ${currentWorkspace.name}` : "Área autenticada"}</p>
              <h1 className="font-display text-lg font-bold tracking-tight text-[#102b32]">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" aria-label="Notificações" className="relative text-[#49636a]">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#e98766] ring-2 ring-white" />
            </Button>
            <button type="button" onClick={() => setProfileOpen(true)} className="flex items-center gap-2 rounded-xl border border-[#deece9] bg-[#f6faf9] px-2.5 py-1.5 transition hover:bg-[#e8f6f1]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0c7474] text-xs font-bold text-white">
                {user?.name?.[0] || "T"}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-bold text-[#102b32]">{user?.name || "Profissional"}</p>
                <p className="text-[10px] text-[#668087]">{currentWorkspace ? (isAutonomo ? "TST Autônomo" : "TST CLT") : "Perfil SST"}</p>
              </div>
            </button>
          </div>
        </header>

        <main className="p-6 lg:p-9">
          {children}
        </main>
      </div>

      {profileOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#062f35]/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#deece9] pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Conta autenticada</p>
                <h3 className="font-display text-xl font-bold text-[#102b32]">Meu perfil profissional</h3>
              </div>
              <button type="button" onClick={() => setProfileOpen(false)} className="rounded-xl p-2 text-[#668087] hover:bg-[#f6faf9] hover:text-[#102b32]">✕</button>
            </div>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-[#e6f0ee] bg-[#f7fcfa] p-4">
                <p className="text-xs font-medium text-[#668087]">Profissional</p>
                <p className="mt-1 text-base font-bold text-[#102b32]">{user?.name || "Técnico de Segurança do Trabalho"}</p>
                <p className="mt-0.5 text-xs text-[#0c7474]">{user?.email || "Profissional cadastrado no ecossistema"}</p>
              </div>
              <div className="rounded-2xl border border-[#e6f0ee] bg-[#f7fcfa] p-4">
                <p className="text-xs font-medium text-[#668087]">Ambiente de trabalho ativo</p>
                <p className="mt-1 text-sm font-bold text-[#102b32]">{currentWorkspace ? `${currentWorkspace.kind === "autonomo" ? "TST Autônomo" : "TST CLT"} · ${currentWorkspace.name}` : "Nenhum ambiente selecionado"}</p>
                <p className="mt-1 text-xs text-[#5d7479]">Sua conta possui 2 contextos de desenvolvimento (Autônomo e CLT) para alternância na fase de criação.</p>
              </div>
              <div className="flex flex-col gap-2.5 pt-2">
                <Button type="button" onClick={() => { setProfileOpen(false); logout(); }} variant="outline" className="w-full rounded-xl border-[#dcebe8] text-[#c2410c] hover:bg-[#fff5f2]">Encerrar sessão</Button>
                <Button type="button" onClick={() => setProfileOpen(false)} className="w-full rounded-xl bg-[#0c7474] text-white hover:bg-[#063b43]">Fechar painel</Button>
              </div>
            </div>
          </div>
        </div>,
        document.getElementById("profile-overlay-root")!,
      )}
      {collapsed ? <X className="hidden" /> : null}
    </div>
  );
}

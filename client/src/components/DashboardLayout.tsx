import { Bell, BriefcaseBusiness, FolderKanban, GraduationCap, Headphones, LayoutDashboard, Library, Menu, ShieldCheck, Trophy, User, UsersRound, X } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { withWorkspaceContext, workspaceIdFromSearch } from "@shared/workspaceContext";

type DashboardLayoutProps = {
  children: ReactNode;
  title?: string;
};

export default function DashboardLayout({ children, title = "Portal TST Brasil" }: DashboardLayoutProps) {
  const [location] = useLocation();
  const search = useSearch();
  const collapsed = false;
  const workspaceId = workspaceIdFromSearch(search);
  const workspace = trpc.portal.workspace.useQuery(
    { workspaceId: workspaceId ?? 0 },
    { enabled: Boolean(workspaceId && workspaceId > 0) },
  );
  const currentWorkspace = workspace.data;
  const isAutonomo = currentWorkspace?.kind === "autonomo";
  const isClt = currentWorkspace?.kind === "clt";
  const menuItems = isAutonomo ? [
    { label: "Visão geral", icon: LayoutDashboard, path: "/app" },
    { label: "Carteira e PGR", icon: BriefcaseBusiness, path: "/app/pgr" },
    { label: "Materiais de atendimento", icon: FolderKanban, path: "/app/materiais" },
    { label: "Agenda de clientes", icon: GraduationCap, path: "/app/treinamentos" },
    { label: "Documentos e certificados", icon: Trophy, path: "/app/certificados" },
    { label: "Biblioteca técnica", icon: Library, path: "/app/biblioteca" },
    { label: "Suporte", icon: Headphones, path: "/app/suporte" },
  ] : isClt ? [
    { label: "Visão geral", icon: LayoutDashboard, path: "/app" },
    { label: "Capacitação da equipe", icon: UsersRound, path: "/app/treinamentos" },
    { label: "Conformidade documental", icon: Trophy, path: "/app/certificados" },
    { label: "PGR da operação", icon: ShieldCheck, path: "/app/pgr" },
    { label: "Procedimentos internos", icon: FolderKanban, path: "/app/materiais" },
    { label: "Biblioteca técnica", icon: Library, path: "/app/biblioteca" },
    { label: "Suporte", icon: Headphones, path: "/app/suporte" },
  ] : [
    { label: "Visão geral", icon: LayoutDashboard, path: "/app" },
    { label: "Gerador de PGR", icon: ShieldCheck, path: "/app/pgr" },
    { label: "Treinamentos", icon: GraduationCap, path: "/app/treinamentos" },
    { label: "Biblioteca", icon: Library, path: "/app/biblioteca" },
    { label: "Materiais", icon: FolderKanban, path: "/app/materiais" },
    { label: "Suporte", icon: Headphones, path: "/app/suporte" },
    { label: "Certificados", icon: Trophy, path: "/app/certificados" },
  ];
  const pathWithWorkspace = (path: string) => {
    if (path === "/app") return withWorkspaceContext("/app/visao", workspaceId);
    return withWorkspaceContext(path, workspaceId);
  };

  return (
    <div className="min-h-screen bg-[#f6faf9] text-[#102b32]">
      <aside className={`fixed inset-y-0 left-0 z-30 hidden w-72 flex-col px-3 py-5 text-[#d9eeea] shadow-2xl lg:flex ${isClt ? "bg-[#123f69]" : "bg-[#063b43]"}`}>
        <div className="mb-7 flex items-center gap-3 px-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#77cdb2]/15 text-[#88ddc4]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="font-display text-lg font-bold tracking-tight text-white">Portal TST</p>
            <p className="text-xs text-[#9ecfc5]">Brasil · Gestão SST</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8abfb5]">{isAutonomo ? "Rotina de atendimento" : isClt ? "Rotina de conformidade" : "Aplicativos"}</p>
          {menuItems.map(({ label, icon: Icon, path }) => {
            const active = path === "/app" ? location === "/app" || location === "/app/visao" : location === path;
            return (
              <Link key={path} href={pathWithWorkspace(path)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${active ? "bg-[#77cdb2]/18 text-white shadow-inner" : "text-[#c4e2dc] hover:bg-white/8 hover:text-white"}`}>
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          {currentWorkspace ? <>
            <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9ecfc5]">{isAutonomo ? "TST Autônomo" : "TST CLT"}</p>
            <p className="mt-1 truncate text-sm font-semibold text-white">{currentWorkspace.name}</p>
            <p className="mt-2 text-xs leading-5 text-[#9ecfc5]">{isAutonomo ? "Prioridade: carteira, entregas e retorno aos clientes." : "Prioridade: pessoas, capacitação e conformidade interna."}</p>
            <Link href="/app" className="mt-3 inline-flex text-xs font-bold text-[#8edec7] hover:text-white">Trocar ambiente</Link>
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
            <div className="flex items-center gap-2 rounded-xl border border-[#deece9] bg-[#f6faf9] px-2 py-1.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#d9f1e7] text-[#0c7474]"><User className="h-4 w-4" /></span>
              <span className="hidden pr-1 text-xs font-semibold text-[#315158] sm:block">Meu perfil</span>
            </div>
          </div>
        </header>
        <main className="px-5 py-7 lg:px-9 lg:py-9">{children}</main>
      </div>
      {collapsed ? <X className="hidden" /> : null}
    </div>
  );
}

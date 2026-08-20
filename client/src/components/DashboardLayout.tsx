import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/BrandLockup";
import { trpc } from "@/lib/trpc";
import { clearRememberedProfile } from "@/lib/profilePreference";
import { withWorkspaceContext, workspaceIdFromSearch } from "@shared/workspaceContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { LayoutDashboard, BriefcaseBusiness, CalendarDays, UsersRound, ShieldCheck, ShieldAlert, FolderKanban, Trophy, HardHat, PackageCheck, GraduationCap, Library, Headphones, Bell, Menu, X, Award, BookOpen, ArrowLeftRight, LogOut, Loader2, Save, BellRing, UserRound, ClipboardCheck, Store, CheckCircle2, MapPinned } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { WhatsAppFloatingButton } from "@/components/WhatsAppFloatingButton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type DashboardLayoutProps = {
  children: ReactNode;
  title?: string;
};

type ProfilePreferences = {
  notificationsEnabled: boolean;
  reducedMotion: boolean;
};

type WorkspaceNotification = {
  id: string;
  title: string;
  description: string;
  path: string;
};

const PROFILE_PREFERENCES_KEY = "tst-brasil-hub-profile-preferences";

function readProfilePreferences(): ProfilePreferences {
  try {
    const raw = window.localStorage.getItem(PROFILE_PREFERENCES_KEY);
    if (!raw) return { notificationsEnabled: true, reducedMotion: false };
    const parsed = JSON.parse(raw) as Partial<ProfilePreferences>;
    return {
      notificationsEnabled: parsed.notificationsEnabled !== false,
      reducedMotion: parsed.reducedMotion === true,
    };
  } catch {
    return { notificationsEnabled: true, reducedMotion: false };
  }
}

export default function DashboardLayout({ children, title = "TST Brasil Hub" }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const collapsed = false;
  const requestedWorkspaceId = workspaceIdFromSearch(search);
  const developmentWorkspaces = trpc.portal.workspaces.useQuery();
  const workspaceId = requestedWorkspaceId ?? developmentWorkspaces.data?.[0]?.id ?? 0;
  const workspace = trpc.portal.workspace.useQuery(
    { workspaceId },
    { enabled: Boolean(workspaceId && workspaceId > 0) },
  );
  const currentWorkspace = workspace.data;
  const [switchingWorkspaceId, setSwitchingWorkspaceId] = useState<number | null>(null);
  const [switchingToastId, setSwitchingToastId] = useState<string | number | undefined>(undefined);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profilePreferences, setProfilePreferences] = useState<ProfilePreferences>({ notificationsEnabled: true, reducedMotion: false });
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const { user, logout } = useAuth();
  const utils = trpc.useUtils();
  const updateProfile = trpc.auth.updateProfile.useMutation();

  useEffect(() => {
    if (!profileOpen) return;
    setProfileName(user?.name ?? "");
    setProfilePreferences(readProfilePreferences());
  }, [profileOpen, user?.name]);

  const goToProfilePicker = () => {
    clearRememberedProfile(window.localStorage);
    setProfileOpen(false);
    setLocation("/app");
  };

  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      try {
        await logoutMutation.mutateAsync();
      } catch {}
      try {
        await logout();
      } catch {}
      try {
        sessionStorage.removeItem("manus-cookie");
        sessionStorage.removeItem("manus-master-bypass");
      } catch {}
      toast.success("Sessão encerrada com segurança.");
      window.location.assign("/");
    } catch {
      window.location.assign("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSaveProfile = async () => {
    const name = profileName.trim();
    if (name.length < 2) {
      toast.error("Informe um nome com pelo menos 2 caracteres.");
      return;
    }
    setIsSavingProfile(true);
    try {
      const updated = await updateProfile.mutateAsync({ name });
      utils.auth.me.setData(undefined, updated);
      try { window.localStorage.setItem(PROFILE_PREFERENCES_KEY, JSON.stringify(profilePreferences)); } catch {}
      toast.success("Perfil atualizado com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o perfil.");
    } finally {
      setIsSavingProfile(false);
    }
  };



  const switchWorkspace = (workspaceId: number, kind: "autonomo" | "clt") => {
    if (workspaceId === currentWorkspace?.id) return;
    const label = kind === "autonomo" ? "TST Autônomo" : "TST CLT";
    const toastId = toast.loading(`Abrindo ${label}...`);
    setSwitchingWorkspaceId(workspaceId);
    setSwitchingToastId(toastId);
    setLocation(`/app/visao?workspace=${workspaceId}`);
    window.setTimeout(() => {
      toast.success(`${label} aberto com sucesso.`, { id: toastId });
      setSwitchingWorkspaceId(null);
      setSwitchingToastId(undefined);
    }, 280);
  };
  const isAutonomo = currentWorkspace?.kind === "autonomo";
  const isClt = currentWorkspace?.kind === "clt";
  const selectableWorkspaces = (developmentWorkspaces.data ?? []).filter((workspace, index, all) => all.findIndex(candidate => candidate.kind === workspace.kind) === index);
  const workspaceNotifications: WorkspaceNotification[] = !currentWorkspace
    ? [{ id: "workspace", title: "Selecione um ambiente", description: "Abra o contexto de trabalho para ver dados e tarefas vinculadas.", path: "/app" }]
    : [
      ...(currentWorkspace.companies.length === 0 ? [{ id: "company", title: "Cadastre a empresa", description: "A estrutura, os documentos, a CIPA e o PGR dependem de uma empresa ativa.", path: "/app/pgr" }] : []),
      ...(currentWorkspace.companies.length > 0 && currentWorkspace.pgrProjects.length === 0 ? [{ id: "pgr", title: "Nenhum PGR criado", description: "Crie o primeiro PGR pelo card da empresa para iniciar o gerador.", path: "/app/pgr" }] : []),
    ];
  const menuSections = isAutonomo ? [
    { label: "Principal", items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/app" },
      { label: "Empresas e clientes", icon: BriefcaseBusiness, path: "/app/clientes" },
      { label: "Agenda de visitas", icon: CalendarDays, path: "/app/agenda" },
      { label: "Estrutura e equipe", hint: "Cadastre setores, funções e pessoas de cada cliente para sustentar PGR, EPIs, treinamentos e inspeções.", icon: UsersRound, path: "/app/estrutura" },
    ] },
    { label: "Documentos", items: [
      { label: "Gerador de PGR", icon: ShieldCheck, path: "/app/pgr" },
      { label: "Assistant CIPA por cliente", icon: ClipboardCheck, path: "/app/cipa" },
      { label: "Riscos Psicossociais (COPSOQ)", icon: ShieldAlert, path: "/app/copsoq" },
      { label: "Modelos e anexos", icon: FolderKanban, path: "/app/materiais" },
      { label: "Gerador de certificados NR", icon: Award, path: "/app/certificados?generator=1" },
      { label: "Acervo documental", icon: Trophy, path: "/app/certificados" },
    ] },
    { label: "Negócio", items: [
      { label: "Controle de EPIs por cliente", icon: HardHat, path: "/app/operacao" },
      { label: "Inspeções e ações", icon: ShieldCheck, path: "/app/inspecoes" },
    ] },
    { label: "Conhecimento", items: [
      { label: "Cursos e treinamentos", icon: GraduationCap, path: "/app/treinamentos" },
      { label: "Biblioteca técnica", icon: Library, path: "/app/biblioteca" },
      { label: "Suporte", icon: Headphones, path: "/app/suporte" },
      { label: "Marketplace SST", icon: Store, path: "/app/marketplace" },
    ] },
  ] : isClt ? [
    { label: "Operação", items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/app" },
      { label: "Estrutura e equipe", hint: "Cadastre setores, funções e pessoas da empresa para organizar a rotina de SST.", icon: UsersRound, path: "/app/estrutura" },
      { label: "Controle de EPIs", icon: PackageCheck, path: "/app/operacao" },
      { label: "Inspeções e ações", icon: ShieldCheck, path: "/app/inspecoes" },
      { label: "Acidentes e lesões", icon: ShieldAlert, path: "/app/acidentes" },
      { label: "Mapa de Risco", icon: MapPinned, path: "/app/mapa-risco" },
    ] },
    { label: "Conformidade", items: [
      { label: "Capacitação da equipe", icon: GraduationCap, path: "/app/treinamentos" },
      { label: "Gerador de certificados NR", icon: Award, path: "/app/certificados?generator=1" },
      { label: "Acervo documental", icon: Trophy, path: "/app/certificados" },
      { label: "Assistant CIPA", icon: ClipboardCheck, path: "/app/cipa" },
      { label: "PGR da operação", icon: ShieldCheck, path: "/app/pgr" },
      { label: "Riscos Psicossociais (COPSOQ)", icon: ShieldAlert, path: "/app/copsoq" },
      { label: "Procedimentos internos", icon: FolderKanban, path: "/app/materiais" },
    ] },
    { label: "Conhecimento", items: [
      { label: "Biblioteca técnica", icon: Library, path: "/app/biblioteca" },
      { label: "Suporte", icon: Headphones, path: "/app/suporte" },
      { label: "Marketplace SST", icon: Store, path: "/app/marketplace" },
    ] },
  ] : [{ label: "Aplicativos", items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/app" },
      { label: "Gerador de PGR", icon: ShieldCheck, path: "/app/pgr" },
      { label: "CIPA", icon: ClipboardCheck, path: "/app/cipa" },
      { label: "Riscos Psicossociais (COPSOQ)", icon: ShieldAlert, path: "/app/copsoq" },
      { label: "Estrutura e equipe", hint: "Organize setores, funções e pessoas do ambiente para apoiar a operação de SST.", icon: UsersRound, path: "/app/estrutura" },
      { label: "Controle de EPIs", icon: PackageCheck, path: "/app/operacao" },
      { label: "Inspeções e ações", icon: ShieldCheck, path: "/app/inspecoes" },
      { label: "Treinamentos", icon: GraduationCap, path: "/app/treinamentos" },
      { label: "Biblioteca", icon: Library, path: "/app/biblioteca" },
      { label: "Materiais", icon: FolderKanban, path: "/app/materiais" },
      { label: "Suporte", icon: Headphones, path: "/app/suporte" },
      { label: "Certificados", icon: Trophy, path: "/app/certificados" },
      { label: "Marketplace SST", icon: Store, path: "/app/marketplace" },
    ] }];
  const pathWithWorkspace = (path: string) => {
    if (path === "/app") return withWorkspaceContext("/app/visao", workspaceId);
    return withWorkspaceContext(path, workspaceId);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fa] text-[#102b32]">
      <aside className={`fixed inset-y-0 left-0 z-30 hidden w-64 flex-col px-3 py-5 text-[#d9eeea] shadow-[6px_0_24px_rgba(6,59,67,.10)] lg:flex ${isClt ? "bg-[#123f69]" : "bg-[#063b43]"}`}>
        <div className="mb-7 flex items-center px-3">
          <BrandLockup inverse aria-label="TST Brasil Hub" />
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto pr-1">
          {user?.role === "admin" && <section><p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8abfb5]">Administração</p><Link href="/admin" className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${location === "/admin" ? "bg-[#77cdb2]/18 text-white shadow-inner" : "text-[#c4e2dc] hover:bg-white/8 hover:text-white"}`}><UsersRound className="h-4 w-4" /><span>Gestão de acessos</span></Link></section>}
          {menuSections.map(section => <section key={section.label}><p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8abfb5]">{section.label}</p>{section.items.map(({ label, hint, icon: Icon, path }) => {
            const active = path === "/app" ? location === "/app" || location === "/app/visao" : location === path;
            return <Link key={path} href={pathWithWorkspace(path)} title={hint ?? label} aria-label={hint ? `${label}: ${hint}` : label} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-[#77cdb2]/18 text-white shadow-inner" : "text-[#c4e2dc] hover:bg-white/8 hover:text-white"}`}><Icon className="h-4 w-4" /><span>{label}</span></Link>;
          })}</section>)}
        </nav>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          {currentWorkspace ? <div className="flex flex-wrap items-center gap-2">
            {selectableWorkspaces.length > 1 && selectableWorkspaces.map(item => <button key={item.id} type="button" onClick={() => switchWorkspace(item.id, item.kind)} disabled={switchingWorkspaceId !== null} aria-label={`Abrir ambiente ${item.kind === "autonomo" ? "Autônomo" : "CLT"}`} className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition disabled:cursor-wait disabled:opacity-70 ${item.id === currentWorkspace.id ? "bg-[#8edec7] text-[#063b43]" : "bg-white/10 text-[#d9eeea] hover:bg-white/20"}`}>{item.id === switchingWorkspaceId ? "Abrindo..." : item.kind === "autonomo" ? "Autônomo" : "CLT"}</button>)}
            <button type="button" onClick={goToProfilePicker} aria-label="Trocar perfil ou ambiente" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-[#d9eeea] transition hover:-translate-y-0.5 hover:bg-white/12 hover:text-white active:scale-[.98]"><ArrowLeftRight className="h-3.5 w-3.5" />Trocar perfil</button>
          </div> : <button type="button" onClick={goToProfilePicker} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-[#d9eeea]"><ArrowLeftRight className="h-3.5 w-3.5" />Escolher ambiente</button>}
        </div>
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className={`w-[86vw] max-w-sm gap-0 border-0 p-0 text-[#d9eeea] ${isClt ? "bg-[#123f69]" : "bg-[#063b43]"}`}>
          <SheetHeader className="border-b border-white/10 px-5 py-5 text-left">
            <BrandLockup inverse aria-label="TST Brasil Hub" />
            <SheetTitle className="sr-only">Navegação do portal</SheetTitle>
            <SheetDescription className="sr-only">Escolha um módulo para o ambiente ativo.</SheetDescription>
          </SheetHeader>
          <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-5">
            {user?.role === "admin" && <section><p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8abfb5]">Administração</p><Link onClick={() => setMobileNavOpen(false)} href="/admin" className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${location === "/admin" ? "bg-[#77cdb2]/18 text-white" : "text-[#c4e2dc] hover:bg-white/8 hover:text-white"}`}><UsersRound className="h-4 w-4" /><span>Gestão de acessos</span></Link></section>}
            {menuSections.map(section => <section key={section.label}><p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8abfb5]">{section.label}</p>{section.items.map(({ label, hint, icon: Icon, path }) => {
              const active = path === "/app" ? location === "/app" || location === "/app/visao" : location === path;
              return <Link key={path} onClick={() => setMobileNavOpen(false)} href={pathWithWorkspace(path)} title={hint ?? label} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${active ? "bg-[#77cdb2]/18 text-white" : "text-[#c4e2dc] hover:bg-white/8 hover:text-white"}`}><Icon className="h-4 w-4" /><span>{label}</span></Link>;
            })}</section>)}
          </nav>
          <div className="m-3 rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9ecfc5]">Ambiente ativo</p><p className="mt-1 text-sm font-semibold text-white">{currentWorkspace?.name ?? "Nenhum ambiente selecionado"}</p><button type="button" onClick={() => { setMobileNavOpen(false); goToProfilePicker(); }} className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[#8edec7]"><ArrowLeftRight className="h-3.5 w-3.5" />Trocar perfil</button></div>
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#e5eaec] bg-white px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" size="icon" onClick={() => setMobileNavOpen(true)} className="lg:hidden" aria-label="Abrir menu">
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-xs font-medium text-[#668087]">{currentWorkspace ? `${isAutonomo ? "TST Autônomo" : "TST CLT"} · ${currentWorkspace.name}` : "Área autenticada"}</p>
              <h1 className="font-display text-lg font-bold tracking-tight text-[#102b32]">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <Button type="button" variant="ghost" size="icon" onClick={() => setNotificationsOpen(current => !current)} aria-expanded={notificationsOpen} aria-label="Abrir notificações" className="relative text-[#49636a]">
                <Bell className="h-5 w-5" />
                {workspaceNotifications.length > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#e98766] ring-2 ring-white" />}
              </Button>
              {notificationsOpen && <div className="absolute right-0 top-12 z-40 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#dcebe8] bg-white p-2 shadow-xl">
                <div className="flex items-center justify-between px-3 py-2"><div><p className="text-sm font-bold text-[#102b32]">Notificações</p><p className="text-[11px] text-[#668087]">Alertas do ambiente ativo</p></div><BellRing className="h-4 w-4 text-[#0c7474]" /></div>
                {workspaceNotifications.length ? <div className="space-y-1">{workspaceNotifications.map(notification => <button type="button" key={notification.id} onClick={() => { setNotificationsOpen(false); setLocation(pathWithWorkspace(notification.path)); }} className="w-full rounded-xl px-3 py-3 text-left transition hover:bg-[#edf8f5]"><p className="text-sm font-bold text-[#17383e]">{notification.title}</p><p className="mt-1 text-xs leading-5 text-[#668087]">{notification.description}</p></button>)}</div> : <div className="rounded-xl bg-[#f3faf8] px-3 py-4 text-center"><CheckCircle2 className="mx-auto h-5 w-5 text-[#0c7474]" /><p className="mt-2 text-xs font-semibold text-[#49636a]">Nenhum alerta pendente neste ambiente.</p></div>}
              </div>}
            </div>
            <Button type="button" variant="ghost" onClick={() => void handleLogout()} disabled={isLoggingOut} title="Encerrar sessão" className="gap-2 rounded-xl px-2.5 text-[#c2410c] hover:bg-[#fff5f2] hover:text-[#9a3412]">
              {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              <span className="hidden text-xs font-bold sm:inline">{isLoggingOut ? "Saindo..." : "Sair"}</span>
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

        <main className="min-h-[calc(100vh-4rem)] p-5 lg:p-7">
          <div>{children}</div>
        </main>
      </div>
      <WhatsAppFloatingButton />

      {profileOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#062f35]/40 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#deece9] pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Conta autenticada</p>
                <h3 className="font-display text-xl font-bold text-[#102b32]">Meu perfil profissional</h3>
              </div>
              <button type="button" onClick={() => setProfileOpen(false)} aria-label="Fechar perfil" className="rounded-xl p-2 text-[#668087] transition hover:bg-[#f6faf9] hover:text-[#102b32]"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-[#bfe2d7] bg-gradient-to-br from-[#f7fcfa] to-[#eefaf5] p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0c7474] text-white"><UserRound className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <Label htmlFor="profile-name" className="text-xs font-bold uppercase tracking-[.12em] text-[#668087]">Nome de exibição</Label>
                    <Input id="profile-name" value={profileName} onChange={(event) => setProfileName(event.target.value)} className="mt-2 h-10 rounded-xl border-[#cde5dd] bg-white text-sm font-semibold text-[#102b32] focus-visible:ring-[#8edec7]" placeholder="Seu nome profissional" />
                    <p className="mt-2 text-[11px] leading-4 text-[#668087]">Este nome aparece no cabeçalho e nos registros criados por você.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-[#e6f0ee] bg-[#f7fcfa] p-4">
                <p className="text-xs font-medium text-[#668087]">Profissional</p>
                <p className="mt-1 text-base font-bold text-[#102b32]">{user?.name || "Técnico de Segurança do Trabalho"}</p>
                <p className="mt-0.5 text-xs text-[#0c7474]">{user?.email || "Profissional cadastrado no ecossistema"}</p>
                <p className="mt-2 text-[11px] text-[#668087]">O email é gerenciado pelo provedor de autenticação e não pode ser alterado aqui.</p>
              </div>
              <div className="rounded-2xl border border-[#e6f0ee] bg-[#f7fcfa] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-sm font-bold text-[#102b32]">Notificações visuais</p><p className="mt-1 text-xs leading-5 text-[#668087]">Receber feedbacks e alertas contextuais durante a navegação.</p></div>
                  <Switch checked={profilePreferences.notificationsEnabled} onCheckedChange={(checked) => setProfilePreferences(current => ({ ...current, notificationsEnabled: checked }))} aria-label="Ativar notificações visuais" />
                </div>
                <div className="mt-4 flex items-start justify-between gap-4 border-t border-[#e6f0ee] pt-4">
                  <div><p className="text-sm font-bold text-[#102b32]">Reduzir movimento</p><p className="mt-1 text-xs leading-5 text-[#668087]">Preferir transições mais discretas neste navegador.</p></div>
                  <Switch checked={profilePreferences.reducedMotion} onCheckedChange={(checked) => setProfilePreferences(current => ({ ...current, reducedMotion: checked }))} aria-label="Reduzir movimento" />
                </div>
                <p className="mt-3 text-[10px] font-medium text-[#0c7474]">Preferências salvas neste navegador.</p>
              </div>
              <div className="rounded-2xl border border-[#e6f0ee] bg-[#f7fcfa] p-4">
                <p className="text-xs font-medium text-[#668087]">Ambiente de trabalho ativo</p>
                <p className="mt-1 text-sm font-bold text-[#102b32]">{currentWorkspace ? `${currentWorkspace.kind === "autonomo" ? "TST Autônomo" : "TST CLT"} · ${currentWorkspace.name}` : "Nenhum ambiente selecionado"}</p>
                <p className="mt-1 text-xs text-[#5d7479]">Sua conta possui 2 contextos de desenvolvimento (Autônomo e CLT) para alternância na fase de criação.</p>
              </div>
              <div className="flex flex-col gap-2.5 pt-2">
                <Button type="button" onClick={() => void handleSaveProfile()} disabled={isSavingProfile} className="w-full rounded-xl bg-[#0c7474] text-white hover:bg-[#063b43]">{isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{isSavingProfile ? "Salvando..." : "Salvar alterações"}</Button>
                <Button type="button" onClick={goToProfilePicker} variant="outline" className="w-full rounded-xl border-[#b9ded4] text-[#0c7474] hover:bg-[#eaf7f1]"><ArrowLeftRight className="mr-2 h-4 w-4" />Trocar perfil ou ambiente</Button>
                <Button type="button" onClick={() => void handleLogout()} disabled={isLoggingOut} variant="outline" className="w-full rounded-xl border-[#dcebe8] text-[#c2410c] hover:bg-[#fff5f2]">{isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}{isLoggingOut ? "Encerrando..." : "Encerrar sessão"}</Button>
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

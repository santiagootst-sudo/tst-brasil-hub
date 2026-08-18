import {
  ArrowRight,
  Award,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  FolderKanban,
  GraduationCap,
  Headphones,
  Loader2,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/BrandLockup";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { clearRememberedProfile, readRememberedProfile, rememberProfile } from "@/lib/profilePreference";

type WorkspaceKind = "autonomo" | "clt";

type ProfileDefinition = {
  kind: WorkspaceKind;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  action: string;
  existingAction: string;
  icon: typeof BriefcaseBusiness;
  tone: "mint" | "blue";
  features: string[];
};

const profiles: ProfileDefinition[] = [
  {
    kind: "autonomo",
    label: "Prestador de Serviço",
    eyebrow: "Carteira, clientes e entregas",
    title: "Faça sua consultoria avançar.",
    description: "Organize empresas atendidas, PGRs, visitas, documentos e materiais em uma jornada feita para quem presta serviço.",
    action: "Criar ambiente de prestador",
    existingAction: "Entrar como prestador",
    icon: BriefcaseBusiness,
    tone: "mint",
    features: ["Carteira de empresas e clientes", "PGR e documentos por atendimento", "Agenda, materiais e próximos retornos"],
  },
  {
    kind: "clt",
    label: "Empresa",
    eyebrow: "Pessoas, riscos e conformidade",
    title: "Cuide da rotina com visão completa.",
    description: "Acompanhe equipe, EPIs, treinamentos, inspeções, documentos e ações preventivas dentro da empresa.",
    action: "Criar ambiente Empresa",
    existingAction: "Entrar na Empresa",
    icon: UserRoundCheck,
    tone: "blue",
    features: ["Equipe, setores e funções", "EPIs, inspeções e planos de ação", "Treinamentos e conformidade documental"],
  },
];

const sharedHighlights = [
  { icon: ShieldCheck, label: "PGR integrado" },
  { icon: BookOpen, label: "Biblioteca técnica" },
  { icon: GraduationCap, label: "Treinamentos" },
  { icon: Award, label: "Certificados" },
  { icon: Headphones, label: "Suporte especializado" },
];

export default function WorkspaceHub() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const utils = trpc.useUtils();
  const { data: workspaces, isLoading } = trpc.portal.workspaces.useQuery(undefined, { enabled: Boolean(user) });
  const billing = trpc.billing.status.useQuery(undefined, { enabled: Boolean(user) });
  const [form, setForm] = useState<{ kind: WorkspaceKind; name: string } | null>(null);
  const [rememberChoice, setRememberChoice] = useState(false);
  const [rememberedKind, setRememberedKind] = useState<WorkspaceKind | null>(null);
  const autoOpened = useRef(false);

  useEffect(() => {
    const stored = readRememberedProfile(window.localStorage);
    if (stored) {
      setRememberedKind(stored);
      setRememberChoice(true);
    }
  }, []);

  const createWorkspace = trpc.portal.createWorkspace.useMutation({
    onSuccess: workspace => {
      utils.portal.workspaces.invalidate();
      if (rememberChoice && (workspace.kind === "autonomo" || workspace.kind === "clt")) {
        rememberProfile(window.localStorage, workspace.kind);
        setRememberedKind(workspace.kind);
      }
      setForm(null);
      setLocation(`/app/visao?workspace=${workspace.id}`);
      toast.success("Ambiente criado. Seu painel já está pronto para começar.");
    },
    onError: error => toast.error(error.message),
  });
  const manageSubscription = trpc.billing.manage.useMutation({
    onSuccess: ({ url }) => window.open(url, "_blank", "noopener"),
    onError: error => toast.error(error.message),
  });

  const billingSuccess = new URLSearchParams(window.location.search).get("billing") === "success";
  const openWorkspace = (workspaceId: number) => setLocation(`/app/visao?workspace=${workspaceId}`);
  const getWorkspace = (kind: WorkspaceKind) => workspaces?.find(item => item.kind === kind);

  useEffect(() => {
    if (!rememberedKind || autoOpened.current) return;
    const rememberedWorkspace = getWorkspace(rememberedKind);
    if (rememberedWorkspace) {
      autoOpened.current = true;
      openWorkspace(rememberedWorkspace.id);
    }
  }, [rememberedKind, workspaces]);

  const toggleRememberChoice = (checked: boolean) => {
    setRememberChoice(checked);
    if (!checked) {
      setRememberedKind(null);
      clearRememberedProfile(window.localStorage);
    }
  };

  const handleProfileAction = (profile: ProfileDefinition, workspace?: { id: number }) => {
    if (rememberChoice) {
      rememberProfile(window.localStorage, profile.kind);
      setRememberedKind(profile.kind);
    }
    if (workspace) {
      openWorkspace(workspace.id);
      return;
    }
    setForm({ kind: profile.kind, name: profile.kind === "autonomo" ? "Meu ambiente Autônomo" : "Minha empresa" });
  };

  if (loading || isLoading) {
    return <div className="grid min-h-screen place-items-center bg-[#edf5f4] text-[#0c7474]"><Loader2 className="h-7 w-7 animate-spin" /></div>;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#edf5f4] text-[#102f36]">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-[#8edec7]/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 top-24 h-[28rem] w-[28rem] rounded-full bg-[#b9defc]/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-14rem] left-1/3 h-[30rem] w-[30rem] rounded-full bg-white/70 blur-3xl" />

      <div className="relative mx-auto min-h-screen max-w-[1440px] px-4 py-4 sm:px-6 lg:px-10">
        <header className="mx-auto flex max-w-6xl items-center justify-between rounded-[1.5rem] border border-white/80 bg-white/65 px-4 py-3 shadow-[0_14px_40px_rgba(28,74,77,0.07)] backdrop-blur-2xl sm:px-5">
          <div className="flex items-center gap-3">
            <BrandLockup aria-label="TST Brasil Hub" />
            <p className="text-xs font-semibold text-[#547078]">Seu espaço profissional de SST</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {billing.data?.subscription && <Button onClick={() => manageSubscription.mutate()} variant="outline" className="hidden rounded-xl border-white/80 bg-white/45 text-xs font-bold text-[#0c7474] backdrop-blur-md hover:bg-white/80 sm:inline-flex">Gerenciar assinatura</Button>}
            <div className="flex items-center gap-2 rounded-2xl border border-white/80 bg-white/55 px-2.5 py-2 shadow-sm backdrop-blur-md"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#0c7474] text-xs font-bold text-white">{user?.name?.[0] || "T"}</span><div className="hidden pr-1 sm:block"><p className="text-xs font-bold text-[#173b43]">{user?.name || "Profissional"}</p><p className="text-[10px] text-[#668087]">Perfil SST</p></div></div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl py-10 lg:py-14">
          {billingSuccess && <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[#b9e3d7] bg-white/65 px-5 py-4 text-sm text-[#17664f] shadow-sm backdrop-blur-xl"><CheckCircle2 className="h-5 w-5 shrink-0" />Recebemos a confirmação do checkout. A assinatura será liberada assim que o pagamento for processado.</div>}

          <section className="relative overflow-hidden rounded-[2.5rem] border border-white/85 bg-gradient-to-br from-white/78 via-white/55 to-[#e7f5f1]/75 px-6 py-9 shadow-[0_24px_70px_rgba(28,74,77,0.10)] backdrop-blur-2xl sm:px-10 lg:px-14 lg:py-12">
            <div className="pointer-events-none absolute right-[-5rem] top-[-6rem] h-64 w-64 rounded-full bg-[#8edec7]/25 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-8rem] left-1/2 h-52 w-52 rounded-full bg-[#b9defc]/25 blur-3xl" />
            <div className="relative max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full border border-[#b7ded5] bg-white/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-[#0c8c89] shadow-sm"><Sparkles className="h-3.5 w-3.5" />Escolha sua jornada</span><h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-[-.045em] text-[#123f46] sm:text-5xl lg:text-6xl">Um portal. <span className="bg-gradient-to-r from-[#0c7474] to-[#43bda2] bg-clip-text text-transparent">duas formas de atuar.</span></h1><p className="mt-5 max-w-2xl text-base leading-7 text-[#5a7379] sm:text-lg">Escolha o ambiente que combina com sua rotina de Segurança e Saúde do Trabalho. Você pode alternar entre os dois contextos de criação sem misturar dados.</p></div>
            <div className="relative mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-semibold text-[#527078]"><span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#0c8c89]" />Dados isolados por ambiente</span><span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#0c8c89]" />Ferramentas compartilhadas</span><span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#0c8c89]" />Acesso profissional</span></div><label className="relative mt-7 inline-flex cursor-pointer items-center gap-3 rounded-2xl border border-white/80 bg-white/60 px-4 py-3 text-sm font-semibold text-[#315158] shadow-sm backdrop-blur-md transition hover:bg-white/85 motion-reduce:transition-none"><input type="checkbox" checked={rememberChoice} onChange={event => toggleRememberChoice(event.target.checked)} className="peer sr-only" /><span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded-md border border-[#a8cbc3] bg-white text-white transition peer-checked:border-[#0c7474] peer-checked:bg-[#0c7474] motion-reduce:transition-none"><Check className="h-3.5 w-3.5 opacity-0 transition peer-checked:opacity-100 motion-reduce:transition-none" /></span><span>Lembrar minha escolha neste navegador</span><span className="hidden text-xs font-normal text-[#789095] sm:inline">{rememberedKind ? "Abertura automática ativada" : "Você pode mudar depois"}</span></label>
          </section>

          <section className="mt-9" aria-labelledby="profiles-title">
            <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#0c8c89]">Perfis de trabalho</p><h2 id="profiles-title" className="mt-1 text-2xl font-bold tracking-[-.025em] text-[#173b43]">Qual experiência você quer abrir?</h2></div><p className="max-w-md text-sm leading-5 text-[#668087]">A estrutura muda conforme a responsabilidade do profissional. O cuidado com a conformidade permanece.</p></div>
            <div className="grid gap-5 lg:grid-cols-2">
              {profiles.map(profile => {
                const workspace = getWorkspace(profile.kind);
                const isMint = profile.tone === "mint";
                const Icon = profile.icon;
                return <article key={profile.kind} className={`group relative overflow-hidden rounded-[2rem] border bg-white/55 shadow-[0_18px_50px_rgba(28,74,77,0.08)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_65px_rgba(28,74,77,0.14)] motion-reduce:transform-none motion-reduce:transition-none ${rememberedKind === profile.kind ? "ring-2 ring-[#0c8c89]/35 ring-offset-2 ring-offset-[#edf5f4]" : ""} ${isMint ? "border-[#b9e3d7] hover:border-[#76c6b0]" : "border-[#c7def2] hover:border-[#8db9df]"}`}>
                  <div className={`relative overflow-hidden px-6 pb-6 pt-7 sm:px-8 sm:pt-8 ${isMint ? "bg-gradient-to-br from-[#e6f8f0]/90 via-white/50 to-[#d9f1e7]/70" : "bg-gradient-to-br from-[#eaf4fc]/95 via-white/50 to-[#dbeeff]/70"}`}><div className={`pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full blur-3xl ${isMint ? "bg-[#8edec7]/35" : "bg-[#b9defc]/40"}`} /><div className="relative flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[.14em] ${isMint ? "bg-[#ccefe1] text-[#0c7474]" : "bg-[#d7ebfc] text-[#28699d]"}`}>{profile.label}</span>{rememberedKind === profile.kind && <span className="inline-flex items-center gap-1 rounded-full border border-[#b9e3d7] bg-white/70 px-2.5 py-1 text-[10px] font-bold text-[#0c7474]"><CheckCircle2 className="h-3 w-3" />Escolha lembrada</span>}</div><p className={`mt-4 text-xs font-bold uppercase tracking-[.13em] ${isMint ? "text-[#0c8c89]" : "text-[#3173a8]"}`}>{profile.eyebrow}</p><h3 className="mt-2 max-w-md text-2xl font-bold tracking-[-.03em] text-[#173b43] sm:text-3xl">{profile.title}</h3><p className="mt-3 max-w-md text-sm leading-6 text-[#5d7479]">{profile.description}</p></div><span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/80 bg-white/55 shadow-sm backdrop-blur-md ${isMint ? "text-[#0c7474]" : "text-[#3173a8]"}`}><Icon className="h-7 w-7" /></span></div></div>
                  <div className="p-6 sm:p-8"><div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">{profile.features.map(feature => <div key={feature} className="flex items-start gap-2 text-sm text-[#49666d]"><CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${isMint ? "text-[#0c8c89]" : "text-[#3173a8]"}`} /><span>{feature}</span></div>)}</div><div className={`mt-7 rounded-2xl border p-4 ${isMint ? "border-[#cfe9df] bg-[#f4fcf8]/75" : "border-[#d4e5f3] bg-[#f5faff]/75"}`}><div className="flex items-center gap-2">{workspace ? <CheckCircle2 className={`h-4 w-4 ${isMint ? "text-[#0c8c89]" : "text-[#3173a8]"}`} /> : <span className={`h-2.5 w-2.5 rounded-full ${isMint ? "bg-[#43bda2]" : "bg-[#75aede]"}`} />}<p className="text-xs font-bold text-[#315158]">{workspace ? `Ambiente configurado · ${workspace.name}` : "Pronto para começar"}</p></div><p className="mt-1.5 text-xs leading-5 text-[#668087]">{workspace ? "Abra seu ambiente para continuar de onde parou." : `Crie seu ambiente de ${isMint ? "prestador de serviço" : "empresa"} e organize a operação desde o início.`}</p></div><Button type="button" onClick={() => handleProfileAction(profile, workspace)} className={`mt-4 h-12 w-full rounded-xl text-sm font-bold text-white shadow-[0_10px_24px_rgba(28,74,77,0.12)] transition duration-200 hover:-translate-y-0.5 active:scale-[.985] motion-reduce:transform-none motion-reduce:transition-none ${isMint ? "bg-[#0c7474] hover:bg-[#063b43]" : "bg-[#3173a8] hover:bg-[#205681]"}`}><Icon className="mr-2 h-4 w-4 transition duration-200 group-hover:scale-105 motion-reduce:transition-none" />{workspace ? profile.existingAction : profile.action}<ArrowRight className="ml-auto h-4 w-4 transition duration-200 group-hover:translate-x-1 motion-reduce:transition-none" /></Button></div>
                </article>;
              })}
            </div>
          </section>

          <section className="mt-9 rounded-[1.75rem] border border-white/80 bg-white/45 p-5 shadow-[0_14px_35px_rgba(28,74,77,0.06)] backdrop-blur-xl sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#0c8c89]">Em comum nos dois ambientes</p><h2 className="mt-1 text-lg font-bold text-[#173b43]">Ferramentas que acompanham sua atuação.</h2></div><p className="max-w-sm text-xs leading-5 text-[#668087]">A diferença está no foco da jornada. O ecossistema técnico continua conectado.</p></div><div className="mt-5 flex flex-wrap gap-2">{sharedHighlights.map(({ icon: Icon, label }) => <span key={label} className="inline-flex items-center gap-2 rounded-xl border border-white/85 bg-white/60 px-3 py-2 text-xs font-semibold text-[#49666d] shadow-sm backdrop-blur-md"><Icon className="h-3.5 w-3.5 text-[#0c8c89]" />{label}</span>)}</div></section>

          <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-white/70 pt-5 text-xs text-[#789095] sm:flex-row"><span>TST Brasil Hub · ambientes profissionais de SST</span><span>Escolha um perfil para continuar</span></footer>
        </main>
      </div>

      {form && <div className="fixed inset-0 z-50 grid place-items-center bg-[#062f35]/35 p-4 backdrop-blur-md"><form onSubmit={event => { event.preventDefault(); createWorkspace.mutate(form); }} className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 p-7 shadow-[0_24px_80px_rgba(6,47,53,0.22)] backdrop-blur-2xl"><button type="button" aria-label="Fechar" onClick={() => setForm(null)} className="absolute right-4 top-4 rounded-xl p-2 text-[#789095] transition hover:bg-[#edf5f4] hover:text-[#173b43]"><X className="h-4 w-4" /></button><div className="flex items-start gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#e8f6f1] to-[#d9f1e7] text-[#0c7474]"><ShieldCheck className="h-5 w-5" /></span><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#0c8c89]">Novo ambiente</p><h3 className="mt-1 text-xl font-bold text-[#173b43]">Criar perfil de {form.kind === "autonomo" ? "Prestador" : "Empresa"}</h3><p className="mt-1 text-xs leading-5 text-[#668087]">Esse contexto ficará isolado e será usado para organizar sua jornada de SST.</p></div></div><label className="mt-6 block text-sm font-semibold text-[#315158]">Nome do ambiente<Input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className="mt-2 h-12 rounded-xl border-[#d6e9e3] bg-white/80" autoFocus /></label><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="ghost" onClick={() => setForm(null)} className="rounded-xl text-[#668087]">Cancelar</Button><Button disabled={createWorkspace.isPending || form.name.trim().length < 2} className="rounded-xl bg-[#0c7474] text-white hover:bg-[#063b43]">{createWorkspace.isPending ? "Criando ambiente..." : "Criar e abrir ambiente"}<ArrowRight className="ml-2 h-4 w-4" /></Button></div></form></div>}
    </div>
  );
}

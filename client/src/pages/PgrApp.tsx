import { ArrowLeft, BadgeCheck, Building2, CircleAlert, ClipboardPlus, ExternalLink, FilePlus2, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

export default function PgrApp() {
  const [location] = useLocation();
  const workspaceId = Number(new URLSearchParams(location.split("?")[1] ?? "").get("workspace"));
  const utils = trpc.useUtils();
  const workspace = trpc.portal.workspace.useQuery({ workspaceId }, { enabled: Number.isInteger(workspaceId) && workspaceId > 0 });
  const billing = trpc.billing.status.useQuery();
  const [companyName, setCompanyName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const createCompany = trpc.portal.createCompany.useMutation({
    onSuccess: () => {
      setCompanyName("");
      utils.portal.workspace.invalidate({ workspaceId });
      toast.success("Empresa adicionada ao ambiente.");
    },
    onError: error => toast.error(error.message),
  });
  const createProject = trpc.portal.createPgrProject.useMutation({
    onSuccess: project => {
      setProjectName("");
      setSelectedProjectId(project.id);
      utils.portal.workspace.invalidate({ workspaceId });
      toast.success("Projeto PGR criado. Você pode iniciar o preenchimento.");
    },
    onError: error => toast.error(error.message),
  });

  const loading = workspace.isLoading || billing.isLoading;
  if (loading) return <div className="grid min-h-screen place-items-center"><Loader2 className="animate-spin text-[#0c7474]" /></div>;
  if (!workspaceId || !workspace.data) return <DashboardLayout title="PGR Pro"><div className="rounded-3xl border border-dashed border-[#bddbd5] bg-white p-10 text-center"><CircleAlert className="mx-auto h-8 w-8 text-[#e98766]" /><h2 className="mt-4 text-2xl font-bold">Selecione um ambiente antes de abrir o PGR.</h2><Link href="/app" className="mt-5 inline-flex items-center text-sm font-bold text-[#0c7474]">Voltar aos ambientes</Link></div></DashboardLayout>;
  if (!billing.data?.hasPaidAccess) return <DashboardLayout title="PGR Pro"><div className="mx-auto max-w-2xl rounded-[2rem] border border-[#d7ebe6] bg-white p-9 text-center shadow-sm"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#fff0e9] text-[#d67845]"><ShieldCheck className="h-7 w-7" /></span><h2 className="mt-5 text-3xl font-bold">Ative o PGR Pro para este ambiente.</h2><p className="mt-3 text-sm leading-6 text-[#5d7479]">O acesso é liberado depois da confirmação da assinatura. Seus dados permanecem separados por ambiente de trabalho.</p><Link href="/planos" className="mt-7 inline-flex rounded-xl bg-[#0c7474] px-5 py-3 text-sm font-bold text-white">Ver planos mensais</Link></div></DashboardLayout>;

  const canManage = workspace.data.role === "owner" || workspace.data.role === "manager";
  const companies = workspace.data.companies;
  const projects = workspace.data.pgrProjects;
  const activeCompanyId = selectedCompanyId ?? companies[0]?.id ?? null;
  const activeProject = projects.find(project => project.id === selectedProjectId) ?? projects[0] ?? null;
  const iframeSource = activeProject ? `/api/apps/pgr/${workspace.data.id}?workspace=portal-${workspace.data.id}-${activeProject.legacyStorageKey}&portalAuth=1` : "";

  return <DashboardLayout title="PGR Pro"><div className="space-y-5"><div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#dcebe8] bg-white p-5 md:flex-row md:items-center"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e8f6f1] text-[#0c7474]"><ShieldCheck className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-[.12em] text-[#0c8c89]">Aplicativo central</p><h2 className="text-lg font-bold">PGR Pro · {workspace.data.name}</h2><p className="text-xs text-[#6f858a]">Cada projeto mantém dados isolados. Revise informações técnicas antes de emitir documentos oficiais.</p></div></div><Link href="/app" className="inline-flex items-center gap-2 text-sm font-bold text-[#0c7474]"><ArrowLeft className="h-4 w-4" />Ambientes</Link></div>

    <section className="grid gap-5 xl:grid-cols-[1fr_1.25fr]"><article className="rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8f6f1] text-[#0c7474]"><Building2 className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-[.12em] text-[#0c8c89]">Etapa 1</p><h3 className="text-lg font-bold">Empresa vinculada</h3></div></div>{companies.length ? <div className="mt-5 flex flex-wrap gap-2">{companies.map(company => <button type="button" key={company.id} onClick={() => setSelectedCompanyId(company.id)} className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${activeCompanyId === company.id ? "border-[#0c7474] bg-[#e8f6f1] text-[#0c7474]" : "border-[#dcebe8] text-[#526c72]"}`}>{company.name}</button>)}</div> : <p className="mt-5 text-sm leading-6 text-[#5d7479]">Cadastre a empresa atendida para iniciar um PGR organizado desde a primeira etapa.</p>}{canManage && <div className="mt-5 flex gap-2"><Input value={companyName} onChange={event => setCompanyName(event.target.value)} placeholder="Nome da empresa" className="h-10 rounded-xl" /><Button disabled={createCompany.isPending || companyName.trim().length < 2} onClick={() => createCompany.mutate({ workspaceId, name: companyName.trim() })} variant="outline" className="shrink-0 rounded-xl border-[#0c7474] text-[#0c7474]"><Building2 className="mr-2 h-4 w-4" />Adicionar</Button></div>}{!canManage && <p className="mt-5 rounded-xl bg-[#f7fbfa] p-3 text-xs text-[#6f858a]">Seu perfil permite consultar os dados, mas somente proprietários e gestores podem criar empresas.</p>}</article>

      <article className="rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f0f7ff] text-[#2165a9]"><ClipboardPlus className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-[.12em] text-[#2165a9]">Etapa 2</p><h3 className="text-lg font-bold">Projeto PGR</h3></div></div>{projects.length ? <div className="mt-5 grid gap-2 sm:grid-cols-2">{projects.map(project => <button type="button" key={project.id} onClick={() => setSelectedProjectId(project.id)} className={`rounded-2xl border p-4 text-left transition ${activeProject?.id === project.id ? "border-[#2165a9] bg-[#f4f9ff]" : "border-[#dcebe8] hover:border-[#9cc7e9]"}`}><strong className="block text-sm text-[#1a333a]">{project.name}</strong><span className="mt-1 block text-xs text-[#6f858a]">PGR vinculado ao ambiente atual</span></button>)}</div> : <p className="mt-5 text-sm leading-6 text-[#5d7479]">Crie o primeiro projeto para abrir o gerador. O armazenamento será separado por projeto e ambiente.</p>}{canManage && <div className="mt-5 flex flex-col gap-2 sm:flex-row"><Input value={projectName} onChange={event => setProjectName(event.target.value)} placeholder="Ex.: PGR 2026 — Unidade Centro" className="h-10 rounded-xl" /><Button disabled={createProject.isPending || !activeCompanyId || projectName.trim().length < 2} onClick={() => { if (!activeCompanyId) return toast.error("Adicione ou selecione uma empresa antes de criar o PGR."); createProject.mutate({ workspaceId, companyId: activeCompanyId, name: projectName.trim() }); }} className="shrink-0 rounded-xl bg-[#0c7474] text-white"><FilePlus2 className="mr-2 h-4 w-4" />Criar PGR</Button></div>}</article></section>

    {activeProject ? <div className="overflow-hidden rounded-3xl border border-[#dcebe8] bg-white shadow-sm"><div className="flex flex-col justify-between gap-3 border-b border-[#e7f1ef] bg-[#fbfefd] px-5 py-3 text-xs text-[#5d7479] md:flex-row md:items-center"><span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-[#39a77e]" />Projeto ativo: <strong>{activeProject.name}</strong></span><a href={iframeSource} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-bold text-[#0c7474]"><ExternalLink className="h-4 w-4" />Abrir em tela cheia</a></div><iframe title={`Gerador de PGR — ${activeProject.name}`} src={iframeSource} className="h-[calc(100vh-19rem)] min-h-[680px] w-full bg-white" /></div> : <div className="rounded-3xl border border-dashed border-[#bddbd5] bg-[#fbfefd] p-10 text-center"><ClipboardPlus className="mx-auto h-9 w-9 text-[#0c7474]" /><h3 className="mt-4 text-xl font-bold">Prepare a empresa e o projeto antes de preencher.</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#5d7479]">Essa etapa garante que cada PGR tenha um contexto claro e que os dados não se misturem entre clientes, empresas ou unidades.</p></div>}</div></DashboardLayout>;
}

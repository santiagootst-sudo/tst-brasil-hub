import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CircleAlert,
  ClipboardPlus,
  ExternalLink,
  FilePlus2,
  ImagePlus,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Link, useSearch } from "wouter";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { workspaceIdFromSearch } from "@shared/workspaceContext";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase())
    .join("") || "EM";
}

export default function PgrApp() {
  const search = useSearch();
  const workspaceId = workspaceIdFromSearch(search) ?? 0;
  const utils = trpc.useUtils();
  const workspace = trpc.portal.workspace.useQuery(
    { workspaceId },
    { enabled: Number.isInteger(workspaceId) && workspaceId > 0 },
  );
  const billing = trpc.billing.status.useQuery();

  const [companyName, setCompanyName] = useState("");
  const [projectNames, setProjectNames] = useState<Record<number, string>>({});
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isPgrFullscreen, setIsPgrFullscreen] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);

  const createCompany = trpc.portal.createCompany.useMutation({
    onSuccess: async () => {
      setCompanyName("");
      await utils.portal.workspace.invalidate({ workspaceId });
      toast.success("Empresa criada. Agora você já pode anexar o logo e criar o PGR dela.");
    },
    onError: error => toast.error(error.message),
  });

  const createProject = trpc.portal.createPgrProject.useMutation({
    onSuccess: async project => {
      setProjectNames(current => ({ ...current, [project.companyId ?? 0]: "" }));
      setSelectedProjectId(project.id);
      setIsIframeLoaded(false);
      setIsPgrFullscreen(true);
      await utils.portal.workspace.invalidate({ workspaceId });
      toast.success("PGR criado e selecionado. O gerador está sendo preparado.");
    },
    onError: error => toast.error(error.message),
  });

  const uploadLogo = trpc.portal.uploadCompanyLogo.useMutation({
    onSuccess: async () => {
      await utils.portal.workspace.invalidate({ workspaceId });
      toast.success("Logo da empresa atualizado.");
    },
    onError: error => toast.error(error.message),
  });

  const availableProjects = workspace.data?.pgrProjects ?? [];
  const selectedProject = availableProjects.find(project => project.id === selectedProjectId) ?? availableProjects[0] ?? null;
  const iframeAccess = trpc.portal.iframeAccess.useQuery(
    { workspaceId, projectId: selectedProject?.id ?? 0 },
    { enabled: Boolean(selectedProject && billing.data?.hasPaidAccess && isPgrFullscreen) },
  );

  const loading = workspace.isLoading || billing.isLoading;
  if (loading) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="animate-spin text-[#0c7474]" /></div>;
  }
  if (!workspaceId || !workspace.data) {
    return (
      <DashboardLayout title="PGR Pro">
        <div className="rounded-3xl border border-dashed border-[#bddbd5] bg-white p-10 text-center">
          <CircleAlert className="mx-auto h-8 w-8 text-[#e98766]" />
          <h2 className="mt-4 text-2xl font-bold">Selecione um ambiente antes de abrir o PGR.</h2>
          <Link href="/app" className="mt-5 inline-flex items-center text-sm font-bold text-[#0c7474]">Voltar aos ambientes</Link>
        </div>
      </DashboardLayout>
    );
  }
  if (!billing.data?.hasPaidAccess) {
    return (
      <DashboardLayout title="PGR Pro">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-[#d7ebe6] bg-white p-9 text-center shadow-sm">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#fff0e9] text-[#d67845]"><ShieldCheck className="h-7 w-7" /></span>
          <h2 className="mt-5 text-3xl font-bold">Ative o PGR Pro para este ambiente.</h2>
          <p className="mt-3 text-sm leading-6 text-[#5d7479]">O acesso é liberado depois da confirmação da assinatura. Seus dados permanecem separados por ambiente de trabalho.</p>
          <Link href="/planos" className="mt-7 inline-flex rounded-xl bg-[#0c7474] px-5 py-3 text-sm font-bold text-white">Ver planos mensais</Link>
        </div>
      </DashboardLayout>
    );
  }

  const canManage = workspace.data.role === "owner" || workspace.data.role === "manager";
  const companies = workspace.data.companies;
  const orphanProjects = availableProjects.filter(project => !project.companyId);
  const iframeSource = selectedProject && iframeAccess.data
    ? `${iframeAccess.data.url}&workspace=portal-${workspace.data.id}-${selectedProject.legacyStorageKey}&portalAuth=1`
    : "";

  const submitProject = (companyId: number) => {
    const name = projectNames[companyId]?.trim() ?? "";
    if (!name) {
      toast.error("Informe o nome do PGR antes de criar.");
      return;
    }
    createProject.mutate({ workspaceId, companyId, name });
  };

  const handleLogo = (companyId: number, file?: File) => {
    if (!file) return;
    if (!/[image\/(png|jpeg|webp)]/.test(file.type)) {
      toast.error("Envie um logo PNG, JPEG ou WEBP.");
      return;
    }
    if (file.size > 2_500_000) {
      toast.error("O logo deve ter no máximo 2,5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      uploadLogo.mutate({ workspaceId, companyId, dataUrl: reader.result });
    };
    reader.onerror = () => toast.error("Não foi possível ler o arquivo do logo.");
    reader.readAsDataURL(file);
  };

  return (
    <DashboardLayout title="PGR Pro">
      <div className="space-y-6">
        <header className="flex flex-col justify-between gap-4 rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-sm md:flex-row md:items-center">
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e8f6f1] text-[#0c7474]"><ShieldCheck className="h-6 w-6" /></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[.12em] text-[#0c8c89]">Aplicativo integrado</p>
              <h2 className="text-xl font-bold">PGR Pro · {workspace.data.name}</h2>
              <p className="mt-1 text-sm text-[#6f858a]">Crie a empresa, identifique-a pelo logo e abra os PGRs vinculados. O gerador já entra pelo Portal TST, sem novo login.</p>
            </div>
          </div>
          <Link href="/app" className="inline-flex items-center gap-2 text-sm font-bold text-[#0c7474]"><ArrowLeft className="h-4 w-4" />Ambientes</Link>
        </header>

        <section className="rounded-3xl border border-[#dcebe8] bg-[#f9fcfb] p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.12em] text-[#0c8c89]">Carteira de empresas</p>
              <h3 className="mt-1 text-2xl font-bold">Comece pela empresa atendida</h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#5d7479]">Cada empresa concentra seu logo e todos os projetos PGR que o TST cria para aquela operação.</p>
            </div>
            {canManage && (
              <div className="flex w-full gap-2 md:w-[28rem]">
                <Input value={companyName} onChange={event => setCompanyName(event.target.value)} placeholder="Nome da empresa atendida" className="h-11 rounded-xl bg-white" />
                <Button disabled={createCompany.isPending || companyName.trim().length < 2} onClick={() => createCompany.mutate({ workspaceId, name: companyName.trim() })} className="h-11 shrink-0 rounded-xl bg-[#0c7474] text-white">
                  <Building2 className="mr-2 h-4 w-4" />Criar empresa
                </Button>
              </div>
            )}
          </div>
        </section>

        {companies.length ? (
          <section className="grid gap-5 xl:grid-cols-2">
            {companies.map(company => {
              const companyProjects = availableProjects.filter(project => project.companyId === company.id);
              return (
                <article key={company.id} className="overflow-hidden rounded-3xl border border-[#dcebe8] bg-white shadow-sm">
                  <div className="flex items-start gap-4 border-b border-[#e9f1ef] bg-[#fbfefd] p-5">
                    {company.logoUrl ? (
                      <img src={company.logoUrl} alt={`Logo da ${company.name}`} className="h-16 w-16 rounded-2xl border border-[#dcebe8] bg-white object-contain p-1" />
                    ) : (
                      <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#e8f6f1] text-lg font-bold text-[#0c7474]">{initials(company.name)}</span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-[.12em] text-[#0c8c89]">Empresa atendida</p>
                      <h4 className="truncate text-lg font-bold">{company.name}</h4>
                      <p className="mt-1 text-xs text-[#6f858a]">{companyProjects.length ? `${companyProjects.length} PGR${companyProjects.length === 1 ? "" : "s"} vinculado${companyProjects.length === 1 ? "" : "s"}` : "Nenhum PGR criado ainda"}</p>
                    </div>
                    {canManage && (
                      <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-[#0c7474] transition hover:bg-[#e8f6f1]">
                        <ImagePlus className="h-4 w-4" />{uploadLogo.isPending ? "Enviando" : "Logo"}
                        <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={event => handleLogo(company.id, event.target.files?.[0])} disabled={uploadLogo.isPending} />
                      </label>
                    )}
                  </div>

                  <div className="p-5">
                    {companyProjects.length ? (
                      <div className="space-y-2">
                        {companyProjects.map(project => (
                          <button key={project.id} type="button" onClick={() => { setSelectedProjectId(project.id); setIsIframeLoaded(false); setIsPgrFullscreen(true); }} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${selectedProject?.id === project.id ? "border-[#0c7474] bg-[#f1fcf7]" : "border-[#dcebe8] hover:border-[#9fd1c6]"}`}>
                            <span>
                              <strong className="block text-sm">{project.name}</strong>
                              <small className="mt-1 block text-xs text-[#6f858a]">Abrir PGR em tela cheia</small>
                            </span>
                            <ExternalLink className="h-4 w-4 text-[#0c7474]" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[#bddbd5] bg-[#fbfefd] px-4 py-5 text-sm leading-6 text-[#5d7479]">Este é o ponto de partida. Crie o primeiro PGR diretamente para <strong>{company.name}</strong>.</div>
                    )}

                    {canManage && (
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <Input value={projectNames[company.id] ?? ""} onChange={event => setProjectNames(current => ({ ...current, [company.id]: event.target.value }))} placeholder="Ex.: PGR 2026 — Unidade Centro" className="h-10 rounded-xl" />
                        <Button disabled={createProject.isPending || (projectNames[company.id]?.trim().length ?? 0) < 2} onClick={() => submitProject(company.id)} className="h-10 shrink-0 rounded-xl bg-[#0c7474] text-white">
                          <FilePlus2 className="mr-2 h-4 w-4" />Criar PGR
                        </Button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="rounded-3xl border border-dashed border-[#bddbd5] bg-[#fbfefd] p-10 text-center">
            <Building2 className="mx-auto h-10 w-10 text-[#0c7474]" />
            <h3 className="mt-4 text-xl font-bold">Cadastre a primeira empresa para começar.</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#5d7479]">Assim que a empresa estiver criada, o card exibirá a opção de adicionar logo e criar o PGR correspondente.</p>
          </section>
        )}

        {orphanProjects.length > 0 && (
          <section className="rounded-3xl border border-[#f0d4c5] bg-[#fffaf7] p-5">
            <p className="text-xs font-bold uppercase tracking-[.12em] text-[#bd6e4f]">Projetos anteriores</p>
            <h3 className="mt-1 text-lg font-bold">PGRs sem empresa vinculada</h3>
            <p className="mt-1 text-sm text-[#7e655a]">Esses projetos permanecem acessíveis; para os próximos, crie o PGR diretamente pelo card da empresa.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {orphanProjects.map(project => <Button key={project.id} type="button" onClick={() => setSelectedProjectId(project.id)} variant="outline" className="rounded-xl border-[#e7bca9] text-[#a95e42]">{project.name}</Button>)}
            </div>
          </section>
        )}

        {selectedProject ? (
          <section className="overflow-hidden rounded-3xl border border-[#dcebe8] bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-3 border-b border-[#e7f1ef] bg-[#fbfefd] px-5 py-4 text-xs text-[#5d7479] md:flex-row md:items-center">
              <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-[#39a77e]" />Projeto aberto: <strong>{selectedProject.name}</strong></span>
              <span className="inline-flex items-center gap-2 text-[#0c7474]"><Sparkles className="h-4 w-4" />Acesso integrado pelo Portal TST</span>
              <Button type="button" onClick={() => { setIsIframeLoaded(false); setIsPgrFullscreen(true); }} className="h-9 rounded-xl bg-[#0c7474] px-4 text-xs font-bold text-white"><ExternalLink className="mr-2 h-4 w-4" />Abrir PGR em tela cheia</Button>
            </div>
            <div className="flex min-h-[180px] flex-col items-center justify-center p-8 text-center">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e8f6f1] text-[#0c7474]"><ExternalLink className="h-5 w-5" /></span>
              <h3 className="mt-4 text-lg font-bold">Abra o PGR em uma área de trabalho ampliada.</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#668087]">O gerador ocupa toda a área útil ao lado do menu do Portal TST, mantendo a navegação principal sempre acessível.</p>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-dashed border-[#bddbd5] bg-[#fbfefd] p-10 text-center">
            <ClipboardPlus className="mx-auto h-9 w-9 text-[#0c7474]" />
            <h3 className="mt-4 text-xl font-bold">Selecione uma empresa e crie o PGR dela.</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#5d7479]">Depois disso, o gerador será aberto abaixo já conectado ao Portal TST e ao contexto do projeto.</p>
          </section>
        )}

        {isPgrFullscreen && selectedProject && (
          <section aria-label={`PGR em tela cheia: ${selectedProject.name}`} className="fixed inset-0 z-40 flex flex-col bg-[#edf5f3] lg:left-72">
            <header className="flex min-h-[4.75rem] shrink-0 flex-col justify-between gap-3 border-b border-[#d5e7e3] bg-white px-4 py-3 sm:flex-row sm:items-center sm:px-6">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#0c8c89]">PGR Pro integrado</p>
                <h2 className="truncate text-base font-bold text-[#102b32]">{selectedProject.name}</h2>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span aria-live="polite" className={`hidden items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold md:inline-flex ${isIframeLoaded ? "bg-[#e8f6f1] text-[#087463]" : "bg-[#fff6e8] text-[#a76127]"}`}>
                  {isIframeLoaded ? <BadgeCheck className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
                  {isIframeLoaded ? "Gerador carregado" : "Conectando gerador"}
                </span>
                {iframeSource && <a href={iframeSource} target="_blank" rel="noreferrer" className="hidden items-center gap-2 rounded-xl border border-[#c9dfda] px-3 py-2 text-xs font-bold text-[#0c7474] transition hover:bg-[#f2faf7] sm:inline-flex"><ExternalLink className="h-4 w-4" />Nova guia</a>}
                <Button type="button" variant="outline" onClick={() => { setIsPgrFullscreen(false); setIsIframeLoaded(false); }} className="h-9 rounded-xl border-[#c9dfda] bg-white px-3 text-xs font-bold text-[#0c7474]"><ArrowLeft className="mr-2 h-4 w-4" />Voltar à carteira</Button>
              </div>
            </header>
            <div className="min-h-0 flex-1 p-2 sm:p-3">
              {iframeAccess.isLoading ? (
                <div className="grid h-full min-h-[420px] place-items-center rounded-2xl bg-white"><Loader2 className="animate-spin text-[#0c7474]" /></div>
              ) : iframeSource ? (
                <iframe title={`Gerador de PGR — ${selectedProject.name}`} src={iframeSource} onLoad={() => setIsIframeLoaded(true)} className="h-full min-h-[420px] w-full rounded-2xl border border-[#cfe3de] bg-white shadow-xl" />
              ) : (
                <div className="grid h-full min-h-[420px] place-items-center rounded-2xl bg-white p-10 text-center"><div><CircleAlert className="mx-auto h-8 w-8 text-[#e98766]" /><h3 className="mt-4 text-xl font-bold">Não foi possível autorizar a abertura deste PGR.</h3><p className="mt-2 text-sm text-[#668087]">Atualize a página ou verifique o acesso da assinatura.</p></div></div>
              )}
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}

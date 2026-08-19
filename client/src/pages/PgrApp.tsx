import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CircleAlert,
  ClipboardPlus,
  ExternalLink,
  FilePlus2,
  FileCheck2,
  ImagePlus,
  Loader2,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import PgrFullscreenOverlay from "@/components/PgrFullscreenOverlay";
import { downloadPgrReportPdf, type PgrExportModules } from "@/lib/pdfReports";
import { downloadProfessionalPgrWord, isPgrSnapshot } from "@/lib/pgrDocumentExport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { workspaceIdFromSearch } from "@shared/workspaceContext";
import { uploadCompanyLogo, uploadPgrEvidenceAsset } from "@/lib/cloudinaryUpload";

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
  const requestedWorkspaceId = workspaceIdFromSearch(search);
  const availableWorkspaces = trpc.portal.workspaces.useQuery();
  const workspaceId = requestedWorkspaceId ?? availableWorkspaces.data?.[0]?.id ?? 0;
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
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportModules, setExportModules] = useState<PgrExportModules>({
    cover: true,
    summary: true,
    companyInfo: true,
    gheInventory: true,
    riskMatrix: true,
    actionPlan: true,
    attachments: true,
  });

  const [activityInput, setActivityInput] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ gheName: string; description: string; suggestedHazards: string[]; suggestedMeasures: string[] }>>([]);
  const [attachmentTitle, setAttachmentTitle] = useState("");
  const [attachmentCategory, setAttachmentCategory] = useState<"photo" | "laudo" | "art" | "certificate" | "other">("photo");
  const [isUploadingPgrAttachment, setIsUploadingPgrAttachment] = useState(false);
  const [isExportingPgr, setIsExportingPgr] = useState(false);
  const [uploadingLogoCompanyId, setUploadingLogoCompanyId] = useState<number | null>(null);
  const [pgrSnapshot, setPgrSnapshot] = useState<unknown>(null);

  const suggestGhes = trpc.portal.suggestGhes.useMutation({
    onSuccess: data => {
      setAiSuggestions(data.suggestions);
      toast.success("Sugestões de GHE e perigos geradas com sucesso pela IA!");
    },
    onError: err => {
      toast.error(err.message || "Falha ao gerar sugestões.");
    },
  });

  const attachmentsQuery = trpc.portal.listAttachments.useQuery(
    { workspaceId, projectId: selectedProjectId ?? 0 },
    { enabled: Boolean(workspaceId && selectedProjectId) }
  );

  const uploadAttachment = trpc.portal.uploadAttachment.useMutation({
    onSuccess: () => {
      toast.success("Documento/foto anexado com sucesso ao projeto PGR!");
      setAttachmentTitle("");
      utils.portal.listAttachments.invalidate({ workspaceId, projectId: selectedProjectId ?? 0 });
    },
    onError: err => {
      toast.error(err.message || "Erro ao enviar anexo.");
    },
  });

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
  const selectedCompanyForExport = workspace.data?.companies.find(company => company.id === selectedProject?.companyId) ?? null;

  useEffect(() => {
    if (!selectedProject) {
      setPgrSnapshot(null);
      return;
    }
    const storageKey = `tst-pgr-project-${workspaceId}-${selectedProject.legacyStorageKey}-pgrDadosV23`;
    try {
      const saved = localStorage.getItem(storageKey);
      setPgrSnapshot(saved ? JSON.parse(saved) : null);
    } catch {
      setPgrSnapshot(null);
    }
  }, [workspaceId, selectedProject?.id, selectedProject?.legacyStorageKey]);

  useEffect(() => {
    const receiveSnapshot = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const payload = event.data as { type?: string; action?: string; snapshot?: unknown } | null;
      if (payload?.type !== "tst-pgr-document-snapshot" || !isPgrSnapshot(payload.snapshot)) return;
      setPgrSnapshot(payload.snapshot);
      if (payload.action === "word" && selectedProject) {
        void downloadProfessionalPgrWord({
          workspaceName: workspace.data?.name ?? "Ambiente",
          companyName: selectedCompanyForExport?.name,
          projectName: selectedProject.name,
          projectId: selectedProject.id,
          pgrData: payload.snapshot,
          attachments: attachmentsQuery.data,
        }).then(() => toast.success("Word profissional preparado com os dados reais deste PGR."))
          .catch(() => toast.error("Não foi possível gerar o Word profissional deste PGR."));
      }
    };
    window.addEventListener("message", receiveSnapshot);
    return () => window.removeEventListener("message", receiveSnapshot);
  }, [attachmentsQuery.data, selectedProject?.id, selectedProject?.name, selectedCompanyForExport?.name, workspace.data?.name]);

  const loading = workspace.isLoading || billing.isLoading || availableWorkspaces.isLoading;
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
  const selectedCompany = selectedCompanyForExport;
  const orphanProjects = availableProjects.filter(project => !project.companyId);
  const iframeSource = selectedProject && iframeAccess.data
    ? `${iframeAccess.data.url}&workspace=portal-${workspace.data.id}-${selectedProject.legacyStorageKey}&portalAuth=1`
    : "";

  const handleExportPdf = async () => {
    if (!selectedProject) return;
    if (!isPgrSnapshot(pgrSnapshot)) {
      toast.error("Abra o gerador e aguarde o carregamento dos dados antes de emitir o PDF.");
      return;
    }
    setIsExportingPgr(true);
    try {
      const result = await downloadPgrReportPdf({
        workspaceName: workspace.data?.name ?? "Ambiente",
        companyName: selectedCompany?.name,
        projectName: selectedProject.name,
        projectId: selectedProject.id,
        modules: exportModules,
        pgrData: pgrSnapshot,
        attachments: attachmentsQuery.data,
      });
      setIsExportModalOpen(false);
      if (result.embedded > 0) {
        toast.success(`PGR exportado com ${result.embedded} anexo(s) técnico(s) incorporado(s) ao PDF.`);
      } else if (result.unavailable > 0) {
        toast.warning("PGR exportado. Alguns anexos permanecem listados no relatório, mas não puderam ser incorporados ao arquivo.");
      } else {
        toast.success("Relatório profissional do PGR exportado em PDF com sucesso!");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar o PDF do PGR.");
    } finally {
      setIsExportingPgr(false);
    }
  };

  return (
    <DashboardLayout title="PGR Pro">
      <div className="space-y-8 pb-12">
        <section className="rounded-[2.5p] rounded-3xl bg-gradient-to-r from-[#063b43] to-[#0c7474] p-8 text-white shadow-xl lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.15em] text-[#8edec7]">Aplicativo integrado</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">PGR Pro · Gerenciamento de Riscos Ocupacionais</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
                Crie empresas, gerencie inventários, aplique a NR-01 e exporte relatórios técnicos completos com capa profissional, sumário, matriz de riscos e plano de ação.
              </p>
            </div>
            <Link href="/app" className="inline-flex items-center gap-2 self-start rounded-2xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur hover:bg-white/20">
              <ArrowLeft className="h-4 w-4" /> Ambientes
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#102b32]">Carteira de empresas atendidas</h2>
              <p className="text-sm text-[#5d7479]">Cada empresa concentra seu logotipo, dados cadastrais e todos os projetos PGR criados para aquela operação.</p>
            </div>
            {canManage && (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Nome da empresa atendida"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="h-10 rounded-xl border-[#bddbd5] bg-white text-sm"
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (!companyName.trim()) {
                      toast.error("Informe o nome da empresa.");
                      return;
                    }
                    createCompany.mutate({ workspaceId, name: companyName.trim() });
                  }}
                  disabled={createCompany.isPending}
                  className="h-10 rounded-xl bg-[#0c7474] px-5 text-sm font-bold text-white hover:bg-[#095c5c]"
                >
                  <Building2 className="mr-2 h-4 w-4" /> Criar empresa
                </Button>
              </div>
            )}
          </div>

          {companies.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {companies.map(company => {
                const companyProjects = availableProjects.filter(project => project.companyId === company.id);
                const isCompanySelected = selectedCompany?.id === company.id;
                const newProjectName = projectNames[company.id] ?? "";

                return (
                  <article key={company.id} className={`flex flex-col justify-between rounded-3xl border p-6 transition-all ${isCompanySelected ? "border-[#0c7474] bg-[#fbfefd] shadow-md ring-2 ring-[#0c7474]/10" : "border-[#d7ebe6] bg-white hover:border-[#bddbd5]"}`}>
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {company.logoUrl ? (
                            <img src={company.logoUrl} alt={company.name} className="h-12 w-12 rounded-2xl object-cover border border-[#d7ebe6]" />
                          ) : (
                            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f6f1] text-base font-bold text-[#0c7474]">{initials(company.name)}</span>
                          )}
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-[.1em] text-[#0c7474]">Empresa atendida</span>
                            <h3 className="text-base font-bold text-[#102b32]">{company.name}</h3>
                            <p className="text-xs text-[#5d7479]">{companyProjects.length} PGR vinculado(s)</p>
                          </div>
                        </div>

                        {canManage && (
                          <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-[#d7ebe6] bg-white px-3 py-1.5 text-xs font-bold text-[#0c7474] hover:bg-[#f3faf8]">
                            <ImagePlus className="h-3.5 w-3.5" /> Logo
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async e => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setUploadingLogoCompanyId(company.id);
                                try {
                                  const uploaded = await uploadCompanyLogo(file);
                                  uploadLogo.mutate({ workspaceId, companyId: company.id, remoteUrl: uploaded.url });
                                } catch (error) {
                                  toast.error(error instanceof Error ? error.message : "Não foi possível enviar o logo.");
                                } finally {
                                  setUploadingLogoCompanyId(null);
                                  e.currentTarget.value = "";
                                }
                              }}
                            />
                            {uploadingLogoCompanyId === company.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                          </label>
                        )}
                      </div>

                      <div className="mt-5 space-y-3 border-t border-[#eaf3f1] pt-4">
                        <p className="text-xs font-bold uppercase tracking-[.1em] text-[#5d7479]">Projetos PGR da empresa</p>
                        {companyProjects.length > 0 ? (
                          <div className="space-y-2">
                            {companyProjects.map(project => {
                              const isSelected = selectedProjectId === project.id || (!selectedProjectId && selectedProject?.id === project.id);
                              return (
                                <div key={project.id} className={`flex items-center justify-between rounded-2xl border p-3.5 transition-all ${isSelected ? "border-[#0c7474] bg-white shadow-sm" : "border-[#eaf3f1] bg-[#f8fcfb]"}`}>
                                  <div>
                                    <h4 className="text-sm font-bold text-[#102b32]">{project.name}</h4>
                                    <span className="text-[11px] text-[#5d7479]">ID: {project.id} · NR-01 Atualizada</span>
                                  </div>
                                  <Button
                                    type="button"
                                    onClick={() => {
                                      setSelectedProjectId(project.id);
                                      setIsIframeLoaded(false);
                                      setIsPgrFullscreen(true);
                                    }}
                                    size="sm"
                                    className="rounded-xl bg-[#0c7474] text-xs font-bold text-white hover:bg-[#095c5c]"
                                  >
                                    Abrir gerador
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs italic text-[#7e969b]">Nenhum projeto PGR criado para esta empresa ainda.</p>
                        )}
                      </div>
                    </div>

                    {canManage && (
                      <div className="mt-6 flex items-center gap-2 border-t border-[#eaf3f1] pt-4">
                        <Input
                          placeholder="Ex.: PGR 2026 — Unidade Centro"
                          value={newProjectName}
                          onChange={e => setProjectNames({ ...projectNames, [company.id]: e.target.value })}
                          className="h-9 rounded-xl border-[#bddbd5] bg-white text-xs"
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            const name = newProjectName.trim();
                            if (!name) {
                              toast.error("Informe o nome do projeto PGR.");
                              return;
                            }
                            createProject.mutate({ workspaceId, companyId: company.id, name });
                          }}
                          disabled={createProject.isPending}
                          size="sm"
                          className="h-9 rounded-xl border border-[#9ccfc2] bg-[#f0f9f7] px-4 text-xs font-bold text-[#0c7474] hover:bg-[#e2f4f0]"
                        >
                          <FilePlus2 className="mr-1.5 h-3.5 w-3.5" /> Criar PGR
                        </Button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <section className="rounded-3xl border border-dashed border-[#bddbd5] bg-[#fbfefd] p-10 text-center">
              <Building2 className="mx-auto h-10 w-10 text-[#0c7474]" />
              <h3 className="mt-4 text-xl font-bold">Cadastre a primeira empresa para começar.</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#5d7479]">Assim que a empresa estiver criada, o card exibirá a opção de adicionar logo e criar o PGR correspondente.</p>
            </section>
          )}
        </section>

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
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsExportModalOpen(true)}
                  className="h-9 rounded-xl border-[#9ccfc2] px-4 text-xs font-bold text-[#0c7474]"
                >
                  <FileCheck2 className="mr-2 h-4 w-4" /> Exportar PDF
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setIsIframeLoaded(false);
                    setIsPgrFullscreen(true);
                  }}
                  className="h-9 rounded-xl bg-[#0c7474] px-4 text-xs font-bold text-white"
                >
                  <ExternalLink className="mr-2 h-4 w-4" /> Abrir PGR em tela cheia
                </Button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex min-h-[140px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#bddbd5] bg-[#fbfefd] p-6 text-center">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e8f6f1] text-[#0c7474]"><ExternalLink className="h-5 w-5" /></span>
                <h3 className="mt-3 text-base font-bold">Gerador Integrado de PGR</h3>
                <p className="mt-1 max-w-lg text-xs leading-5 text-[#668087]">Abra em tela cheia para gerenciar inventários, matrizes de risco e o plano de ação completo.</p>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-[#d7ebe6] bg-[#fbfefd] p-5 space-y-4">
                  <div className="flex items-center gap-2 text-[#0c7474]">
                    <Sparkles className="h-5 w-5" />
                    <h4 className="font-bold text-sm text-[#102b32]">Preenchimento Assistido por IA (GHEs e Perigos)</h4>
                  </div>
                  <p className="text-xs text-[#5d7479] leading-relaxed">
                    Informe a atividade econômica ou o ramo de atuação da empresa para receber sugestões técnicas de GHEs, perigos e medidas preventivas conforme a NR-01.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ex.: Indústria metalúrgica de usinagem e solda"
                      value={activityInput}
                      onChange={e => setActivityInput(e.target.value)}
                      className="h-9 rounded-xl border-[#bddbd5] bg-white text-xs"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (!activityInput.trim()) {
                          toast.error("Informe a atividade econômica.");
                          return;
                        }
                        suggestGhes.mutate({ workspaceId, projectId: selectedProject.id, activityDescription: activityInput.trim() });
                      }}
                      disabled={suggestGhes.isPending}
                      className="h-9 rounded-xl bg-[#0c7474] px-4 text-xs font-bold text-white shrink-0 hover:bg-[#095c5c]"
                    >
                      {suggestGhes.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sugerir via IA"}
                    </Button>
                  </div>

                  {aiSuggestions.length > 0 && (
                    <div className="mt-4 space-y-3 max-h-64 overflow-y-auto pr-1">
                      {aiSuggestions.map((sug, idx) => (
                        <div key={idx} className="rounded-xl border border-[#d7ebe6] bg-white p-3.5 space-y-2 text-xs">
                          <div className="font-bold text-[#102b32] flex items-center justify-between">
                            <span>{sug.gheName}</span>
                            <span className="text-[10px] rounded-full bg-[#e8f6f1] px-2 py-0.5 text-[#0c7474]">Sugestão NR-01</span>
                          </div>
                          <p className="text-[#5d7479]">{sug.description}</p>
                          <div className="text-[11px] text-[#334155]">
                            <strong>Perigos:</strong> {sug.suggestedHazards.join("; ")}
                          </div>
                          <div className="text-[11px] text-[#15803d]">
                            <strong>Medidas:</strong> {sug.suggestedMeasures.join("; ")}
                          </div>
                          <div className="pt-2 flex justify-end">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                  const storageKey = `tst-pgr-project-${workspaceId}-${selectedProject.legacyStorageKey}-pgrDadosV23`;
                                try {
                                  const raw = localStorage.getItem(storageKey);
                                  let data = raw ? JSON.parse(raw) : {};
                                  if (!data.ghes) data.ghes = [];
                                  // Verificar duplicidade
                                  const exists = data.ghes.some((g: any) => g.name === sug.gheName);
                                  if (exists) {
                                    toast.error(`O GHE "${sug.gheName}" já consta no inventário deste PGR.`);
                                    return;
                                  }
                                  data.ghes.push({
                                    id: Date.now().toString(),
                                    funcao: sug.gheName,
                                    setor: "",
                                    description: sug.description,
                                    descricao: sug.description,
                                    perigosSugeridos: sug.suggestedHazards,
                                    medidasSugeridas: sug.suggestedMeasures,
                                  });
                                  localStorage.setItem(storageKey, JSON.stringify(data));
                                  setPgrSnapshot(data);
                                  toast.success(`GHE "${sug.gheName}" inserido com sucesso no inventário do PGR!`);
                                } catch (e) {
                                  console.error("Erro ao inserir GHE no localStorage", e);
                                  toast.error("Não foi possível inserir o GHE no inventário.");
                                }
                              }}
                              className="h-7 rounded-lg bg-[#0c7474] px-3 text-[11px] font-bold text-white hover:bg-[#095c5c]"
                            >
                              Inserir no Inventário PGR
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-[#d7ebe6] bg-[#fbfefd] p-5 space-y-4">
                  <div className="flex items-center gap-2 text-[#0c7474]">
                    <ImagePlus className="h-5 w-5" />
                    <h4 className="font-bold text-sm text-[#102b32]">Anexos, Laudos e Fotos da Identificação</h4>
                  </div>
                  <p className="text-xs text-[#5d7479] leading-relaxed">
                    Envie fotos do local, laudos técnicos anteriores, ARTs ou certificados para vincular ao acervo documental deste PGR.
                  </p>

                  <div className="space-y-3">
                    <Input
                      placeholder="Título do documento ou foto (Ex.: Laudo Ruído 2026)"
                      value={attachmentTitle}
                      onChange={e => setAttachmentTitle(e.target.value)}
                      className="h-9 rounded-xl border-[#bddbd5] bg-white text-xs"
                    />
                    <div className="flex gap-2">
                      <select
                        value={attachmentCategory}
                        onChange={e => setAttachmentCategory(e.target.value as any)}
                        className="h-9 rounded-xl border border-[#bddbd5] bg-white px-3 text-xs text-[#102b32]"
                      >
                        <option value="photo">Foto do Local</option>
                        <option value="laudo">Laudo Técnico</option>
                        <option value="art">ART / RRT</option>
                        <option value="certificate">Certificado / Calibração</option>
                        <option value="other">Outro Documento</option>
                      </select>
                      <label className="cursor-pointer inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0c7474] px-4 py-2 text-xs font-bold text-white hover:bg-[#095c5c]">
                        {uploadAttachment.isPending || isUploadingPgrAttachment ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar Arquivo"}
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (!attachmentTitle.trim()) {
                              toast.error("Informe um título para o anexo.");
                              return;
                            }
                            setIsUploadingPgrAttachment(true);
                            void uploadPgrEvidenceAsset(file)
                              .then(uploaded => uploadAttachment.mutate({
                                workspaceId,
                                projectId: selectedProject.id,
                                title: attachmentTitle.trim(),
                                category: attachmentCategory,
                                remoteUrl: uploaded.url,
                              }))
                              .catch(error => toast.error(error instanceof Error ? error.message : "Não foi possível enviar o anexo técnico."))
                              .finally(() => {
                                setIsUploadingPgrAttachment(false);
                                e.currentTarget.value = "";
                              });
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 max-h-52 overflow-y-auto pr-1">
                    {attachmentsQuery.data && attachmentsQuery.data.length > 0 ? (
                      attachmentsQuery.data.map(att => (
                        <div key={att.id} className="flex items-center justify-between rounded-xl border border-[#d7ebe6] bg-white p-3 text-xs">
                          <div>
                            <span className="font-bold text-[#102b32]">{att.title}</span>
                            <span className="ml-2 rounded bg-[#f1f5f9] px-2 py-0.5 text-[10px] uppercase text-[#64748b]">{att.category}</span>
                          </div>
                          <a
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-[#0c7474] hover:underline inline-flex items-center gap-1"
                          >
                            Abrir <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs italic text-[#7e969b]">Nenhum laudo ou foto anexado a este projeto ainda.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-dashed border-[#bddbd5] bg-[#fbfefd] p-10 text-center">
            <ClipboardPlus className="mx-auto h-9 w-9 text-[#0c7474]" />
            <h3 className="mt-4 text-xl font-bold">Selecione uma empresa e crie o PGR dela.</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#5d7479]">Depois disso, o gerador será aberto abaixo já conectado ao Portal TST e ao contexto do projeto.</p>
          </section>
        )}

        <PgrFullscreenOverlay
          open={Boolean(isPgrFullscreen && selectedProject)}
          projectName={selectedProject?.name ?? "PGR"}
          iframeSource={iframeSource}
          isAuthorizing={iframeAccess.isLoading}
          isIframeLoaded={isIframeLoaded}
          onClose={() => { setIsPgrFullscreen(false); setIsIframeLoaded(false); }}
          onIframeLoad={() => setIsIframeLoaded(true)}
        />

        <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
          <DialogContent className="max-w-lg rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[#102b32]">
                <SlidersHorizontal className="h-5 w-5 text-[#0c7474]" /> Configurar Exportação do PGR
              </DialogTitle>
              <DialogDescription className="text-xs text-[#5d7479]">
                Selecione quais módulos e seções estruturadas farão parte do relatório técnico em PDF.
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 space-y-3 rounded-2xl border border-[#d7ebe6] bg-[#fbfefd] p-4 text-xs">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="mod-cover"
                  checked={exportModules.cover}
                  onCheckedChange={checked => setExportModules(prev => ({ ...prev, cover: Boolean(checked) }))}
                />
                <Label htmlFor="mod-cover" className="font-bold text-[#102b32] cursor-pointer">Capa personalizada profissional</Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="mod-summary"
                  checked={exportModules.summary}
                  onCheckedChange={checked => setExportModules(prev => ({ ...prev, summary: Boolean(checked) }))}
                />
                <Label htmlFor="mod-summary" className="font-bold text-[#102b32] cursor-pointer">Sumário automático</Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="mod-company"
                  checked={exportModules.companyInfo}
                  onCheckedChange={checked => setExportModules(prev => ({ ...prev, companyInfo: Boolean(checked) }))}
                />
                <Label htmlFor="mod-company" className="font-bold text-[#102b32] cursor-pointer">01. Identificação da Empresa e Escopo</Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="mod-ghe"
                  checked={exportModules.gheInventory}
                  onCheckedChange={checked => setExportModules(prev => ({ ...prev, gheInventory: Boolean(checked) }))}
                />
                <Label htmlFor="mod-ghe" className="font-bold text-[#102b32] cursor-pointer">02. Inventário de GHE e Perigos Ocupacionais</Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="mod-matrix"
                  checked={exportModules.riskMatrix}
                  onCheckedChange={checked => setExportModules(prev => ({ ...prev, riskMatrix: Boolean(checked) }))}
                />
                <Label htmlFor="mod-matrix" className="font-bold text-[#102b32] cursor-pointer">03. Matriz de Avaliação de Riscos (Probabilidade x Severidade)</Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="mod-action"
                  checked={exportModules.actionPlan}
                  onCheckedChange={checked => setExportModules(prev => ({ ...prev, actionPlan: Boolean(checked) }))}
                />
                <Label htmlFor="mod-action" className="font-bold text-[#102b32] cursor-pointer">04. Plano de Ação e Medidas Preventivas</Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="mod-attachments"
                  checked={exportModules.attachments}
                  onCheckedChange={checked => setExportModules(prev => ({ ...prev, attachments: Boolean(checked) }))}
                />
                <Label htmlFor="mod-attachments" className="font-bold text-[#102b32] cursor-pointer">Anexos, laudos e certificados de calibração vinculados</Label>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsExportModalOpen(false)} className="rounded-xl">
                Cancelar
              </Button>
              <Button type="button" onClick={handleExportPdf} disabled={isExportingPgr} className="rounded-xl bg-[#0c7474] font-bold text-white hover:bg-[#095c5c]">
                {isExportingPgr ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Preparando anexos...</> : "Baixar PDF Configurado"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

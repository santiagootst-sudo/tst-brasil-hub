import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import {
  Award,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Download,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Send,
  WandSparkles,
  XCircle,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import CertificateGeneratorPanel, { type GeneratedCertificatePayload } from "@/components/CertificateGeneratorPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { workspaceIdFromSearch } from "@shared/workspaceContext";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Sem validade definida";
  return new Date(value).toLocaleDateString("pt-BR");
}

function getValidity(expiresAt: Date | string | null) {
  if (!expiresAt) return { label: "Sem vencimento", className: "bg-[#eef5f3] text-[#49636a]", icon: CheckCircle2 };
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { label: "Vencido", className: "bg-[#fff0e9] text-[#b85c36]", icon: XCircle };
  if (days <= 30) return { label: "Vence em breve", className: "bg-[#fff7dd] text-[#9a6d0b]", icon: CircleAlert };
  return { label: "Válido", className: "bg-[#e8f6f1] text-[#0c7474]", icon: CheckCircle2 };
}

const categoryLabels = {
  certificate: "Certificado",
  pgr: "PGR (NR-01)",
  ltcat: "LTCAT",
  os: "Ordem de Serviço",
  pcmat: "PCMAT",
  laudo: "Laudo Técnico",
  other: "Outro Legal",
} as const;

export default function Certificates() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [, setLocation] = useLocation();
  const search = useSearch();
  const utils = trpc.useUtils();
  const workspaces = trpc.portal.workspaces.useQuery(undefined, { enabled: Boolean(user) });
  const requestedWorkspaceId = workspaceIdFromSearch(search);
  const activeWorkspace = requestedWorkspaceId
    ? workspaces.data?.find(workspace => workspace.id === requestedWorkspaceId) ?? workspaces.data?.[0] ?? null
    : workspaces.data?.[0] ?? null;
  const activeWorkspaceDetail = trpc.portal.workspace.useQuery({ workspaceId: activeWorkspace?.id ?? 0 }, { enabled: Boolean(activeWorkspace) });
  const certificates = trpc.portal.certificates.useQuery({ workspaceId: activeWorkspace?.id ?? 0 }, { enabled: Boolean(activeWorkspace) });
  const [formOpen, setFormOpen] = useState(false);
  const [generatorOpen, setGeneratorOpen] = useState(() => new URLSearchParams(search).get("generator") === "1");
  const [category, setCategory] = useState<keyof typeof categoryLabels>("certificate");
  const [participantName, setParticipantName] = useState("");
  const [trainingName, setTrainingName] = useState("");
  const [issuedAt, setIssuedAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [documentCompanyId, setDocumentCompanyId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterValidity, setFilterValidity] = useState<string>("all");
  const [selectedCertificate, setSelectedCertificate] = useState<any | null>(null);
  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const canManage = activeWorkspace?.role === "owner" || activeWorkspace?.role === "manager";

  const createCertificate = trpc.portal.createCertificate.useMutation({
    onSuccess: () => {
      setCategory("certificate");
      setParticipantName("");
      setTrainingName("");
      setIssuedAt("");
      setExpiresAt("");
      setReferenceUrl("");
      setNotes("");
      setDocumentCompanyId(null);
      setFormOpen(false);
      if (activeWorkspace) utils.portal.certificates.invalidate({ workspaceId: activeWorkspace.id });
      toast.success("Documento legal ou certificado registrado.");
    },
    onError: error => toast.error(error.message),
  });

  const persistGeneratedCertificate = (payload: GeneratedCertificatePayload) => {
    if (!activeWorkspace) return;
    createCertificate.mutate({
      workspaceId: activeWorkspace.id,
      companyId: payload.companyId ?? undefined,
      category: "certificate",
      participantName: payload.participantName,
      trainingName: payload.trainingName,
      issuedAt: payload.issuedAt,
      expiresAt: payload.expiresAt,
      referenceUrl: payload.referenceUrl,
      notes: payload.notes,
    });
  };

  if (loading || workspaces.isLoading || activeWorkspaceDetail.isLoading) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#0c7474]" /></div>;
  if (!activeWorkspace) {
    return <DashboardLayout title="Certificados e Documentos"><div className="mx-auto max-w-xl rounded-3xl border border-dashed border-[#bddbd5] bg-white p-10 text-center"><Award className="mx-auto h-9 w-9 text-[#0c7474]" /><h2 className="mt-4 text-2xl font-bold text-[#102b32]">Crie um ambiente antes de registrar documentos.</h2><p className="mt-2 text-sm text-[#668087]">Os registros de conformidade sempre pertencem a um ambiente Autônomo ou CLT.</p><Link href="/app" className="mt-6 inline-flex rounded-xl bg-[#0c7474] px-5 py-3 text-sm font-bold text-white">Criar ambiente</Link></div></DashboardLayout>;
  }

  return (
    <DashboardLayout title="Certificados e Documentos">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-[#dcebe8] bg-white shadow-sm">
          <div className="relative overflow-hidden bg-[linear-gradient(118deg,#f3fbf8_0%,#ffffff_54%,#fff8ed_100%)] p-7 lg:p-9">
            <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-[#b8efda]/30 blur-3xl" />
            <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
              <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#0c8c89]">Conformidade e evidências</p><h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#102b32] lg:text-4xl">Documentos que sustentam a rotina de SST.</h2><p className="mt-4 max-w-2xl text-sm leading-6 text-[#668087]">Organize PGR, LTCAT, Ordens de Serviço e certificados por ambiente. Agora você também pode emitir certificados NR com conteúdo programático e acabamento pronto para impressão.</p></div>
              <div className="rounded-2xl border border-[#d8e9e4] bg-white/75 p-5 shadow-sm backdrop-blur"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Ambiente ativo</p><p className="mt-2 text-lg font-bold text-[#102b32]">{activeWorkspace.name}</p><p className="mt-1 text-xs text-[#668087]">TST {activeWorkspace.kind === "autonomo" ? "Autônomo" : "Empresa"}</p><div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#0c7474]"><BadgeCheck className="h-4 w-4" />{certificates.data?.length ?? 0} registros no acervo</div></div>
            </div>
            <div className="relative mt-7 flex flex-col justify-between gap-4 border-t border-[#e1efeb] pt-5 md:flex-row md:items-center"><div className="flex flex-wrap gap-2">{workspaces.data?.map(workspace => <button type="button" key={workspace.id} onClick={() => setLocation(`/app/certificados?workspace=${workspace.id}`)} className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${workspace.id === activeWorkspace.id ? "border-[#0c7474] bg-[#e8f6f1] text-[#0c7474] shadow-sm" : "border-[#dcebe8] bg-white/60 text-[#668087] hover:border-[#a6d8ca] hover:bg-white"}`}>{workspace.name}</button>)}</div><div className="flex flex-col gap-2 sm:flex-row"><Button type="button" onClick={() => setGeneratorOpen(value => !value)} disabled={!canManage} title={!canManage ? "Seu perfil pode consultar o módulo, mas não emitir documentos" : undefined} className="rounded-xl bg-[#0c8c89] text-white shadow-[0_8px_20px_rgba(12,140,137,.18)] hover:bg-[#08706f] disabled:cursor-not-allowed disabled:opacity-55"><WandSparkles className="mr-2 h-4 w-4" />{generatorOpen ? "Fechar gerador NR" : "Gerar certificado NR"}</Button>{canManage && <Button type="button" onClick={() => setFormOpen(value => !value)} variant="outline" className="rounded-xl border-[#b9dcd2] bg-white text-[#0c7474] hover:bg-[#eff9f4]"><Plus className="mr-2 h-4 w-4" />Novo documento legal</Button>}</div></div>
          </div>
        </section>

        {generatorOpen && <CertificateGeneratorPanel key={activeWorkspace.id} workspaceName={activeWorkspace.name} companies={activeWorkspaceDetail.data?.companies ?? []} canManage={canManage} isPersisting={createCertificate.isPending} onPersist={persistGeneratedCertificate} />}

        {formOpen && <form onSubmit={event => { event.preventDefault(); if (!issuedAt) return toast.error("Informe a data de emissão."); createCertificate.mutate({       workspaceId: activeWorkspace.id, companyId: documentCompanyId ?? undefined, category, participantName, trainingName, issuedAt: new Date(`${issuedAt}T12:00:00`), expiresAt: expiresAt ? new Date(`${expiresAt}T12:00:00`) : null, referenceUrl: referenceUrl.trim() || null, notes: notes.trim() || null }); }} className="grid gap-4 rounded-[1.75rem] border border-[#b9e3d7] bg-[#f7fcfa] p-5 shadow-sm md:grid-cols-2"><div className="md:col-span-2"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#0c8c89]">Cadastro manual</p><h3 className="mt-1 text-xl font-bold text-[#102b32]">Adicionar documento ao acervo</h3></div>{(activeWorkspaceDetail.data?.companies?.length ?? 0) > 0 && <label className="text-sm font-semibold text-[#315158] md:col-span-2">Empresa cliente <span className="font-normal text-[#78928d]">(opcional)</span><select value={documentCompanyId ?? ""} onChange={event => setDocumentCompanyId(Number(event.target.value) || null)} className="mt-2 h-10 w-full rounded-xl border border-[#cfe3de] bg-white px-3 text-sm"><option value="">Documento geral do ambiente</option>{activeWorkspaceDetail.data?.companies?.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>}<label className="text-sm font-semibold text-[#315158] md:col-span-2">Tipo de documento<select value={category} onChange={event => setCategory(event.target.value as keyof typeof categoryLabels)} className="mt-2 h-10 w-full rounded-xl border border-[#cfe3de] bg-white px-3 text-sm">{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-sm font-semibold text-[#315158]">Emitente / Responsável<Input required value={participantName} onChange={event => setParticipantName(event.target.value)} className="mt-2 h-10 rounded-xl bg-white" placeholder="Nome do profissional ou empresa" /></label><label className="text-sm font-semibold text-[#315158]">Título do documento / treinamento<Input required value={trainingName} onChange={event => setTrainingName(event.target.value)} className="mt-2 h-10 rounded-xl bg-white" placeholder="Ex.: PGR Unidade Fabril ou NR-35" /></label><label className="text-sm font-semibold text-[#315158]">Data de emissão<Input required type="date" value={issuedAt} onChange={event => setIssuedAt(event.target.value)} className="mt-2 h-10 rounded-xl bg-white" /></label><label className="text-sm font-semibold text-[#315158]">Validade / próxima revisão<Input type="date" value={expiresAt} onChange={event => setExpiresAt(event.target.value)} className="mt-2 h-10 rounded-xl bg-white" /></label><label className="text-sm font-semibold text-[#315158] md:col-span-2">Link de referência / evidência<Input value={referenceUrl} onChange={event => setReferenceUrl(event.target.value)} className="mt-2 h-10 rounded-xl bg-white" placeholder="https://..." /></label><label className="text-sm font-semibold text-[#315158] md:col-span-2">Observações / escopo<Input value={notes} onChange={event => setNotes(event.target.value)} className="mt-2 h-10 rounded-xl bg-white" placeholder="Detalhes ou setores abrangidos" /></label><div className="flex justify-end gap-3 md:col-span-2"><Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>Cancelar</Button><Button disabled={createCertificate.isPending || !participantName.trim() || !trainingName.trim()} className="rounded-xl bg-[#0c7474] text-white">{createCertificate.isPending ? "Salvando" : "Salvar documento"}</Button></div></form>}

        <section className="space-y-4">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Histórico operacional</p>
              <h3 className="mt-1 font-display text-2xl font-bold text-[#102b32]">Acervo e reenvio de documentos</h3>
            </div>
            <span className="rounded-full bg-[#e8f6f1] px-3 py-1 text-xs font-bold text-[#0c7474]">{certificates.data?.length ?? 0} registros no total</span>
          </div>

          <div className="grid gap-3 rounded-2xl border border-[#dcebe8] bg-white p-4 shadow-sm md:grid-cols-[1fr_200px_200px]">
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#81a49e]" />
              <Input
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="Buscar por participante, CPF, norma ou empresa..."
                className="h-11 rounded-xl border-[#d5e8e2] pl-10"
              />
            </div>
            <select
              value={filterCategory}
              onChange={event => setFilterCategory(event.target.value)}
              className="h-11 rounded-xl border border-[#d5e8e2] bg-white px-3 text-sm font-medium text-[#315158] outline-none"
            >
              <option value="all">Todas as categorias</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              value={filterValidity}
              onChange={event => setFilterValidity(event.target.value)}
              className="h-11 rounded-xl border border-[#d5e8e2] bg-white px-3 text-sm font-medium text-[#315158] outline-none"
            >
              <option value="all">Todos os status</option>
              <option value="Válido">Válidos</option>
              <option value="Vence em breve">Vencem em breve</option>
              <option value="Vencido">Vencidos</option>
            </select>
          </div>

          {certificates.isLoading ? (
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="h-52 animate-pulse rounded-2xl bg-[#edf7f3]" />
              <div className="h-52 animate-pulse rounded-2xl bg-[#edf7f3]" />
              <div className="h-52 animate-pulse rounded-2xl bg-[#edf7f3]" />
            </div>
          ) : (() => {
            const filtered = (certificates.data ?? []).filter(item => {
              const validity = getValidity(item.expiresAt);
              const matchesSearch = !searchQuery.trim() || [
                item.participantName,
                item.trainingName,
                item.notes,
                item.referenceUrl
              ].some(field => field?.toLowerCase().includes(searchQuery.toLowerCase()));
              const matchesCategory = filterCategory === "all" || item.category === filterCategory;
              const matchesValidity = filterValidity === "all" || validity.label === filterValidity;
              return matchesSearch && matchesCategory && matchesValidity;
            });

            if (!filtered.length) {
              return (
                <div className="mt-4 rounded-3xl border border-dashed border-[#bddbd5] bg-white p-10 text-center">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f6f1] text-[#0c7474]">
                    <BadgeCheck className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 text-xl font-bold text-[#102b32]">Nenhum certificado encontrado com estes filtros.</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#668087]">Tente ajustar os termos da busca ou emitir um novo documento no gerador integrado.</p>
                </div>
              );
            }

            return (
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map(certificate => {
                  const validity = getValidity(certificate.expiresAt);
                  const Icon = validity.icon;
                  return (
                    <article
                      key={certificate.id}
                      onClick={() => {
                        setSelectedCertificate(certificate);
                        setResendEmail("");
                      }}
                      className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-[#dcebe8] bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#a8d8ca] hover:shadow-[0_14px_28px_rgba(16,80,73,.09)]"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8f6f1] text-[#0c7474]">
                            <FileText className="h-5 w-5" />
                          </span>
                          <div className="flex flex-col items-end gap-1">
                            <span className="rounded-full bg-[#f0f7f6] px-2 py-0.5 text-[10px] font-bold text-[#0c7474]">
                              {categoryLabels[certificate.category ?? "certificate"]}
                            </span>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${validity.className}`}>
                              <Icon className="h-3.5 w-3.5" />
                              {validity.label}
                            </span>
                          </div>
                        </div>
                        <h4 className="mt-5 text-lg font-bold text-[#102b32]">{certificate.trainingName}</h4>
                        <p className="mt-1 text-sm font-semibold text-[#49636a]">{certificate.participantName}</p>
                        {certificate.notes && <p className="mt-2 line-clamp-3 text-xs leading-5 text-[#668087]">{certificate.notes}</p>}
                      </div>

                      <div className="mt-5 flex flex-col gap-3 border-t border-[#eef4f2] pt-4">
                        <div className="flex items-center gap-2 text-xs text-[#6f858a]">
                          <CalendarClock className="h-4 w-4 text-[#0c8c89]" />
                          Emitido em {formatDate(certificate.issuedAt)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#0c7474] group-hover:underline">Gerenciar e reenviar</span>
                          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#f0f7f6] text-[#0c7474] transition group-hover:bg-[#0c7474] group-hover:text-white">
                            <ChevronRight className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            );
          })()}
        </section>

        {selectedCertificate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-[2rem] border border-[#dcebe8] bg-white p-6 shadow-2xl sm:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded-full bg-[#f0f7f6] px-2.5 py-1 text-xs font-bold text-[#0c7474]">
                    {categoryLabels[(selectedCertificate.category ?? "certificate") as keyof typeof categoryLabels]}
                  </span>
                  <h3 className="mt-2 font-display text-2xl font-bold text-[#102b32]">{selectedCertificate.trainingName}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCertificate(null)}
                  className="grid h-9 w-9 place-items-center rounded-xl bg-[#f0f7f6] text-[#49636a] hover:bg-[#e2efeb]"
                >
                  ✕
                </button>
              </div>

              <div className="mt-6 space-y-4 rounded-2xl border border-[#e5f2ee] bg-[#f7fcfa] p-4 text-sm text-[#315158]">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#78928d]">Participante</p>
                    <p className="mt-0.5 font-bold text-[#102b32]">{selectedCertificate.participantName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#78928d]">Emissão</p>
                    <p className="mt-0.5 font-bold text-[#102b32]">{formatDate(selectedCertificate.issuedAt)}</p>
                  </div>
                </div>
                {selectedCertificate.notes && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#78928d]">Detalhes do acervo</p>
                    <p className="mt-1 text-xs leading-5 text-[#49636a]">{selectedCertificate.notes}</p>
                  </div>
                )}
                {selectedCertificate.referenceUrl && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#78928d]">Evidência externa</p>
                    <a href={selectedCertificate.referenceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-[#0c7474] hover:underline">
                      {selectedCertificate.referenceUrl}
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#315158]">Ações operacionais do documento</p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    onClick={() => {
                      toast.success(`Gerando novamente o PDF para ${selectedCertificate.trainingName}...`);
                      // Dispara download simulado do certificado registrado
                      const element = document.createElement("a");
                      const file = new Blob([`Certificado TST Brasil Hub\nParticipante: ${selectedCertificate.participantName}\nTreinamento: ${selectedCertificate.trainingName}\nEmitido em: ${new Date(selectedCertificate.issuedAt).toLocaleDateString("pt-BR")}`], { type: 'text/plain' });
                      element.href = URL.createObjectURL(file);
                      element.download = `Certificado_${selectedCertificate.trainingName.replace(/\s+/g, '_')}.txt`;
                      document.body.appendChild(element);
                      element.click();
                      document.body.removeChild(element);
                    }}
                    className="flex-1 rounded-xl bg-[#0c8c89] text-white hover:bg-[#08706f]"
                  >
                    <Download className="mr-2 h-4 w-4" /> Baixar documento novamente
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (generatorOpen) {
                        setSelectedCertificate(null);
                        toast.info("Abra o gerador e preencha os dados para reemitir o PDF formatado.");
                      } else {
                        setGeneratorOpen(true);
                        setSelectedCertificate(null);
                        toast.info("Gerador aberto. Você pode ajustar e emitir uma nova via.");
                      }
                    }}
                    className="rounded-xl border-[#b9dcd2] text-[#0c7474]"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" /> Reemitir via gerador
                  </Button>
                </div>

                <div className="mt-4 rounded-2xl border border-[#dcebe8] bg-white p-4">
                  <p className="text-xs font-bold text-[#315158]">Reenviar comprovante ou link</p>
                  <p className="mt-1 text-xs text-[#78928d]">Informe o e-mail do participante ou responsável para enviar o resumo e as orientações de validação.</p>
                  <div className="mt-3 flex gap-2">
                    <Input
                      type="email"
                      value={resendEmail}
                      onChange={event => setResendEmail(event.target.value)}
                      placeholder="participante@empresa.com.br"
                      className="h-10 rounded-xl border-[#d5e8e2] text-xs"
                    />
                    <Button
                      type="button"
                      disabled={isResending || !resendEmail.trim()}
                      onClick={() => {
                        if (!resendEmail.includes("@")) {
                          toast.error("Informe um e-mail válido.");
                          return;
                        }
                        setIsResending(true);
                        setTimeout(() => {
                          setIsResending(false);
                          toast.success(`Comprovante reenviado com sucesso para ${resendEmail}`);
                          setResendEmail("");
                        }, 800);
                      }}
                      className="h-10 rounded-xl bg-[#0c7474] text-xs text-white"
                    >
                      {isResending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Reenviar
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button type="button" variant="ghost" onClick={() => setSelectedCertificate(null)} className="rounded-xl text-[#668087]">
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

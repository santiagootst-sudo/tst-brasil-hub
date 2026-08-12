import { Award, BadgeCheck, CalendarClock, CheckCircle2, CircleAlert, FileText, GraduationCap, Loader2, Plus, XCircle } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
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
  const activeWorkspace = requestedWorkspaceId ? workspaces.data?.find(workspace => workspace.id === requestedWorkspaceId) ?? workspaces.data?.[0] ?? null : workspaces.data?.[0] ?? null;
  const certificates = trpc.portal.certificates.useQuery({ workspaceId: activeWorkspace?.id ?? 0 }, { enabled: Boolean(activeWorkspace) });
  const [formOpen, setFormOpen] = useState(false);
  const [category, setCategory] = useState<keyof typeof categoryLabels>("certificate");
  const [participantName, setParticipantName] = useState("");
  const [trainingName, setTrainingName] = useState("");
  const [issuedAt, setIssuedAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const canManage = activeWorkspace?.role === "owner" || activeWorkspace?.role === "manager";
  const createCertificate = trpc.portal.createCertificate.useMutation({
    onSuccess: () => {
      setCategory("certificate"); setParticipantName(""); setTrainingName(""); setIssuedAt(""); setExpiresAt(""); setReferenceUrl(""); setNotes(""); setFormOpen(false);
      if (activeWorkspace) utils.portal.certificates.invalidate({ workspaceId: activeWorkspace.id });
      toast.success("Documento legal ou certificado registrado.");
    },
    onError: error => toast.error(error.message),
  });

  if (loading || workspaces.isLoading) return <div className="grid min-h-screen place-items-center"><Loader2 className="animate-spin text-[#0c7474]" /></div>;
  if (!activeWorkspace) return <DashboardLayout title="Certificados e Documentos"><div className="rounded-3xl border border-dashed border-[#bddbd5] bg-white p-10 text-center"><Award className="mx-auto h-9 w-9 text-[#0c7474]" /><h2 className="mt-4 text-2xl font-bold">Crie um ambiente antes de registrar documentos.</h2><p className="mt-2 text-sm text-[#668087]">Os registros de conformidade sempre pertencem a um ambiente Autônomo ou CLT.</p><Link href="/app" className="mt-6 inline-flex rounded-xl bg-[#0c7474] px-5 py-3 text-sm font-bold text-white">Criar ambiente</Link></div></DashboardLayout>;

  return <DashboardLayout title="Certificados e Documentos"><div className="mx-auto max-w-6xl"><section className="rounded-[2rem] border border-[#dcebe8] bg-white p-7 shadow-sm lg:p-9"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#0c8c89]">Conformidade e evidências</p><h2 className="mt-3 text-3xl font-bold tracking-tight">Centralize PGR, LTCAT, Ordens de Serviço e certificados.</h2><p className="mt-4 text-sm leading-6 text-[#668087]">Organize os documentos legais e de capacitação da empresa por categoria, controlando validade e links de referência em um único local.</p></div><div className="rounded-2xl bg-[#063b43] p-5 text-white"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#8edec7]">Ambiente ativo</p><p className="mt-2 text-lg font-bold">{activeWorkspace.name}</p><p className="mt-1 text-xs text-[#c5e2dc]">TST {activeWorkspace.kind === "autonomo" ? "Autônomo" : "CLT"}</p></div></div><div className="mt-6 flex flex-col justify-between gap-4 border-t border-[#e7f1ef] pt-5 md:flex-row md:items-center"><div className="flex flex-wrap gap-2">{workspaces.data?.map(workspace => <button type="button" key={workspace.id} onClick={() => setLocation(`/app/certificados?workspace=${workspace.id}`)} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${workspace.id === activeWorkspace.id ? "border-[#0c7474] bg-[#e8f6f1] text-[#0c7474]" : "border-[#dcebe8] text-[#668087]"}`}>{workspace.name}</button>)}</div>{canManage && <Button onClick={() => setFormOpen(value => !value)} className="rounded-xl bg-[#0c7474] text-white"><Plus className="mr-2 h-4 w-4" />Novo documento legal</Button>}</div>{formOpen && <form onSubmit={event => { event.preventDefault(); if (!issuedAt) return toast.error("Informe a data de emissão."); createCertificate.mutate({ workspaceId: activeWorkspace.id, category, participantName, trainingName, issuedAt: new Date(`${issuedAt}T12:00:00`), expiresAt: expiresAt ? new Date(`${expiresAt}T12:00:00`) : null, referenceUrl: referenceUrl.trim() || null, notes: notes.trim() || null }); }} className="mt-6 grid gap-4 rounded-2xl border border-[#b9e3d7] bg-[#f7fcfa] p-5 md:grid-cols-2"><label className="text-sm font-semibold md:col-span-2">Tipo de documento<select value={category} onChange={event => setCategory(event.target.value as keyof typeof categoryLabels)} className="mt-2 h-10 w-full rounded-xl border border-[#cfe3de] bg-white px-3 text-sm">{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-sm font-semibold">Emitente / Responsável<Input required value={participantName} onChange={event => setParticipantName(event.target.value)} className="mt-2 h-10 rounded-xl bg-white" placeholder="Nome do profissional ou empresa" /></label><label className="text-sm font-semibold">Título do Documento / Treinamento<Input required value={trainingName} onChange={event => setTrainingName(event.target.value)} className="mt-2 h-10 rounded-xl bg-white" placeholder="Ex.: PGR Unidade Fabril ou NR-35" /></label><label className="text-sm font-semibold">Data de Emissão<Input required type="date" value={issuedAt} onChange={event => setIssuedAt(event.target.value)} className="mt-2 h-10 rounded-xl bg-white" /></label><label className="text-sm font-semibold">Validade / Próxima Revisão (opcional)<Input type="date" value={expiresAt} onChange={event => setExpiresAt(event.target.value)} className="mt-2 h-10 rounded-xl bg-white" /></label><label className="text-sm font-semibold md:col-span-2">Link de Referência / Evidência (opcional)<Input value={referenceUrl} onChange={event => setReferenceUrl(event.target.value)} className="mt-2 h-10 rounded-xl bg-white" placeholder="https://..." /></label><label className="text-sm font-semibold md:col-span-2">Observações / Escopo (opcional)<Input value={notes} onChange={event => setNotes(event.target.value)} className="mt-2 h-10 rounded-xl bg-white" placeholder="Detalhes ou setores abrangidos" /></label><div className="md:col-span-2 flex justify-end gap-3"><Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>Cancelar</Button><Button disabled={createCertificate.isPending || !participantName.trim() || !trainingName.trim()} className="rounded-xl bg-[#0c7474] text-white">{createCertificate.isPending ? "Salvando" : "Salvar documento"}</Button></div></form>}</section><section className="mt-8"><div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Acervo legal</p><h3 className="mt-1 text-2xl font-bold">Documentos e certificados</h3></div><span className="rounded-full bg-[#e8f6f1] px-3 py-1 text-xs font-bold text-[#0c7474]">{certificates.data?.length ?? 0} registros</span></div>{certificates.isLoading ? <Loader2 className="mx-auto mt-8 animate-spin text-[#0c7474]" /> : certificates.data?.length ? <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{certificates.data.map(certificate => { const validity = getValidity(certificate.expiresAt); const Icon = validity.icon; return <article key={certificate.id} className="rounded-2xl border border-[#dcebe8] bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8f6f1] text-[#0c7474]"><FileText className="h-5 w-5" /></span><div className="flex flex-col items-end gap-1"><span className="rounded-full bg-[#f0f7f6] px-2 py-0.5 text-[10px] font-bold text-[#0c7474]">{categoryLabels[certificate.category ?? "certificate"]}</span><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${validity.className}`}><Icon className="h-3.5 w-3.5" />{validity.label}</span></div></div><h4 className="mt-5 text-lg font-bold">{certificate.trainingName}</h4><p className="mt-1 text-sm text-[#49636a]">{certificate.participantName}</p>{certificate.notes && <p className="mt-2 text-xs text-[#668087]">{certificate.notes}</p>}<div className="mt-5 flex flex-col gap-2 border-t border-[#eef4f2] pt-4 text-xs text-[#6f858a]"><div className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-[#0c8c89]" />Emitido em {formatDate(certificate.issuedAt)}{certificate.expiresAt ? ` · revisão em ${formatDate(certificate.expiresAt)}` : ""}</div>{certificate.referenceUrl && <a href={certificate.referenceUrl} target="_blank" rel="noreferrer" className="font-semibold text-[#0c7474] hover:underline">Abrir evidência / link externo</a>}</div></article>; })}</div> : <div className="mt-5 rounded-3xl border border-dashed border-[#bddbd5] bg-white p-10 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f6f1] text-[#0c7474]"><BadgeCheck className="h-6 w-6" /></span><h3 className="mt-4 text-xl font-bold">Nenhum documento legal ou certificado neste ambiente.</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#668087]">Use o cadastro para centralizar PGR, LTCAT, Ordens de Serviço e certificados em um único local.</p></div>}</section></div></DashboardLayout>;
}

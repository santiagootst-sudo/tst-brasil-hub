import { CalendarDays, CalendarPlus, ClipboardPlus, FileDown, GraduationCap, Loader2, MapPin, Plus, UserRound, UsersRound, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { ModuleHeader, ModulePage } from "@/components/ModulePageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { downloadTrainingAttendancePdf } from "@/lib/pdfReports";
import { toast } from "sonner";
import { workspaceIdFromSearch } from "@shared/workspaceContext";

function formatDate(value: Date | string | null | undefined) {
  return value ? new Date(value).toLocaleDateString("pt-BR") : "Data não definida";
}

function formatDates(values: Array<Date | string>) {
  return values.length ? values.map(formatDate).join(" · ") : "Datas não informadas";
}

export default function Trainings() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [, setLocation] = useLocation();
  const search = useSearch();
  const utils = trpc.useUtils();
  const workspaces = trpc.portal.workspaces.useQuery(undefined, { enabled: Boolean(user) });
  const requestedWorkspaceId = workspaceIdFromSearch(search);
  const activeWorkspace = requestedWorkspaceId ? workspaces.data?.find(workspace => workspace.id === requestedWorkspaceId) ?? workspaces.data?.[0] ?? null : workspaces.data?.[0] ?? null;
  const workspaceId = activeWorkspace?.id ?? 0;
  const trainings = trpc.portal.trainings.useQuery({ workspaceId }, { enabled: Boolean(activeWorkspace) });
  const organization = trpc.portal.organization.useQuery({ workspaceId }, { enabled: Boolean(activeWorkspace) });
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [instructorName, setInstructorName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [scheduledDates, setScheduledDates] = useState<string[]>([""]);
  const [participantCount, setParticipantCount] = useState("0");
  const [participantIds, setParticipantIds] = useState<number[]>([]);
  const canManage = activeWorkspace?.role === "owner" || activeWorkspace?.role === "manager";
  const activeEmployees = (organization.data?.employees ?? []).filter(employee => employee.status === "active");
  const selectedParticipantCount = participantIds.length || Number(participantCount) || 0;

  const resetForm = () => {
    setTitle("");
    setInstructorName("");
    setLocationName("");
    setScheduledDates([""]);
    setParticipantCount("0");
    setParticipantIds([]);
    setFormOpen(false);
  };
  const createTraining = trpc.portal.createTraining.useMutation({
    onSuccess: () => {
      resetForm();
      if (activeWorkspace) utils.portal.trainings.invalidate({ workspaceId: activeWorkspace.id });
      toast.success("Treinamento planejado com agenda e participantes registrados.");
    },
    onError: error => toast.error(error.message),
  });
  const toggleParticipant = (employeeId: number) => setParticipantIds(current => current.includes(employeeId) ? current.filter(id => id !== employeeId) : [...current, employeeId]);

  if (loading || workspaces.isLoading) return <div className="grid min-h-screen place-items-center"><Loader2 className="animate-spin text-[#0c7474]" /></div>;
  if (!activeWorkspace) return <DashboardLayout title="Treinamentos"><div className="rounded-3xl border border-dashed border-[#bddbd5] bg-white p-10 text-center"><GraduationCap className="mx-auto h-9 w-9 text-[#0c7474]" /><h2 className="mt-4 text-2xl font-bold">Crie um ambiente antes de planejar treinamentos.</h2><p className="mt-2 text-sm text-[#668087]">A programação precisa estar vinculada ao contexto Prestador ou Empresa correto.</p><Link href="/app" className="mt-6 inline-flex rounded-xl bg-[#0c7474] px-5 py-3 text-sm font-bold text-white">Criar ambiente</Link></div></DashboardLayout>;

  return <DashboardLayout title="Treinamentos"><ModulePage className="pb-10">
    <ModuleHeader eyebrow="Gestão de capacitação" title="Treinamentos" description="Registre instrutor, local, datas e participantes. A lista de presença técnica organiza CPF, função e assinatura." icon={GraduationCap} actions={<div className="flex flex-wrap items-center gap-2"><div className="flex max-w-full flex-wrap gap-1 rounded-lg border border-[#e1e7e8] bg-white p-1">{workspaces.data?.map(workspace => <button type="button" key={workspace.id} onClick={() => setLocation(`/app/treinamentos?workspace=${workspace.id}`)} className={`rounded-md px-2.5 py-2 text-xs font-bold ${workspace.id === activeWorkspace.id ? "bg-[#e7f7f4] text-[#087f78]" : "text-[#647a80] hover:bg-[#f3f7f6]"}`}>{workspace.name}</button>)}</div>{canManage && <Button onClick={() => setFormOpen(value => !value)} className="h-10 rounded-lg bg-[#087f78] text-white hover:bg-[#06635f]"><Plus className="mr-2 h-4 w-4" />Planejar treinamento</Button>}</div>} />

    {formOpen && <form onSubmit={event => { event.preventDefault(); const dates = scheduledDates.filter(Boolean).map(value => new Date(`${value}T12:00:00`)); createTraining.mutate({ workspaceId: activeWorkspace.id, title, instructorName: instructorName.trim() || null, location: locationName.trim() || null, scheduledAt: dates[0] ?? null, scheduledDates: dates, participantIds, participantCount: selectedParticipantCount }); }} className="mt-6 rounded-3xl border border-[#b9e3d7] bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-[#e3efec] pb-5 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Novo registro</p><h3 className="mt-1 text-xl font-bold text-[#102b32]">Informações do treinamento</h3></div><span className="rounded-full bg-[#e8f6f1] px-3 py-1.5 text-xs font-bold text-[#0c7474]">{selectedParticipantCount} participante(s) na ata</span></div>
      <div className="mt-6 grid gap-4 md:grid-cols-2"><label className="text-sm font-semibold text-[#29484d] md:col-span-2">Nome do treinamento<Input required value={title} onChange={event => setTitle(event.target.value)} placeholder="Nome do curso ou capacitação" className="mt-2 h-10 rounded-xl" /></label><label className="text-sm font-semibold text-[#29484d]">Quem ministrará o treinamento<Input value={instructorName} onChange={event => setInstructorName(event.target.value)} placeholder="Instrutor(a) ou responsável" className="mt-2 h-10 rounded-xl" /></label><label className="text-sm font-semibold text-[#29484d]">Onde será realizado<Input value={locationName} onChange={event => setLocationName(event.target.value)} placeholder="Unidade, sala, área ou plataforma" className="mt-2 h-10 rounded-xl" /></label></div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-2xl border border-[#dcebe8] bg-[#fbfefd] p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-bold text-[#102b32]">Datas do treinamento</p><p className="mt-1 text-xs text-[#6f858a]">Adicione quantos dias forem necessários.</p></div><Button type="button" variant="outline" size="sm" onClick={() => setScheduledDates(current => [...current, ""])} className="h-8 rounded-lg border-[#b9e3d7] text-[#0c7474]"><CalendarPlus className="mr-1 h-3.5 w-3.5" />Data</Button></div><div className="mt-4 space-y-2">{scheduledDates.map((date, index) => <div className="flex gap-2" key={`${index}-${date}`}><Input type="date" value={date} onChange={event => setScheduledDates(current => current.map((value, position) => position === index ? event.target.value : value))} className="h-9 rounded-lg" /><Button type="button" variant="ghost" size="icon" disabled={scheduledDates.length === 1} onClick={() => setScheduledDates(current => current.filter((_, position) => position !== index))} className="h-9 w-9 text-[#8b5d5d]"><X className="h-4 w-4" /></Button></div>)}</div><label className="mt-4 block text-sm font-semibold text-[#29484d]">Participantes previstos quando não selecionar nomes<Input min="0" type="number" value={participantCount} onChange={event => setParticipantCount(event.target.value)} disabled={participantIds.length > 0} className="mt-2 h-9 rounded-lg disabled:bg-[#f1f5f4]" /></label></div>
        <div className="rounded-2xl border border-[#dcebe8] bg-white p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-bold text-[#102b32]">Funcionários participantes <span className="font-normal text-[#6f858a]">(opcional)</span></p><p className="mt-1 text-xs text-[#6f858a]">A seleção preenche os nomes da ata automaticamente.</p></div><UsersRound className="h-5 w-5 text-[#0c8c89]" /></div>{organization.isLoading ? <Loader2 className="mx-auto my-8 h-5 w-5 animate-spin text-[#0c7474]" /> : activeEmployees.length ? <div className="mt-4 max-h-48 space-y-2 overflow-y-auto pr-1">{activeEmployees.map(employee => <label key={employee.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#edf3f1] px-3 py-2 text-sm hover:bg-[#f6fbf9]"><input type="checkbox" checked={participantIds.includes(employee.id)} onChange={() => toggleParticipant(employee.id)} className="h-4 w-4 rounded border-[#98c9bd] text-[#0c7474]" /><span className="min-w-0 flex-1 truncate font-medium text-[#29484d]">{employee.fullName}</span><span className="text-[10px] font-bold uppercase text-[#7a9697]">Ativo</span></label>)}</div> : <p className="mt-4 rounded-xl bg-[#f7fbfa] p-4 text-xs leading-5 text-[#6f858a]">Nenhum funcionário ativo foi encontrado neste ambiente. Você ainda pode registrar a quantidade prevista e imprimir linhas em branco para assinatura.</p>}</div>
      </div>
      <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#e3efec] pt-5"><Button type="button" variant="ghost" onClick={resetForm}>Cancelar</Button><Button disabled={createTraining.isPending || !title.trim()} className="rounded-xl bg-[#0c7474] text-white hover:bg-[#095f60]">{createTraining.isPending ? "Salvando" : "Salvar treinamento"}</Button></div>
    </form>}

    <section className="mt-8"><div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Programação real</p><h3 className="mt-1 text-2xl font-bold">Treinamentos do ambiente</h3></div><span className="rounded-full bg-[#e8f6f1] px-3 py-1 text-xs font-bold text-[#0c7474]">{trainings.data?.length ?? 0} registros</span></div>
      {trainings.isLoading ? <Loader2 className="mx-auto mt-8 animate-spin text-[#0c7474]" /> : trainings.data?.length ? <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{trainings.data.map(training => <article key={training.id} className="flex flex-col rounded-2xl border border-[#dcebe8] bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8f6f1] text-[#0c7474]"><GraduationCap className="h-5 w-5" /></span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${training.status === "completed" ? "bg-[#e8f6f1] text-[#0c7474]" : "bg-[#f0f7ff] text-[#2165a9]"}`}>{training.status === "completed" ? "Concluído" : "Planejado"}</span></div><h4 className="mt-5 text-lg font-bold text-[#102b32]">{training.title}</h4><div className="mt-5 space-y-2 border-t border-[#eef4f2] pt-4 text-xs text-[#6f858a]"><p className="flex items-start gap-2"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#0c8c89]" /><span>{formatDates(training.scheduledDates)}</span></p><p className="flex items-center gap-2"><UserRound className="h-4 w-4 text-[#0c8c89]" />{training.instructorName || "Instrutor não informado"}</p><p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#0c8c89]" />{training.location || "Local não informado"}</p><p className="flex items-center gap-2"><UsersRound className="h-4 w-4 text-[#0c8c89]" />{training.participantCount} participante(s){training.participants.length ? ` · ${training.participants.slice(0, 2).map(participant => participant.fullName).join(", ")}${training.participants.length > 2 ? "…" : ""}` : ""}</p></div>{canManage && <Button type="button" variant="outline" onClick={() => downloadTrainingAttendancePdf({ workspaceName: activeWorkspace.name, companyName: activeWorkspace.name, title: training.title, instructorName: training.instructorName, location: training.location, scheduledDates: training.scheduledDates, participantCount: training.participantCount, participants: training.participants, generatedAt: new Date() })} className="mt-5 h-9 w-full rounded-xl border-[#b9e3d7] text-[#0c7474] hover:bg-[#eef9f5]"><FileDown className="mr-2 h-4 w-4" />Gerar lista de presença</Button>}</article>)}</div> : <div className="mt-5 rounded-3xl border border-dashed border-[#bddbd5] bg-white p-10 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f6f1] text-[#0c7474]"><ClipboardPlus className="h-6 w-6" /></span><h3 className="mt-4 text-xl font-bold">Nenhum treinamento planejado.</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#668087]">Registre a primeira capacitação para organizar datas, participantes e a documentação de presença.</p></div>}
    </section>
  </ModulePage></DashboardLayout>;
}

import { CalendarDays, CheckCircle2, ClipboardPlus, GraduationCap, Loader2, Plus, UsersRound } from "lucide-react";
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
  return value ? new Date(value).toLocaleDateString("pt-BR") : "Data não definida";
}

export default function Trainings() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [, setLocation] = useLocation();
  const search = useSearch();
  const utils = trpc.useUtils();
  const workspaces = trpc.portal.workspaces.useQuery(undefined, { enabled: Boolean(user) });
  const requestedWorkspaceId = workspaceIdFromSearch(search);
  const activeWorkspace = requestedWorkspaceId ? workspaces.data?.find(workspace => workspace.id === requestedWorkspaceId) ?? null : workspaces.data?.[0] ?? null;
  const trainings = trpc.portal.trainings.useQuery({ workspaceId: activeWorkspace?.id ?? 0 }, { enabled: Boolean(activeWorkspace) });
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [participantCount, setParticipantCount] = useState("0");
  const canManage = activeWorkspace?.role === "owner" || activeWorkspace?.role === "manager";
  const createTraining = trpc.portal.createTraining.useMutation({
    onSuccess: () => {
      setTitle(""); setScheduledAt(""); setParticipantCount("0"); setFormOpen(false);
      if (activeWorkspace) utils.portal.trainings.invalidate({ workspaceId: activeWorkspace.id });
      toast.success("Treinamento planejado neste ambiente.");
    },
    onError: error => toast.error(error.message),
  });

  if (loading || workspaces.isLoading) return <div className="grid min-h-screen place-items-center"><Loader2 className="animate-spin text-[#0c7474]" /></div>;
  if (!activeWorkspace) return <DashboardLayout title="Treinamentos"><div className="rounded-3xl border border-dashed border-[#bddbd5] bg-white p-10 text-center"><GraduationCap className="mx-auto h-9 w-9 text-[#0c7474]" /><h2 className="mt-4 text-2xl font-bold">Crie um ambiente antes de planejar treinamentos.</h2><p className="mt-2 text-sm text-[#668087]">A programação precisa estar vinculada ao contexto Autônomo ou CLT correto.</p><Link href="/app" className="mt-6 inline-flex rounded-xl bg-[#0c7474] px-5 py-3 text-sm font-bold text-white">Criar ambiente</Link></div></DashboardLayout>;

  return <DashboardLayout title="Treinamentos"><div className="mx-auto max-w-6xl"><section className="overflow-hidden rounded-[2rem] bg-[#063b43] p-7 text-white shadow-lg lg:p-9"><div className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#8edec7]">Gestão de capacitação</p><h2 className="mt-3 text-3xl font-bold tracking-tight">Planeje treinamentos e acompanhe a execução por ambiente.</h2><p className="mt-4 max-w-2xl text-sm leading-6 text-[#c5e2dc]">Registre cursos reais, datas e volume de participantes. A vinculação com certificados pode ser ampliada à medida que a operação crescer.</p></div><div className="rounded-3xl bg-white/8 p-5"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#8edec7]">Ambiente ativo</p><p className="mt-2 text-xl font-bold">{activeWorkspace.name}</p><p className="mt-1 text-xs text-[#c5e2dc]">TST {activeWorkspace.kind === "autonomo" ? "Autônomo" : "CLT"}</p></div></div><div className="mt-7 flex flex-col justify-between gap-4 border-t border-white/10 pt-5 md:flex-row md:items-center"><div className="flex flex-wrap gap-2">{workspaces.data?.map(workspace => <button type="button" key={workspace.id} onClick={() => setLocation(`/app/treinamentos?workspace=${workspace.id}`)} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${workspace.id === activeWorkspace.id ? "border-[#8edec7] bg-[#8edec7]/15 text-white" : "border-white/15 text-[#c5e2dc]"}`}>{workspace.name}</button>)}</div>{canManage && <Button onClick={() => setFormOpen(value => !value)} className="rounded-xl bg-[#8edec7] text-[#063b43] hover:bg-[#b0ebd8]"><Plus className="mr-2 h-4 w-4" />Planejar treinamento</Button>}</div></section>{formOpen && <form onSubmit={event => { event.preventDefault(); createTraining.mutate({ workspaceId: activeWorkspace.id, title, scheduledAt: scheduledAt ? new Date(`${scheduledAt}T12:00:00`) : null, participantCount: Number(participantCount) || 0 }); }} className="mt-6 grid gap-4 rounded-3xl border border-[#b9e3d7] bg-white p-6 shadow-sm md:grid-cols-3"><label className="text-sm font-semibold md:col-span-2">Treinamento<Input required value={title} onChange={event => setTitle(event.target.value)} placeholder="Ex.: NR-35 — Trabalho em altura" className="mt-2 h-10 rounded-xl" /></label><label className="text-sm font-semibold">Participantes previstos<Input required min="0" type="number" value={participantCount} onChange={event => setParticipantCount(event.target.value)} className="mt-2 h-10 rounded-xl" /></label><label className="text-sm font-semibold">Data programada<Input type="date" value={scheduledAt} onChange={event => setScheduledAt(event.target.value)} className="mt-2 h-10 rounded-xl" /></label><div className="flex items-end justify-end gap-3 md:col-span-2"><Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>Cancelar</Button><Button disabled={createTraining.isPending || !title.trim()} className="rounded-xl bg-[#0c7474] text-white">{createTraining.isPending ? "Salvando" : "Salvar planejamento"}</Button></div></form>}<section className="mt-8"><div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Programação real</p><h3 className="mt-1 text-2xl font-bold">Treinamentos do ambiente</h3></div><span className="rounded-full bg-[#e8f6f1] px-3 py-1 text-xs font-bold text-[#0c7474]">{trainings.data?.length ?? 0} registros</span></div>{trainings.isLoading ? <Loader2 className="mx-auto mt-8 animate-spin text-[#0c7474]" /> : trainings.data?.length ? <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{trainings.data.map(training => <article key={training.id} className="rounded-2xl border border-[#dcebe8] bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8f6f1] text-[#0c7474]"><GraduationCap className="h-5 w-5" /></span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${training.status === "completed" ? "bg-[#e8f6f1] text-[#0c7474]" : "bg-[#f0f7ff] text-[#2165a9]"}`}>{training.status === "completed" ? "Concluído" : "Planejado"}</span></div><h4 className="mt-5 text-lg font-bold">{training.title}</h4><div className="mt-5 space-y-2 border-t border-[#eef4f2] pt-4 text-xs text-[#6f858a]"><p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#0c8c89]" />{formatDate(training.scheduledAt)}</p><p className="flex items-center gap-2"><UsersRound className="h-4 w-4 text-[#0c8c89]" />{training.participantCount} participantes previstos</p></div></article>)}</div> : <div className="mt-5 rounded-3xl border border-dashed border-[#bddbd5] bg-white p-10 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f6f1] text-[#0c7474]"><ClipboardPlus className="h-6 w-6" /></span><h3 className="mt-4 text-xl font-bold">Nenhum treinamento planejado.</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#668087]">Adicione a primeira capacitação real para organizar o cronograma da empresa ou dos seus clientes.</p></div>}</section></div></DashboardLayout>;
}

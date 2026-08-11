import { ArrowRight, Award, BookOpen, BriefcaseBusiness, Building2, CircleHelp, FileBadge2, FolderKanban, GraduationCap, Headphones, Loader2, Plus, ShieldCheck, UserRoundCheck } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

type WorkspaceKind = "autonomo" | "clt";
const shared = [
  { icon: ShieldCheck, title: "Gerador de PGR", text: "Projetos, riscos e documentos", action: "pgr" },
  { icon: BookOpen, title: "Biblioteca", text: "Normas e fontes técnicas", action: "biblioteca" },
  { icon: FolderKanban, title: "Materiais", text: "Modelos e checklists SST", action: "materiais" },
  { icon: Headphones, title: "Suporte", text: "Ajuda para a sua operação", action: "suporte" },
  { icon: GraduationCap, title: "Treinamentos", text: "Planejamento por ambiente", action: "treinamentos" },
  { icon: Award, title: "Certificados", text: "Validade e evidências", action: "certificados" },
];

export default function WorkspaceHub() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const utils = trpc.useUtils();
  const { data: workspaces, isLoading } = trpc.portal.workspaces.useQuery(undefined, { enabled: Boolean(user) });
  const billing = trpc.billing.status.useQuery(undefined, { enabled: Boolean(user) });
  const [form, setForm] = useState<{ kind: WorkspaceKind; name: string } | null>(null);
  const createWorkspace = trpc.portal.createWorkspace.useMutation({
    onSuccess: workspace => { utils.portal.workspaces.invalidate(); setForm(null); setLocation(`/app/visao?workspace=${workspace.id}`); toast.success("Ambiente criado. Agora você já pode organizar a sua operação."); },
    onError: error => toast.error(error.message),
  });
  const manageSubscription = trpc.billing.manage.useMutation({
    onSuccess: ({ url }) => window.open(url, "_blank", "noopener"),
    onError: error => toast.error(error.message),
  });
  if (loading || isLoading) return <div className="grid min-h-screen place-items-center"><Loader2 className="animate-spin text-[#0c7474]" /></div>;
  const grouped = { autonomo: workspaces?.filter(w => w.kind === "autonomo") ?? [], clt: workspaces?.filter(w => w.kind === "clt") ?? [] };
  const open = (id: number) => setLocation(`/app/visao?workspace=${id}`);
  const openTool = (action: string) => {
    if (action === "pgr") {
      const firstWorkspace = workspaces?.[0];
      if (!firstWorkspace) return toast.message("Crie ou escolha um ambiente antes de abrir o Gerador de PGR.");
      return setLocation(`/app/pgr?workspace=${firstWorkspace.id}`);
    }
    if (action === "biblioteca") return setLocation("/app/biblioteca");
    if (action === "treinamentos") return setLocation("/app/treinamentos");
    if (action === "certificados") return setLocation("/app/certificados");
    if (action === "materiais") return setLocation("/app/materiais");
    return setLocation("/app/suporte");
  };

  const billingSuccess = new URLSearchParams(window.location.search).get("billing") === "success";
  return <DashboardLayout title="Início"><div className="mx-auto max-w-6xl">{billingSuccess && <div className="mb-5 rounded-2xl border border-[#b9e3d7] bg-[#f1fcf7] px-5 py-4 text-sm text-[#17664f]">Recebemos a confirmação do checkout. A assinatura será liberada assim que o pagamento for processado.</div>}<div className="flex flex-col justify-between gap-4 md:flex-row md:items-start"><div><h2 className="text-2xl font-bold">Olá, {user?.name?.split(" ")[0] || "profissional"}.</h2><p className="mt-1 text-sm text-[#668087]">Acesse seus ambientes de trabalho ou use as ferramentas compartilhadas do Portal TST.</p></div>{billing.data?.subscription && <Button onClick={() => manageSubscription.mutate()} variant="outline" className="rounded-xl border-[#bddbd5] text-[#0c7474]">Gerenciar assinatura</Button>}</div><div className="mt-9 flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f6f1] text-[#0c7474]"><Building2 className="h-6 w-6" /></span><div><h3 className="text-2xl font-bold">Escolha seu ambiente de trabalho</h3><p className="text-sm text-[#698187]">Os contextos são separados. As ferramentas do Portal TST estão disponíveis em ambos.</p></div></div><section className="mt-7 grid gap-6 lg:grid-cols-2">{(["autonomo", "clt"] as WorkspaceKind[]).map(kind => { const autonomous = kind === "autonomo"; const entries = grouped[kind]; const Icon = autonomous ? BriefcaseBusiness : UserRoundCheck; return <article key={kind} className={`overflow-hidden rounded-[1.8rem] border bg-white shadow-sm ${autonomous ? "border-[#a6ddcf]" : "border-[#c5dff3]"}`}><div className={`flex min-h-56 items-start justify-between p-7 ${autonomous ? "bg-[#f4fcf8]" : "bg-[#f4f9ff]"}`}><div><span className={`rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em] ${autonomous ? "bg-[#d9f1e7] text-[#168c89]" : "bg-[#dbeeff] text-[#2165a9]"}`}>TST {autonomous ? "Autônomo" : "CLT"}</span><h4 className="mt-5 text-2xl font-bold">{autonomous ? "Atue como prestador de serviços" : "Atue como colaborador da empresa"}</h4><p className="mt-3 max-w-sm text-sm leading-6 text-[#5d7479]">{autonomous ? "Priorize clientes, empresas, entregas e rotinas de consultoria." : "Priorize pessoas, indicadores, conformidade e a rotina interna de SST."}</p></div><span className={`grid h-14 w-14 place-items-center rounded-2xl ${autonomous ? "bg-[#d9f1e7] text-[#0c8c89]" : "bg-[#dbeeff] text-[#2165a9]"}`}><Icon className="h-7 w-7" /></span></div><div className="min-h-48 p-6">{entries.length ? <div className="space-y-3">{entries.map(workspace => <button key={workspace.id} onClick={() => open(workspace.id)} className="flex w-full items-center justify-between rounded-xl border border-[#deece9] px-4 py-3 text-left transition hover:border-[#0c8c89] hover:bg-[#f7fbfa]"><span><strong className="block text-sm">{workspace.name}</strong><small className="text-xs text-[#6f858a]">Perfil {workspace.role === "owner" ? "proprietário" : workspace.role}</small></span><ArrowRight className="h-4 w-4 text-[#0c7474]" /></button>)}</div> : <div className="rounded-xl border border-dashed border-[#c7ddd8] bg-[#fbfefd] p-4 text-sm leading-6 text-[#5d7479]">Ainda não há um ambiente {autonomous ? "Autônomo" : "CLT"}. Crie o primeiro para começar.</div>}<Button onClick={() => setForm({ kind, name: autonomous ? "Meu ambiente Autônomo" : "Minha empresa" })} variant="outline" className={`mt-5 w-full rounded-xl ${autonomous ? "border-[#0c7474] text-[#0c7474]" : "border-[#2165a9] text-[#2165a9]"}`}><Plus className="mr-2 h-4 w-4" />Criar ambiente</Button></div></article>})}</section><div className="mt-6 rounded-2xl border border-[#dcebe8] bg-[#f8fcfb] px-5 py-4 text-sm text-[#668087]">Os seus dados permanecem organizados por ambiente. O layout muda conforme a rotina Autônoma ou CLT, mas PGR, Biblioteca, Materiais, Suporte, Treinamentos e Certificados pertencem ao mesmo ecossistema.</div><section className="mt-10"><h3 className="text-xl font-bold">Ferramentas compartilhadas</h3><p className="mt-1 text-sm text-[#6f858a]">Recursos acessíveis em todos os ambientes do Portal TST.</p><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{shared.map(({ icon: Icon, title, text, action }) => <button type="button" onClick={() => openTool(action)} key={title} className="flex items-center gap-4 rounded-2xl border border-[#deece9] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#a9d4c8] hover:shadow-sm"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e8f6f1] text-[#0c7474]"><Icon className="h-5 w-5" /></span><span><strong className="block">{title}</strong><small className="block text-xs text-[#6f858a]">{text}</small></span><ArrowRight className="ml-auto h-4 w-4 text-[#83a39e]" /></button>)}</div></section></div>{form && <div className="fixed inset-0 z-50 grid place-items-center bg-[#062f35]/45 p-5"><form onSubmit={event => { event.preventDefault(); createWorkspace.mutate(form); }} className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8f6f1] text-[#0c7474]"><ShieldCheck className="h-5 w-5" /></span><div><h3 className="text-xl font-bold">Criar ambiente TST {form.kind === "autonomo" ? "Autônomo" : "CLT"}</h3><p className="text-xs text-[#6f858a]">Este contexto manterá empresas, pessoas e dados de operação separados.</p></div></div><label className="mt-6 block text-sm font-semibold">Nome do ambiente<Input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className="mt-2 h-11 rounded-xl" autoFocus /></label><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="ghost" onClick={() => setForm(null)}>Cancelar</Button><Button disabled={createWorkspace.isPending} className="rounded-xl bg-[#0c7474] text-white">{createWorkspace.isPending ? "Criando" : "Criar ambiente"}</Button></div></form></div>}</DashboardLayout>;
}

import {
  ArrowRight,
  Award,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  FolderKanban,
  GraduationCap,
  Headphones,
  Loader2,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

type WorkspaceKind = "autonomo" | "clt";

const sharedTools = [
  { icon: ShieldCheck, title: "Gerador de PGR", text: "Projetos, riscos e documentos", route: "/app/pgr" },
  { icon: ShieldCheck, title: "Riscos Psicossociais (COPSOQ)", text: "Avaliação de estressores NR-1", route: "/app/copsoq" },
  { icon: BookOpen, title: "Biblioteca", text: "Normas e fontes técnicas", route: "/app/biblioteca" },
  { icon: FolderKanban, title: "Materiais", text: "Modelos e checklists SST", route: "/app/materiais" },
  { icon: Headphones, title: "Suporte", text: "Ajuda para a sua operação", route: "/app/suporte" },
  { icon: GraduationCap, title: "Treinamentos", text: "Planejamento por ambiente", route: "/app/treinamentos" },
  { icon: Award, title: "Certificados", text: "Validade e evidências", route: "/app/certificados" },
];

export default function WorkspaceHub() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const utils = trpc.useUtils();
  const { data: workspaces, isLoading } = trpc.portal.workspaces.useQuery(undefined, { enabled: Boolean(user) });
  const billing = trpc.billing.status.useQuery(undefined, { enabled: Boolean(user) });
  const [form, setForm] = useState<{ kind: WorkspaceKind; name: string } | null>(null);

  const createWorkspace = trpc.portal.createWorkspace.useMutation({
    onSuccess: workspace => {
      utils.portal.workspaces.invalidate();
      setForm(null);
      setLocation(`/app/visao?workspace=${workspace.id}`);
      toast.success("Contexto criado. O painel correspondente já está pronto para validação.");
    },
    onError: error => toast.error(error.message),
  });
  const manageSubscription = trpc.billing.manage.useMutation({
    onSuccess: ({ url }) => window.open(url, "_blank", "noopener"),
    onError: error => toast.error(error.message),
  });

  if (loading || isLoading) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="animate-spin text-[#0c7474]" /></div>;
  }

  const billingSuccess = new URLSearchParams(window.location.search).get("billing") === "success";
  const hasBothContexts = (workspaces?.length ?? 0) === 2;
  const openWorkspace = (workspaceId: number) => setLocation(`/app/visao?workspace=${workspaceId}`);
  const openTool = (route: string) => {
    const firstWorkspace = workspaces?.[0];
    if (!firstWorkspace) {
      toast.message("Crie um ambiente Autônomo ou CLT para abrir as ferramentas.");
      return;
    }
    setLocation(`${route}?workspace=${firstWorkspace.id}`);
  };

  return (
    <DashboardLayout title="Ambientes de desenvolvimento">
      <div className="mx-auto max-w-6xl">
        {billingSuccess && <div className="mb-5 rounded-2xl border border-[#b9e3d7] bg-[#f1fcf7] px-5 py-4 text-sm text-[#17664f]">Recebemos a confirmação do checkout. A assinatura será liberada assim que o pagamento for processado.</div>}

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h2 className="text-2xl font-bold">Olá, {user?.name?.split(" ")[0] || "profissional"}.</h2>
            <p className="mt-1 text-sm text-[#668087]">Durante a criação, alterne entre TST Autônomo e TST CLT para construir e validar as duas experiências.</p>
          </div>
          {billing.data?.subscription && <Button onClick={() => manageSubscription.mutate()} variant="outline" className="rounded-xl border-[#bddbd5] text-[#0c7474]">Gerenciar assinatura</Button>}
        </div>

        <section className="mt-9">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f6f1] text-[#0c7474]"><Building2 className="h-6 w-6" /></span>
            <div>
              <h3 className="text-2xl font-bold">{hasBothContexts ? "Ambientes de desenvolvimento" : "Adicione o segundo contexto de validação"}</h3>
              <p className="text-sm text-[#698187]">A conta pode manter no máximo um ambiente TST Autônomo e um TST CLT. Não é permitido duplicar nenhum dos dois tipos.</p>
            </div>
          </div>

          <div className="mt-7 grid gap-6 lg:grid-cols-2">
            {(["autonomo", "clt"] as WorkspaceKind[]).map(kind => {
              const autonomous = kind === "autonomo";
              const Icon = autonomous ? BriefcaseBusiness : UserRoundCheck;
              const contextLabel = autonomous ? "Autônomo" : "CLT";
              const workspace = workspaces?.find(item => item.kind === kind);

              return <article key={kind} className={`overflow-hidden rounded-[1.8rem] border bg-white shadow-sm ${autonomous ? "border-[#a6ddcf]" : "border-[#c5dff3]"}`}>
                <div className={`flex min-h-56 items-start justify-between p-7 ${autonomous ? "bg-[#f4fcf8]" : "bg-[#f4f9ff]"}`}>
                  <div>
                    <span className={`rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em] ${autonomous ? "bg-[#d9f1e7] text-[#168c89]" : "bg-[#dbeeff] text-[#2165a9]"}`}>TST {contextLabel}</span>
                    <h4 className="mt-5 text-2xl font-bold">{autonomous ? "Atue como prestador de serviços" : "Atue como colaborador da empresa"}</h4>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-[#5d7479]">{autonomous ? "Priorize clientes, empresas, entregas e rotinas de consultoria." : "Priorize pessoas, indicadores, conformidade e a rotina interna de SST."}</p>
                  </div>
                  <span className={`grid h-14 w-14 place-items-center rounded-2xl ${autonomous ? "bg-[#d9f1e7] text-[#0c8c89]" : "bg-[#dbeeff] text-[#2165a9]"}`}><Icon className="h-7 w-7" /></span>
                </div>
                <div className="min-h-48 p-6">
                  <div className="rounded-xl border border-dashed border-[#c7ddd8] bg-[#fbfefd] p-4 text-sm leading-6 text-[#5d7479]">
                    {workspace ? `Ambiente configurado: ${workspace.name}. Abra-o para validar este contexto.` : autonomous ? "Crie o contexto para construir a carteira de empresas e clientes." : "Crie o contexto para construir a rotina interna de SST."}
                  </div>
                  {workspace ? <Button type="button" onClick={() => openWorkspace(workspace.id)} variant="outline" className={`mt-5 w-full rounded-xl ${autonomous ? "border-[#0c7474] text-[#0c7474]" : "border-[#2165a9] text-[#2165a9]"}`}><ArrowRight className="mr-2 h-4 w-4" />Abrir TST {contextLabel}</Button> : <Button type="button" onClick={() => setForm({ kind, name: autonomous ? "Meu ambiente Autônomo" : "Minha empresa" })} variant="outline" className={`mt-5 w-full rounded-xl ${autonomous ? "border-[#0c7474] text-[#0c7474]" : "border-[#2165a9] text-[#2165a9]"}`}><ArrowRight className="mr-2 h-4 w-4" />Criar TST {contextLabel}</Button>}
                </div>
              </article>;
            })}
          </div>
        </section>

        <div className="mt-6 rounded-2xl border border-[#dcebe8] bg-[#f8fcfb] px-5 py-4 text-sm text-[#668087]">Esta é uma configuração temporária de criação. Empresas, clientes, equipes e documentos ficam isolados em seu respectivo contexto; PGR, Biblioteca, Materiais, Suporte, Treinamentos e Certificados pertencem ao mesmo ecossistema.</div>

        <section className="mt-10">
          <h3 className="text-xl font-bold">Ferramentas compartilhadas</h3>
          <p className="mt-1 text-sm text-[#6f858a]">Recursos disponíveis no contexto que você abrir.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sharedTools.map(({ icon: Icon, title, text, route }) => <button type="button" onClick={() => openTool(route)} key={title} className="flex w-full items-center gap-4 rounded-2xl border border-[#deece9] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#a9d4c8] hover:shadow-sm"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e8f6f1] text-[#0c7474]"><Icon className="h-5 w-5" /></span><span><strong className="block">{title}</strong><small className="block text-xs text-[#6f858a]">{text}</small></span><ArrowRight className="ml-auto h-4 w-4 text-[#83a39e]" /></button>)}
          </div>
        </section>
      </div>

      {form && <div className="fixed inset-0 z-50 grid place-items-center bg-[#062f35]/45 p-5"><form onSubmit={event => { event.preventDefault(); createWorkspace.mutate(form); }} className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8f6f1] text-[#0c7474]"><ShieldCheck className="h-5 w-5" /></span><div><h3 className="text-xl font-bold">Criar ambiente TST {form.kind === "autonomo" ? "Autônomo" : "CLT"}</h3><p className="text-xs text-[#6f858a]">Durante a criação, a conta pode manter um ambiente Autônomo e um CLT, sem duplicar nenhum dos dois tipos.</p></div></div><label className="mt-6 block text-sm font-semibold">Nome do ambiente<Input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className="mt-2 h-11 rounded-xl" autoFocus /></label><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="ghost" onClick={() => setForm(null)}>Cancelar</Button><Button disabled={createWorkspace.isPending || form.name.trim().length < 2} className="rounded-xl bg-[#0c7474] text-white">{createWorkspace.isPending ? "Criando" : "Criar e abrir painel"}</Button></div></form></div>}
    </DashboardLayout>
  );
}

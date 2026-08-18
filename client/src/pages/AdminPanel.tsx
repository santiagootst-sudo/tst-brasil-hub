import { useMemo, useState } from "react";
import { Copy, KeyRound, ShieldCheck, UserCheck, UserMinus, UserRound, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

const durationOptions = [30, 90, 365];

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Sem validade definida";
  return new Date(value).toLocaleDateString("pt-BR", { dateStyle: "medium" });
}

function isExpired(value: Date | string | null | undefined) {
  return Boolean(value && new Date(value).getTime() <= Date.now());
}

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();
  const usersQuery = trpc.admin.users.useQuery(undefined, { enabled: isAdmin });
  const auditsQuery = trpc.admin.audits.useQuery(undefined, { enabled: isAdmin });
  const requestsQuery = trpc.admin.accessRequests.useQuery(undefined, { enabled: isAdmin });
  const [search, setSearch] = useState("");
  const [durationDays, setDurationDays] = useState(30);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  const renew = trpc.admin.renew.useMutation({
    onSuccess: async () => {
      toast.success("Acesso renovado com sucesso.");
      await Promise.all([utils.admin.users.invalidate(), utils.admin.audits.invalidate()]);
    },
    onError: error => toast.error(error.message),
    onSettled: () => setBusyUserId(null),
  });
  const disable = trpc.admin.disable.useMutation({
    onSuccess: async () => {
      toast.success("Acesso desligado. O usuário não consegue abrir áreas protegidas.");
      await Promise.all([utils.admin.users.invalidate(), utils.admin.audits.invalidate()]);
    },
    onError: error => toast.error(error.message),
    onSettled: () => setBusyUserId(null),
  });
  const reactivate = trpc.admin.reactivate.useMutation({
    onSuccess: async () => {
      toast.success("Acesso reativado com validade definida.");
      await Promise.all([utils.admin.users.invalidate(), utils.admin.audits.invalidate()]);
    },
    onError: error => toast.error(error.message),
    onSettled: () => setBusyUserId(null),
  });
  const grantAccess = trpc.admin.grantAccess.useMutation({
    onSuccess: async data => {
      try { await navigator.clipboard.writeText(`E-mail: ${data.request.email}\nSenha: ${data.temporaryPassword}`); } catch { /* clipboard is optional */ }
      toast.success(`Credenciais geradas para ${data.request.email}. A senha foi copiada quando possível.`);
      await Promise.all([utils.admin.accessRequests.invalidate(), utils.admin.users.invalidate()]);
    },
    onError: error => toast.error(error.message),
  });

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return usersQuery.data ?? [];
    return (usersQuery.data ?? []).filter(item => [item.name, item.email, String(item.id)].some(value => value?.toLocaleLowerCase().includes(term)));
  }, [search, usersQuery.data]);

  const runAction = (action: "renew" | "disable" | "reactivate", targetUserId: number) => {
    setBusyUserId(targetUserId);
    if (action === "renew") renew.mutate({ targetUserId, durationDays });
    if (action === "disable") disable.mutate({ targetUserId });
    if (action === "reactivate") reactivate.mutate({ targetUserId, durationDays });
  };

  if (loading) {
    return <DashboardLayout title="Gestão de acessos"><div className="grid min-h-[50vh] place-items-center"><div className="flex items-center gap-3 text-sm font-semibold text-[#48656b]"><ShieldCheck className="h-5 w-5 animate-pulse text-[#0c8c89]" />Carregando autorização administrativa...</div></div></DashboardLayout>;
  }

  if (!isAdmin) {
    return <DashboardLayout title="Acesso restrito"><div className="mx-auto max-w-xl rounded-3xl border border-[#f0d9d1] bg-white p-8 text-center shadow-sm"><UserMinus className="mx-auto h-10 w-10 text-[#c2410c]" /><h2 className="mt-4 font-display text-2xl font-bold text-[#102b32]">Área exclusiva do proprietário</h2><p className="mt-2 text-sm leading-6 text-[#5d7479]">Este painel não está disponível para contas de usuário. Se você acredita que deveria ter permissão, confirme a conta usada no login.</p></div></DashboardLayout>;
  }

  const users = usersQuery.data ?? [];
  const activeCount = users.filter(item => item.accessStatus === "active" && !isExpired(item.accessExpiresAt)).length;
  const suspendedCount = users.filter(item => item.accessStatus === "suspended").length;
  const expiringCount = users.filter(item => item.accessStatus === "active" && item.accessExpiresAt && !isExpired(item.accessExpiresAt) && new Date(item.accessExpiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000).length;
  const subscriptionsList = users.map(u => ({ ...u, subscription: (u as any).subscription })).filter(u => u.subscription);

  return (
    <DashboardLayout title="Gestão de acessos">
      <div className="mx-auto max-w-7xl space-y-7">
        <section className="relative overflow-hidden rounded-[2rem] bg-[#073b43] px-6 py-8 text-white shadow-[0_24px_60px_rgba(7,59,67,.16)] lg:px-9">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#77cdb2]/20 blur-3xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#9be2cd]"><ShieldCheck className="h-4 w-4" />Administração do ecossistema</div><h2 className="mt-3 font-display text-3xl font-bold tracking-tight lg:text-4xl">Acessos sob controle, sem perder o contexto.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#c9e6df]">Gerencie manualmente a rodada de testes do Portal TST Brasil. As mudanças são registradas em auditoria e refletem imediatamente nas áreas protegidas.</p></div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-[#d9eeea]"><p className="font-semibold text-white">Administrador autenticado</p><p className="mt-1 text-xs">{user?.email || user?.name || "Proprietário do portal"}</p></div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard icon={<UsersRound className="h-5 w-5" />} label="Usuários cadastrados" value={users.length} detail="Contas reais encontradas" />
          <MetricCard icon={<UserCheck className="h-5 w-5" />} label="Acessos ativos" value={activeCount} detail={expiringCount ? `${expiringCount} vencem em até 7 dias` : "Sem vencimentos próximos"} />
          <MetricCard icon={<UserMinus className="h-5 w-5" />} label="Desligados" value={suspendedCount} detail="Bloqueados no middleware protegido" />
        </section>

        <Card className="rounded-[1.75rem] border-[#deece9] shadow-[0_14px_40px_rgba(16,43,50,.06)]"><CardHeader className="border-b border-[#edf3f1] px-5 py-5 lg:px-7"><CardTitle className="flex items-center gap-2 font-display text-xl text-[#102b32]"><KeyRound className="h-5 w-5 text-[#0c8c89]" />Solicitações de acesso</CardTitle><p className="mt-1 text-sm text-[#6b8185]">Aprove um pedido para gerar uma senha aleatória e liberar o login pelo prazo selecionado acima.</p></CardHeader><CardContent className="p-0">{requestsQuery.isLoading ? <div className="px-6 py-10 text-sm text-[#668087]">Carregando solicitações...</div> : !(requestsQuery.data?.length) ? <div className="px-6 py-10 text-center text-sm text-[#668087]">Ainda não há solicitações de acesso.</div> : <div className="divide-y divide-[#edf3f1]">{requestsQuery.data.map(request => <div key={request.id} className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-7"><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold text-[#102b32]">{request.fullName}</p><Badge className={request.status === "approved" ? "border-0 bg-[#e7f7ef] text-[#18734d]" : "border-0 bg-[#fff5df] text-[#996a12]"}>{request.status === "approved" ? "Liberado" : "Aguardando aprovação"}</Badge></div><p className="mt-1 text-xs text-[#668087]">{request.email}{request.phone ? ` · ${request.phone}` : ""}</p><p className="mt-1 text-xs text-[#5d7479]">{request.companyName || "Empresa não informada"}{request.jobTitle ? ` · ${request.jobTitle}` : ""}</p></div>{request.status === "requested" ? <Button size="sm" disabled={grantAccess.isPending} onClick={() => grantAccess.mutate({ requestId: request.id, durationDays })} className="rounded-xl bg-[#0c7474] text-white hover:bg-[#063b43]"><Copy className="mr-2 h-4 w-4" />Gerar acesso {durationDays}d</Button> : <span className="text-xs text-[#668087]">Validade: {formatDate(request.accessExpiresAt)}</span>}</div>)}</div>}</CardContent></Card>

        <Card className="rounded-[1.75rem] border-[#deece9] shadow-[0_14px_40px_rgba(16,43,50,.06)]">
          <CardHeader className="gap-4 border-b border-[#edf3f1] px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-7"><div><CardTitle className="font-display text-xl text-[#102b32]">Usuários e ambientes</CardTitle><p className="mt-1 text-sm text-[#6b8185]">Renove por período, desligue o acesso ou reative uma conta em teste.</p></div><div className="flex flex-col gap-2 sm:flex-row"><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar nome, e-mail ou ID" className="h-10 w-full rounded-xl border-[#dcebe8] bg-[#fbfefd] sm:w-64" /><div className="flex rounded-xl border border-[#dcebe8] bg-[#fbfefd] p-1">{durationOptions.map(option => <button key={option} type="button" onClick={() => setDurationDays(option)} className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${durationDays === option ? "bg-[#0c8c89] text-white" : "text-[#668087] hover:bg-[#e8f6f1]"}`}>{option}d</button>)}</div></div></CardHeader>
          <CardContent className="p-0">
            {usersQuery.isLoading ? <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm font-semibold text-[#668087]"><ShieldCheck className="h-5 w-5 animate-pulse text-[#0c8c89]" />Carregando usuários reais...</div> : usersQuery.isError ? <div className="px-6 py-14 text-center text-sm text-[#c2410c]">Não foi possível carregar os usuários administrativos. Atualize a página e tente novamente.</div> : filteredUsers.length === 0 ? <div className="px-6 py-14 text-center"><UserRound className="mx-auto h-9 w-9 text-[#a3bbb5]" /><p className="mt-3 text-sm font-semibold text-[#315158]">Nenhum usuário encontrado.</p><p className="mt-1 text-xs text-[#799092]">O painel não cria dados de demonstração; ele mostra somente contas reais.</p></div> : <div className="divide-y divide-[#edf3f1]">{filteredUsers.map(item => { const busy = busyUserId === item.id; const suspended = item.accessStatus === "suspended"; const expired = isExpired(item.accessExpiresAt); return <div key={item.id} className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-7"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-bold text-[#102b32]">{item.name || "Usuário sem nome"}</p><Badge className={suspended || expired ? "border-0 bg-[#fff0eb] text-[#b54825]" : "border-0 bg-[#e7f7ef] text-[#18734d]"}>{suspended ? "Desligado" : expired ? "Validade expirada" : "Ativo"}</Badge>{item.role === "admin" && <Badge className="border-0 bg-[#e8f1ff] text-[#2f5d9a]">Administrador</Badge>}</div><p className="mt-1 text-xs text-[#668087]">{item.email || "Sem e-mail informado"} · ID {item.id}</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#5d7479]"><span>Validade: <strong className="text-[#315158]">{formatDate(item.accessExpiresAt)}</strong></span><span>Ambientes: <strong className="text-[#315158]">{item.workspaces.length ? item.workspaces.map(workspace => workspace.kind === "autonomo" ? "Autônomo" : "CLT").join(" + ") : "Nenhum"}</strong></span><span>Último login: <strong className="text-[#315158]">{formatDate(item.lastSignedIn)}</strong></span></div></div>{item.role !== "admin" && <div className="flex shrink-0 flex-wrap gap-2"><Button type="button" size="sm" disabled={busy} onClick={() => runAction(suspended || expired ? "reactivate" : "renew", item.id)} className="rounded-xl bg-[#0c8c89] text-white hover:bg-[#076c70]">{busy ? "Salvando..." : suspended || expired ? "Reativar" : `Renovar ${durationDays}d`}</Button><Button type="button" size="sm" variant="outline" disabled={busy || suspended} onClick={() => runAction("disable", item.id)} className="rounded-xl border-[#f0d9d1] text-[#b54825] hover:bg-[#fff6f2]">Desligar</Button></div>}</div>; })}</div>}
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-[#deece9] shadow-[0_14px_40px_rgba(16,43,50,.06)]">
          <CardHeader className="gap-2 border-b border-[#edf3f1] px-5 py-5 lg:px-7">
            <CardTitle className="font-display text-xl text-[#102b32]">Gestão de Assinaturas (Stripe)</CardTitle>
            <p className="mt-1 text-sm text-[#6b8185]">Visualize todos os planos ativos, ciclos de faturamento e status de pagamento dos usuários.</p>
          </CardHeader>
          <CardContent className="p-0">
            {usersQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm font-semibold text-[#668087]">Carregando assinaturas...</div>
            ) : subscriptionsList.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-[#668087]">Nenhuma assinatura Stripe registrada até o momento. Os planos contratados aparecerão aqui automaticamente.</div>
            ) : (
              <div className="divide-y divide-[#edf3f1]">
                {subscriptionsList.map(item => {
                  const sub = item.subscription as any;
                  return (
                    <div key={item.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-7">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-[#102b32]">{item.name || "Usuário"}</p>
                          <Badge className="border-0 bg-[#e7f7ef] text-[#18734d] uppercase font-mono text-[10px]">{sub.planCode || "Plano"}</Badge>
                          <Badge className="border-0 bg-[#e8f1ff] text-[#2f5d9a] text-[10px]">{sub.status || "Ativo"}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-[#668087]">{item.email} · Cliente ID: {sub.stripeCustomerId || "N/D"}</p>
                      </div>
                      <div className="text-right text-xs text-[#5d7479]">
                        <p>Início: <strong className="text-[#315158]">{formatDate(sub.createdAt)}</strong></p>
                        <p className="mt-0.5">Renovação: <strong className="text-[#315158]">{formatDate(sub.currentPeriodEnd)}</strong></p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-[#deece9] shadow-[0_14px_40px_rgba(16,43,50,.05)]"><CardHeader className="px-5 py-5 lg:px-7"><CardTitle className="font-display text-xl text-[#102b32]">Auditoria recente</CardTitle><p className="mt-1 text-sm text-[#6b8185]">Registro das últimas alterações feitas neste painel.</p></CardHeader><CardContent className="px-5 pb-6 lg:px-7">{auditsQuery.isLoading ? <p className="text-sm text-[#668087]">Carregando histórico...</p> : auditsQuery.data?.length ? <div className="space-y-3">{auditsQuery.data.slice(0, 8).map(audit => <div key={audit.id} className="flex flex-col gap-1 rounded-2xl bg-[#f7fcfa] px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between"><div><span className="font-bold text-[#315158]">{audit.action === "renew" ? "Renovação" : audit.action === "disable" ? "Desligamento" : "Reativação"}</span><span className="ml-2 text-[#6b8185]">usuário ID {audit.targetUserId}</span></div><span className="text-[#799092]">{formatDate(audit.createdAt)} · validade até {formatDate(audit.nextExpiresAt)}</span></div>)}</div> : <p className="rounded-2xl bg-[#f7fcfa] px-4 py-4 text-sm text-[#668087]">Nenhuma alteração administrativa registrada ainda.</p>}</CardContent></Card>
      </div>
    </DashboardLayout>
  );
}

function MetricCard({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: number; detail: string }) {
  return <Card className="rounded-[1.5rem] border-[#deece9] shadow-[0_12px_30px_rgba(16,43,50,.04)]"><CardContent className="flex items-start gap-4 p-5"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e8f6f1] text-[#0c8c89]">{icon}</div><div><p className="text-xs font-semibold text-[#668087]">{label}</p><p className="mt-1 font-display text-3xl font-bold text-[#102b32]">{value}</p><p className="mt-1 text-xs text-[#799092]">{detail}</p></div></CardContent></Card>;
}

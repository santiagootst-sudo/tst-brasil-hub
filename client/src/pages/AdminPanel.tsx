import { useMemo, useState } from "react";
import { Activity, AlertCircle, Copy, Database, FileStack, HardDrive, KeyRound, MailCheck, MessageCircle, PackagePlus, RefreshCw, ShieldCheck, UserCheck, UserMinus, UserPlus, UserRound, UsersRound } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { ModuleHeader, ModulePage } from "@/components/ModulePageLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

const durationOptions = [
  { days: 3, label: "Teste 3 dias" },
  { days: 7, label: "Teste 7 dias" },
  { days: 30, label: "30 dias" },
  { days: 60, label: "60 dias" },
  { days: 90, label: "90 dias" },
  { days: 365, label: "12 meses" },
] as const;

type Credential = { name: string; email: string; phone?: string | null; password: string; expiresAt: Date | string };

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Sem validade definida";
  return new Date(value).toLocaleDateString("pt-BR", { dateStyle: "medium" });
}

function isExpired(value: Date | string | null | undefined) {
  return Boolean(value && new Date(value).getTime() <= Date.now());
}

function isExpiringSoon(value: Date | string | null | undefined) {
  if (!value) return false;
  const remaining = new Date(value).getTime() - Date.now();
  return remaining > 0 && remaining <= 7 * 24 * 60 * 60 * 1000;
}

function formatBytes(bytes: number | null | undefined) {
  if (bytes === null || bytes === undefined) return "Indisponível";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1; }
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${units[unit]}`;
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "Sem atividade registrada";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function isDisabledGeneratedAccess(request: { status: string; approvedAt?: Date | string | null }) {
  return request.status === "rejected" && Boolean(request.approvedAt);
}

function openWhatsAppCredential(credential: Credential) {
  const rawPhone = (credential.phone || "").replace(/\D/g, "");
  if (!rawPhone) {
    toast.error("Cadastre um telefone/WhatsApp para enviar as credenciais.");
    return;
  }
  const phone = rawPhone.length <= 11 ? `55${rawPhone}` : rawPhone;
  const message = [
    `Olá, ${credential.name}!`,
    "Seu acesso ao TST Brasil Hub foi liberado.",
    `E-mail: ${credential.email}`,
    `Senha temporária: ${credential.password}`,
    `Validade: ${formatDate(credential.expiresAt)}`,
    "Acesse: https://tstbrasilhub.com.br",
  ].join("\n");
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
}

function DurationSelector({ value, onChange, compact = false }: { value: number; onChange: (days: number) => void; compact?: boolean }) {
  return <div className={`rounded-xl border border-[#dcebe8] bg-[#fbfefd] p-1 ${compact ? "flex" : "flex flex-wrap gap-1"}`}>{durationOptions.map(option => <button key={option.days} type="button" onClick={() => onChange(option.days)} className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${value === option.days ? "bg-[#0c8c89] text-white" : "text-[#668087] hover:bg-[#e8f6f1]"}`}>{compact ? option.days === 365 ? "12m" : `${option.days}d` : option.label}</button>)}</div>;
}

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();
  const usersQuery = trpc.admin.users.useQuery(undefined, { enabled: isAdmin });
  const auditsQuery = trpc.admin.audits.useQuery(undefined, { enabled: isAdmin });
  const requestsQuery = trpc.admin.accessRequests.useQuery(undefined, { enabled: isAdmin });
  const telemetryQuery = trpc.admin.platformTelemetry.useQuery(undefined, { enabled: isAdmin, refetchInterval: 60_000 });
  const [search, setSearch] = useState("");
  const [durationDays, setDurationDays] = useState(30);
  const [showExpiringSoon, setShowExpiringSoon] = useState(false);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [busyRequestId, setBusyRequestId] = useState<number | null>(null);
  const [newAccess, setNewAccess] = useState({ fullName: "", email: "", phone: "", companyName: "", jobTitle: "" });
  const [latestCredential, setLatestCredential] = useState<Credential | null>(null);

  const refreshUsers = () => Promise.all([utils.admin.users.invalidate(), utils.admin.accessRequests.invalidate(), utils.admin.audits.invalidate()]);
  const renew = trpc.admin.renew.useMutation({ onSuccess: async () => { toast.success("Acesso renovado com sucesso."); await refreshUsers(); }, onError: error => toast.error(error.message), onSettled: () => setBusyUserId(null) });
  const disable = trpc.admin.disable.useMutation({ onSuccess: async () => { toast.success("Acesso desligado."); await refreshUsers(); }, onError: error => toast.error(error.message), onSettled: () => setBusyUserId(null) });
  const reactivate = trpc.admin.reactivate.useMutation({ onSuccess: async () => { toast.success("Acesso reativado com validade definida."); await refreshUsers(); }, onError: error => toast.error(error.message), onSettled: () => setBusyUserId(null) });
  const storeCredential = (data: { request: { fullName: string; email: string; phone?: string | null }; temporaryPassword: string; expiresAt: Date | string }) => {
    const credential = { name: data.request.fullName, email: data.request.email, phone: data.request.phone, password: data.temporaryPassword, expiresAt: data.expiresAt };
    setLatestCredential(credential);
    void navigator.clipboard?.writeText(`E-mail: ${credential.email}\nSenha: ${credential.password}`).catch(() => undefined);
  };
  const grantAccess = trpc.admin.grantAccess.useMutation({ onSuccess: async data => { storeCredential(data); toast.success(`Credenciais geradas para ${data.request.email}.`); await refreshUsers(); }, onError: error => toast.error(error.message) });
  const createManualAccess = trpc.admin.createManualAccess.useMutation({ onSuccess: async data => { storeCredential(data); toast.success(`Acesso criado para ${data.request.email}.`); setNewAccess({ fullName: "", email: "", phone: "", companyName: "", jobTitle: "" }); await refreshUsers(); }, onError: error => toast.error(error.message) });
  const resetCredential = trpc.admin.resetCredential.useMutation({ onSuccess: async data => { storeCredential(data); toast.success(`Nova senha gerada para ${data.request.email}.`); await refreshUsers(); }, onError: error => toast.error(error.message) });
  const disableGeneratedAccess = trpc.admin.disableGeneratedAccess.useMutation({ onSuccess: async () => { toast.success("Login gerado desligado com sucesso."); await refreshUsers(); }, onError: error => toast.error(error.message), onSettled: () => setBusyRequestId(null) });
  const reactivateGeneratedAccess = trpc.admin.reactivateGeneratedAccess.useMutation({ onSuccess: async () => { toast.success("Login gerado reativado com a nova validade."); await refreshUsers(); }, onError: error => toast.error(error.message), onSettled: () => setBusyRequestId(null) });

  const users = usersQuery.data ?? [];
  const filteredUsers = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return users.filter(item => {
      const matchesSearch = !term || [item.name, item.email, String(item.id)].some(value => value?.toLocaleLowerCase().includes(term));
      return matchesSearch && (!showExpiringSoon || isExpiringSoon(item.accessExpiresAt));
    });
  }, [search, showExpiringSoon, users]);
  const activeCount = users.filter(item => item.accessStatus === "active" && !isExpired(item.accessExpiresAt)).length;
  const suspendedCount = users.filter(item => item.accessStatus === "suspended").length;
  const expiringCount = users.filter(item => item.accessStatus === "active" && isExpiringSoon(item.accessExpiresAt)).length;
  const subscriptionsList = users.map(u => ({ ...u, subscription: (u as any).subscription })).filter(u => u.subscription);
  const runAction = (action: "renew" | "disable" | "reactivate", targetUserId: number) => {
    setBusyUserId(targetUserId);
    if (action === "renew") renew.mutate({ targetUserId, durationDays });
    if (action === "disable") disable.mutate({ targetUserId });
    if (action === "reactivate") reactivate.mutate({ targetUserId, durationDays });
  };
  const runGeneratedAccessAction = (action: "disable" | "reactivate", requestId: number) => {
    setBusyRequestId(requestId);
    if (action === "disable") disableGeneratedAccess.mutate({ requestId });
    if (action === "reactivate") reactivateGeneratedAccess.mutate({ requestId, durationDays });
  };

  if (loading) return <DashboardLayout title="Gestão de acessos"><div className="grid min-h-[50vh] place-items-center"><div className="flex items-center gap-3 text-sm font-semibold text-[#48656b]"><ShieldCheck className="h-5 w-5 animate-pulse text-[#0c8c89]" />Carregando autorização administrativa...</div></div></DashboardLayout>;
  if (!isAdmin) return <DashboardLayout title="Acesso restrito"><div className="mx-auto max-w-xl rounded-3xl border border-[#f0d9d1] bg-white p-8 text-center shadow-sm"><UserMinus className="mx-auto h-10 w-10 text-[#c2410c]" /><h2 className="mt-4 font-display text-2xl font-bold text-[#102b32]">Área exclusiva do proprietário</h2><p className="mt-2 text-sm leading-6 text-[#5d7479]">Este painel não está disponível para contas de usuário.</p></div></DashboardLayout>;

  return <DashboardLayout title="Gestão de acessos"><ModulePage className="space-y-6">
    <ModuleHeader eyebrow="Administração do ecossistema" title="Gestão de acessos" description="Crie, renove, bloqueie e acompanhe os acessos. As credenciais são geradas no momento da liberação." icon={ShieldCheck} actions={<div className="flex flex-wrap items-center gap-2"><Link href="/admin/materiais" className="inline-flex h-10 items-center rounded-lg border border-[#cfe0df] bg-white px-3 text-xs font-bold text-[#087f78] transition hover:bg-[#f1f7f6]"><PackagePlus className="mr-2 h-4 w-4" />Gerir materiais</Link><span className="rounded-lg border border-[#dbe6e4] bg-white px-3 py-2 text-xs font-bold text-[#587076]">{user?.email || user?.name || "Proprietário do portal"}</span></div>} />
    <section className="grid gap-4 md:grid-cols-3"><MetricCard icon={<UsersRound className="h-5 w-5" />} label="Usuários cadastrados" value={users.length} detail="Contas reais encontradas" /><MetricCard icon={<UserCheck className="h-5 w-5" />} label="Acessos ativos" value={activeCount} detail={expiringCount ? `${expiringCount} vencem em até 7 dias` : "Sem vencimentos próximos"} /><MetricCard icon={<UserMinus className="h-5 w-5" />} label="Desligados" value={suspendedCount} detail="Bloqueados no middleware protegido" /></section>
    <section className="rounded-[1.75rem] border border-[#c9d9e7] bg-gradient-to-br from-[#f8fbff] to-white p-5 shadow-[0_14px_36px_rgba(18,61,105,.06)] lg:p-7">
      <div className="flex flex-col gap-3 border-b border-[#dce7f1] pb-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#3974b4]">Visão da plataforma</p><h2 className="mt-1 font-display text-2xl font-bold text-[#173e66]">Uso de dados e saúde operacional</h2><p className="mt-1 text-sm text-[#667f99]">Métricas consolidadas da operação, sem expor conteúdos ou documentos das empresas.</p></div><Button type="button" variant="outline" onClick={() => void telemetryQuery.refetch()} disabled={telemetryQuery.isFetching} className="rounded-xl border-[#bfd2e5] bg-white text-[#1d5d98] hover:bg-[#eef6ff]"><RefreshCw className={`mr-2 h-4 w-4 ${telemetryQuery.isFetching ? "animate-spin" : ""}`} />Atualizar</Button></div>
      {telemetryQuery.isLoading ? <div className="grid min-h-48 place-items-center text-sm font-semibold text-[#668087]"><Activity className="mr-2 h-5 w-5 animate-pulse text-[#3974b4]" />Lendo métricas da plataforma...</div> : telemetryQuery.isError || !telemetryQuery.data ? <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#f1d6cb] bg-[#fff8f5] p-4 text-sm text-[#a6442d]"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />Não foi possível obter as métricas técnicas agora. Nenhum dado de empresa foi exposto.</div> : (() => { const telemetry = telemetryQuery.data; const records = telemetry.usage.occupationalRisks + telemetry.usage.epiDeliveries + telemetry.usage.epiEvidence + telemetry.usage.accidents; const capacityPercent = telemetry.database.observedBytes !== null && telemetry.database.capacityBytes ? Math.min(100, Math.round((telemetry.database.observedBytes / telemetry.database.capacityBytes) * 100)) : null; return <div className="mt-5 grid gap-5 xl:grid-cols-2"><article className="rounded-2xl border border-[#d9e5f0] bg-white p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#3974b4]">Uso de dados</p><h3 className="mt-1 text-lg font-bold text-[#173e66]">Volume observado da plataforma</h3></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8f2ff] text-[#2b6ead]"><HardDrive className="h-5 w-5" /></span></div><div className="mt-5 rounded-xl border border-[#dbe7f1] bg-[#f8fbff] p-4"><div className="flex items-baseline justify-between gap-3"><div><p className="text-xs font-semibold text-[#668097]">Banco de dados</p><p className="mt-1 text-2xl font-bold text-[#173e66]">{formatBytes(telemetry.database.observedBytes)}</p></div><span className="text-xs font-semibold text-[#668097]">{telemetry.database.capacityBytes ? `${capacityPercent}% do limite configurado` : "Limite não configurado"}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#dfe8f1]"><div className={capacityPercent !== null && capacityPercent >= 85 ? "h-full rounded-full bg-[#d65a4d]" : capacityPercent !== null && capacityPercent >= 70 ? "h-full rounded-full bg-[#d89a38]" : "h-full rounded-full bg-[#3974b4]"} style={{ width: `${capacityPercent ?? 0}%` }} /></div><p className="mt-2 text-[11px] text-[#71869c]">{telemetry.database.capacityBytes ? `Capacidade configurada: ${formatBytes(telemetry.database.capacityBytes)}.` : "Defina PLATFORM_DATABASE_CAPACITY_BYTES para acompanhar o percentual do limite contratado."}</p></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><TelemetryMetric icon={UsersRound} label="Empresas" value={telemetry.usage.companies} /><TelemetryMetric icon={UserRound} label="Pessoas" value={telemetry.usage.employees} /><TelemetryMetric icon={Activity} label="Registros SST" value={records} /><TelemetryMetric icon={FileStack} label="Documentos" value={telemetry.usage.documents} /></div></article><article className="rounded-2xl border border-[#d9e5f0] bg-white p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#268353]">Saúde operacional</p><h3 className="mt-1 text-lg font-bold text-[#173e66]">Sinais essenciais do serviço</h3></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e7f7ef] text-[#268353]"><Database className="h-5 w-5" /></span></div><div className="mt-5 space-y-3"><OperationalStatus icon={Database} label="Banco de dados" detail={telemetry.database.status === "available" ? "Conexão disponível para o portal" : "Conexão indisponível — modo de contingência"} healthy={telemetry.database.status === "available"} /><OperationalStatus icon={MailCheck} label="E-mail transacional" detail={telemetry.operational.emailDeliveryConfigured ? "Configuração do canal de OTP encontrada" : "Chave ou remetente do canal de OTP não configurado"} healthy={telemetry.operational.emailDeliveryConfigured} /><OperationalStatus icon={Activity} label="Atividade de riscos" detail={formatDateTime(telemetry.operational.latestRiskEventAt)} healthy={Boolean(telemetry.operational.latestRiskEventAt)} /><OperationalStatus icon={ShieldCheck} label="Evidências de EPI" detail={formatDateTime(telemetry.operational.latestEpiEvidenceAt)} healthy={Boolean(telemetry.operational.latestEpiEvidenceAt)} /></div><p className="mt-4 text-[11px] text-[#71869c]">Leitura atualizada em {formatDateTime(telemetry.capturedAt)} · Chamados registrados: {telemetry.usage.supportTickets}.</p></article></div>; })()}
    </section>
    <Card className="overflow-hidden rounded-[1.75rem] border-[#b9ddd3] shadow-[0_14px_40px_rgba(16,43,50,.07)]"><CardHeader className="border-b border-[#e4f0ed] bg-[#f5fcf9] px-5 py-5 lg:px-7"><CardTitle className="flex items-center gap-2 font-display text-xl text-[#102b32]"><UserPlus className="h-5 w-5 text-[#0c8c89]" />Criar novo acesso</CardTitle><p className="mt-1 text-sm text-[#668087]">Cadastre a pessoa, escolha inclusive um teste de 3 ou 7 dias e gere as credenciais para enviar pelo WhatsApp.</p></CardHeader><CardContent className="p-5 lg:p-7"><form onSubmit={event => { event.preventDefault(); createManualAccess.mutate({ ...newAccess, durationDays }); }} className="grid gap-4 lg:grid-cols-3"><Input value={newAccess.fullName} onChange={event => setNewAccess(current => ({ ...current, fullName: event.target.value }))} required placeholder="Nome completo" className="h-11 rounded-xl border-[#dcebe8]" /><Input value={newAccess.email} onChange={event => setNewAccess(current => ({ ...current, email: event.target.value }))} required type="email" placeholder="E-mail de acesso" className="h-11 rounded-xl border-[#dcebe8]" /><Input value={newAccess.phone} onChange={event => setNewAccess(current => ({ ...current, phone: event.target.value }))} required placeholder="Telefone / WhatsApp com DDD" className="h-11 rounded-xl border-[#dcebe8]" /><Input value={newAccess.companyName} onChange={event => setNewAccess(current => ({ ...current, companyName: event.target.value }))} placeholder="Empresa (opcional)" className="h-11 rounded-xl border-[#dcebe8]" /><Input value={newAccess.jobTitle} onChange={event => setNewAccess(current => ({ ...current, jobTitle: event.target.value }))} placeholder="Função (opcional)" className="h-11 rounded-xl border-[#dcebe8]" /><div className="rounded-xl border border-[#dcebe8] bg-white px-3 py-2"><p className="mb-2 text-[11px] font-bold uppercase tracking-[.12em] text-[#668087]">Tempo de ativação</p><DurationSelector value={durationDays} onChange={setDurationDays} /></div><Button type="submit" disabled={createManualAccess.isPending} className="h-11 rounded-xl bg-[#0c7474] font-bold text-white hover:bg-[#063b43] lg:col-start-3">{createManualAccess.isPending ? "Gerando..." : "Gerar acesso"}<KeyRound className="ml-2 h-4 w-4" /></Button></form>{latestCredential && <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#bfe2d4] bg-[#ebf8f1] p-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.12em] text-[#18734d]">Credencial pronta para envio</p><p className="mt-1 text-sm font-bold text-[#102b32]">{latestCredential.name} · {latestCredential.email}</p><p className="mt-1 font-mono text-sm text-[#315158]">Senha: {latestCredential.password}</p><p className="mt-1 text-xs text-[#668087]">Válida até {formatDate(latestCredential.expiresAt)}</p></div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => void navigator.clipboard?.writeText(`E-mail: ${latestCredential.email}\nSenha: ${latestCredential.password}`).then(() => toast.success("Credenciais copiadas.")).catch(() => toast.error("Não foi possível copiar automaticamente."))} className="rounded-xl border-[#8fcbb7] text-[#0c7474]"><Copy className="mr-2 h-4 w-4" />Copiar</Button><Button type="button" disabled={!latestCredential.phone} onClick={() => openWhatsAppCredential(latestCredential)} className="rounded-xl bg-[#188c53] text-white hover:bg-[#146f43]"><MessageCircle className="mr-2 h-4 w-4" />Enviar no WhatsApp</Button></div></div>}</CardContent></Card>
    <Card className="rounded-[1.75rem] border-[#deece9] shadow-[0_14px_40px_rgba(16,43,50,.06)]"><CardHeader className="border-b border-[#edf3f1] px-5 py-5 lg:px-7"><CardTitle className="flex items-center gap-2 font-display text-xl text-[#102b32]"><KeyRound className="h-5 w-5 text-[#0c8c89]" />Solicitações de acesso</CardTitle><p className="mt-1 text-sm text-[#6b8185]">Aprove pedidos, use testes de 3 ou 7 dias e desligue credenciais já geradas quando necessário.</p></CardHeader><CardContent className="p-0">{requestsQuery.isLoading ? <div className="px-6 py-10 text-sm text-[#668087]">Carregando solicitações...</div> : !(requestsQuery.data?.length) ? <div className="px-6 py-10 text-center text-sm text-[#668087]">Ainda não há solicitações de acesso.</div> : <div className="divide-y divide-[#edf3f1]">{requestsQuery.data.map(request => <div key={request.id} className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-7"><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold text-[#102b32]">{request.fullName}</p><Badge className={request.status === "approved" ? "border-0 bg-[#e7f7ef] text-[#18734d]" : isDisabledGeneratedAccess(request) ? "border-0 bg-[#fff0eb] text-[#b54825]" : "border-0 bg-[#fff5df] text-[#996a12]"}>{request.status === "approved" ? "Liberado" : isDisabledGeneratedAccess(request) ? "Desligado" : "Aguardando aprovação"}</Badge></div><p className="mt-1 text-xs text-[#668087]">{request.email}{request.phone ? ` · ${request.phone}` : " · WhatsApp não informado"}</p><p className="mt-1 text-xs text-[#5d7479]">{request.companyName || "Empresa não informada"}{request.jobTitle ? ` · ${request.jobTitle}` : ""}</p></div>{request.status === "requested" ? <Button size="sm" disabled={grantAccess.isPending} onClick={() => grantAccess.mutate({ requestId: request.id, durationDays })} className="rounded-xl bg-[#0c7474] text-white hover:bg-[#063b43]"><Copy className="mr-2 h-4 w-4" />Gerar acesso</Button> : request.status === "approved" || isDisabledGeneratedAccess(request) ? <div className="flex flex-wrap items-center gap-2"><span className="text-xs text-[#668087]">{isDisabledGeneratedAccess(request) ? "Login desligado" : `Validade: ${formatDate(request.accessExpiresAt)}`}</span>{isDisabledGeneratedAccess(request) ? <Button type="button" size="sm" disabled={busyRequestId === request.id} onClick={() => runGeneratedAccessAction("reactivate", request.id)} className="rounded-xl bg-[#0c8c89] text-white hover:bg-[#076c70]">{busyRequestId === request.id ? "Salvando..." : `Reativar ${durationDays === 365 ? "12m" : `${durationDays}d`}`}</Button> : <Button type="button" size="sm" variant="outline" disabled={busyRequestId === request.id} onClick={() => runGeneratedAccessAction("disable", request.id)} className="rounded-xl border-[#f0d9d1] text-[#b54825] hover:bg-[#fff6f2]"><UserMinus className="mr-2 h-4 w-4" />{busyRequestId === request.id ? "Salvando..." : "Desligar login"}</Button>}</div> : <span className="text-xs text-[#668087]">Solicitação não liberada.</span>}</div>)}</div>}</CardContent></Card>
    <Card className="rounded-[1.75rem] border-[#deece9] shadow-[0_14px_40px_rgba(16,43,50,.06)]"><CardHeader className="gap-4 border-b border-[#edf3f1] px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-7"><div><CardTitle className="font-display text-xl text-[#102b32]">Usuários e ambientes</CardTitle><p className="mt-1 text-sm text-[#6b8185]">Renove, desligue, reative ou gere uma nova senha para uma conta existente.</p></div><div className="flex flex-col gap-2 sm:flex-row sm:items-center"><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar nome, e-mail ou ID" className="h-10 w-full rounded-xl border-[#dcebe8] bg-[#fbfefd] sm:w-56" /><Button type="button" variant={showExpiringSoon ? "default" : "outline"} onClick={() => setShowExpiringSoon(current => !current)} className={showExpiringSoon ? "h-10 rounded-xl bg-[#c97720] text-white hover:bg-[#a95e12]" : "h-10 rounded-xl border-[#e7d3bb] text-[#9a5b18] hover:bg-[#fff8ed]"}>Vencem em 7 dias{expiringCount ? ` (${expiringCount})` : ""}</Button><DurationSelector compact value={durationDays} onChange={setDurationDays} /></div></CardHeader><CardContent className="p-0">{usersQuery.isLoading ? <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm font-semibold text-[#668087]"><ShieldCheck className="h-5 w-5 animate-pulse text-[#0c8c89]" />Carregando usuários reais...</div> : usersQuery.isError ? <div className="px-6 py-14 text-center text-sm text-[#c2410c]">Não foi possível carregar os usuários administrativos.</div> : filteredUsers.length === 0 ? <div className="px-6 py-14 text-center"><UserRound className="mx-auto h-9 w-9 text-[#a3bbb5]" /><p className="mt-3 text-sm font-semibold text-[#315158]">{showExpiringSoon ? "Nenhuma conta vence nos próximos 7 dias." : "Nenhum usuário encontrado."}</p></div> : <div className="divide-y divide-[#edf3f1]">{filteredUsers.map(item => { const busy = busyUserId === item.id; const suspended = item.accessStatus === "suspended"; const expired = isExpired(item.accessExpiresAt); const expiring = isExpiringSoon(item.accessExpiresAt); return <div key={item.id} className={`flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-7 ${expiring ? "bg-[#fffaf1]" : ""}`}><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-bold text-[#102b32]">{item.name || "Usuário sem nome"}</p><Badge className={suspended || expired ? "border-0 bg-[#fff0eb] text-[#b54825]" : expiring ? "border-0 bg-[#fff1d8] text-[#a65b13]" : "border-0 bg-[#e7f7ef] text-[#18734d]"}>{suspended ? "Desligado" : expired ? "Validade expirada" : expiring ? "Vence em até 7 dias" : "Ativo"}</Badge>{item.role === "admin" && <Badge className="border-0 bg-[#e8f1ff] text-[#2f5d9a]">Administrador</Badge>}</div><p className="mt-1 text-xs text-[#668087]">{item.email || "Sem e-mail informado"} · ID {item.id}</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#5d7479]"><span>Validade: <strong className="text-[#315158]">{formatDate(item.accessExpiresAt)}</strong></span><span>Ambientes: <strong className="text-[#315158]">{item.workspaces.length ? item.workspaces.map(workspace => workspace.kind === "autonomo" ? "Autônomo" : "CLT").join(" + ") : "Nenhum"}</strong></span><span>Último login: <strong className="text-[#315158]">{formatDate(item.lastSignedIn)}</strong></span></div></div>{item.role !== "admin" && <div className="flex shrink-0 flex-wrap gap-2"><Button type="button" size="sm" disabled={busy} onClick={() => runAction(suspended || expired ? "reactivate" : "renew", item.id)} className="rounded-xl bg-[#0c8c89] text-white hover:bg-[#076c70]">{busy ? "Salvando..." : suspended || expired ? "Reativar" : `Renovar ${durationDays === 365 ? "12m" : `${durationDays}d`}`}</Button><Button type="button" size="sm" variant="outline" disabled={resetCredential.isPending || !item.email} onClick={() => item.email && resetCredential.mutate({ email: item.email, durationDays })} className="rounded-xl border-[#d4e7e1] text-[#0c7474] hover:bg-[#eff9f6]">Nova senha</Button><Button type="button" size="sm" variant="outline" disabled={busy || suspended} onClick={() => runAction("disable", item.id)} className="rounded-xl border-[#f0d9d1] text-[#b54825] hover:bg-[#fff6f2]">Desligar</Button></div>}</div>; })}</div>}</CardContent></Card>
    <Card className="rounded-[1.75rem] border-[#deece9] shadow-[0_14px_40px_rgba(16,43,50,.06)]"><CardHeader className="gap-2 border-b border-[#edf3f1] px-5 py-5 lg:px-7"><CardTitle className="font-display text-xl text-[#102b32]">Gestão de Assinaturas (Stripe)</CardTitle><p className="mt-1 text-sm text-[#6b8185]">Visualize planos ativos e ciclos de faturamento, quando o checkout estiver ativo.</p></CardHeader><CardContent className="p-0">{subscriptionsList.length === 0 ? <div className="px-6 py-12 text-center text-sm text-[#668087]">Nenhuma assinatura Stripe registrada até o momento.</div> : <div className="divide-y divide-[#edf3f1]">{subscriptionsList.map(item => { const sub = item.subscription as any; return <div key={item.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-7"><div><div className="flex items-center gap-2"><p className="text-sm font-bold text-[#102b32]">{item.name || "Usuário"}</p><Badge className="border-0 bg-[#e7f7ef] text-[#18734d] uppercase font-mono text-[10px]">{sub.planCode || "Plano"}</Badge><Badge className="border-0 bg-[#e8f1ff] text-[#2f5d9a] text-[10px]">{sub.status || "Ativo"}</Badge></div><p className="mt-1 text-xs text-[#668087]">{item.email} · Cliente ID: {sub.stripeCustomerId || "N/D"}</p></div><div className="text-right text-xs text-[#5d7479]"><p>Início: <strong className="text-[#315158]">{formatDate(sub.createdAt)}</strong></p><p className="mt-0.5">Renovação: <strong className="text-[#315158]">{formatDate(sub.currentPeriodEnd)}</strong></p></div></div>; })}</div>}</CardContent></Card>
    <Card className="rounded-[1.75rem] border-[#deece9] shadow-[0_14px_40px_rgba(16,43,50,.05)]"><CardHeader className="px-5 py-5 lg:px-7"><CardTitle className="font-display text-xl text-[#102b32]">Auditoria recente</CardTitle><p className="mt-1 text-sm text-[#6b8185]">Registro das últimas alterações feitas neste painel.</p></CardHeader><CardContent className="px-5 pb-6 lg:px-7">{auditsQuery.isLoading ? <p className="text-sm text-[#668087]">Carregando histórico...</p> : auditsQuery.data?.length ? <div className="space-y-3">{auditsQuery.data.slice(0, 8).map(audit => <div key={audit.id} className="flex flex-col gap-1 rounded-2xl bg-[#f7fcfa] px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between"><div><span className="font-bold text-[#315158]">{audit.action === "renew" ? "Renovação" : audit.action === "disable" ? "Desligamento" : "Reativação"}</span><span className="ml-2 text-[#6b8185]">usuário ID {audit.targetUserId}</span></div><span className="text-[#799092]">{formatDate(audit.createdAt)} · validade até {formatDate(audit.nextExpiresAt)}</span></div>)}</div> : <p className="rounded-2xl bg-[#f7fcfa] px-4 py-4 text-sm text-[#668087]">Nenhuma alteração administrativa registrada ainda.</p>}</CardContent></Card>
  </ModulePage></DashboardLayout>;
}

function TelemetryMetric({ icon: Icon, label, value }: { icon: typeof UsersRound; label: string; value: number }) {
  return <div className="rounded-xl border border-[#e1e9f1] bg-white p-3"><Icon className="h-4 w-4 text-[#3974b4]" /><p className="mt-2 text-lg font-bold text-[#173e66]">{value.toLocaleString("pt-BR")}</p><p className="text-[10px] font-bold uppercase tracking-[.08em] text-[#71869c]">{label}</p></div>;
}

function OperationalStatus({ icon: Icon, label, detail, healthy }: { icon: typeof Database; label: string; detail: string; healthy: boolean }) {
  return <div className="flex items-start gap-3 rounded-xl border border-[#e1e9f1] bg-[#fbfdff] p-3"><span className={`grid h-8 w-8 place-items-center rounded-lg ${healthy ? "bg-[#e7f7ef] text-[#268353]" : "bg-[#fff1e9] text-[#bf6332]"}`}><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="text-xs font-bold text-[#294d70]">{label}</p><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${healthy ? "bg-[#e7f7ef] text-[#268353]" : "bg-[#fff1e9] text-[#bf6332]"}`}>{healthy ? "OK" : "Atenção"}</span></div><p className="mt-1 text-xs text-[#71869c]">{detail}</p></div></div>;
}

function MetricCard({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: number; detail: string }) {
  return <Card className="rounded-[1.5rem] border-[#deece9] shadow-[0_12px_30px_rgba(16,43,50,.04)]"><CardContent className="flex items-start gap-4 p-5"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e8f6f1] text-[#0c8c89]">{icon}</div><div><p className="text-xs font-semibold text-[#668087]">{label}</p><p className="mt-1 font-display text-3xl font-bold text-[#102b32]">{value}</p><p className="mt-1 text-xs text-[#799092]">{detail}</p></div></CardContent></Card>;
}

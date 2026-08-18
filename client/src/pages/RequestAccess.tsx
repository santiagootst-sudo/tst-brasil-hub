import { useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Clock3, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";

export default function RequestAccess() {
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", companyName: "", jobTitle: "" });
  const [submitted, setSubmitted] = useState(false);
  const request = trpc.access.request.useMutation({
    onSuccess: data => {
      setSubmitted(true);
      toast.success(data.alreadyRequested ? "Sua solicitação já está registrada." : "Solicitação enviada com sucesso.");
    },
    onError: error => toast.error(error.message),
  });
  const update = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }));

  return <main className="min-h-screen bg-[#f6fbfa] px-4 py-8 text-[#102b32] sm:px-6 lg:py-12"><div className="mx-auto max-w-5xl"><Link href="/" className="text-sm font-bold text-[#0c7474] hover:text-[#063b43]">← Voltar para o Portal TST Brasil</Link><div className="mt-8 grid overflow-hidden rounded-[2rem] border border-[#dbece8] bg-white shadow-[0_24px_70px_rgba(7,59,67,.10)] lg:grid-cols-[.88fr_1.12fr]"><section className="bg-[#063b43] p-7 text-white sm:p-10"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#77d4bb]/20 text-[#a8f4df]"><ShieldCheck className="h-6 w-6" /></div><p className="mt-7 text-xs font-bold uppercase tracking-[.18em] text-[#9be2cd]">Acesso controlado</p><h1 className="mt-3 font-display text-3xl font-bold leading-tight">Solicite seu acesso ao TST Brasil Hub.</h1><p className="mt-4 text-sm leading-6 text-[#cce6df]">Nesta etapa inicial, cada conta é aprovada manualmente. Isso garante uma entrada organizada e suporte próximo na implantação da sua rotina de SST.</p><div className="mt-9 space-y-5 text-sm text-[#e5f5f0]"><p className="flex gap-3"><Clock3 className="h-5 w-5 shrink-0 text-[#9be2cd]" />Você envia seus dados profissionais.</p><p className="flex gap-3"><KeyRound className="h-5 w-5 shrink-0 text-[#9be2cd]" />O administrador gera suas credenciais de acesso.</p><p className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-[#9be2cd]" />Você entra com o e-mail e senha recebidos.</p></div></section><section className="p-7 sm:p-10">{submitted ? <div className="grid min-h-[420px] place-items-center text-center"><div><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e7f7ef] text-[#18734d]"><CheckCircle2 className="h-7 w-7" /></div><h2 className="mt-5 text-2xl font-bold">Solicitação recebida.</h2><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#668087]">Assim que o administrador liberar sua conta, você receberá as credenciais pelo canal de atendimento combinado.</p><Link href="/"><Button className="mt-7 rounded-xl bg-[#0c7474] text-white hover:bg-[#063b43]">Voltar ao início</Button></Link></div></div> : <form onSubmit={event => { event.preventDefault(); request.mutate(form); }} className="space-y-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#0c8c89]">Pré-cadastro</p><h2 className="mt-2 text-2xl font-bold">Conte um pouco sobre você.</h2><p className="mt-2 text-sm text-[#668087]">Os campos com asterisco são obrigatórios.</p></div><Field label="Nome completo *"><Input value={form.fullName} onChange={e => update("fullName", e.target.value)} required placeholder="Seu nome completo" /></Field><Field label="E-mail profissional *"><Input type="email" value={form.email} onChange={e => update("email", e.target.value)} required placeholder="voce@empresa.com" /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Telefone / WhatsApp"><Input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="(00) 00000-0000" /></Field><Field label="Empresa"><Input value={form.companyName} onChange={e => update("companyName", e.target.value)} placeholder="Nome da empresa" /></Field></div><Field label="Função"><Input value={form.jobTitle} onChange={e => update("jobTitle", e.target.value)} placeholder="Ex.: Técnico de Segurança" /></Field><Button disabled={request.isPending} className="mt-3 h-11 w-full rounded-xl bg-[#0c7474] font-bold text-white hover:bg-[#063b43]">{request.isPending ? "Enviando solicitação..." : "Solicitar acesso"}</Button></form>}</section></div></div></main>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label className="text-xs font-bold uppercase tracking-[.11em] text-[#405c63]">{label}</Label>{children}</div>; }

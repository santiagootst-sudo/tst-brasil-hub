import { useState } from "react";
import { Link, useRoute } from "wouter";
import { BadgeCheck, ClipboardCheck, Clock3, Loader2, MailCheck, PackageCheck, ShieldCheck, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Não informado";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" });
}

export default function EpiReceiptConfirmation() {
  const [, params] = useRoute("/confirmar-epi/:verificationCode");
  const verificationCode = params?.verificationCode ?? "";
  const [otp, setOtp] = useState("");
  const [accepted, setAccepted] = useState(false);
  const evidence = trpc.portal.publicEpiEvidence.useQuery({ verificationCode }, { enabled: verificationCode.length >= 20, retry: false });
  const confirm = trpc.portal.confirmEpiEvidence.useMutation({
    onSuccess: async () => {
      setAccepted(true);
      await evidence.refetch();
      toast.success("Recebimento confirmado e registrado na ficha de EPI.");
    },
    onError: error => toast.error(error.message),
  });

  if (!verificationCode) return <main className="grid min-h-screen place-items-center bg-[#f4f8f7] p-6"><section className="max-w-md rounded-3xl border border-[#f2ccc2] bg-white p-8 text-center shadow-sm"><TriangleAlert className="mx-auto h-10 w-10 text-[#d67845]" /><h1 className="mt-4 text-2xl font-bold text-[#17383e]">Link de confirmação inválido</h1><p className="mt-3 text-sm leading-6 text-[#668087]">Solicite ao responsável pela entrega um novo convite de confirmação.</p></section></main>;
  if (evidence.isLoading) return <main className="grid min-h-screen place-items-center bg-[#f4f8f7]"><Loader2 className="h-9 w-9 animate-spin text-[#0c7474]" /></main>;
  if (!evidence.data || evidence.error) return <main className="grid min-h-screen place-items-center bg-[#f4f8f7] p-6"><section className="max-w-md rounded-3xl border border-[#f2ccc2] bg-white p-8 text-center shadow-sm"><TriangleAlert className="mx-auto h-10 w-10 text-[#d67845]" /><h1 className="mt-4 text-2xl font-bold text-[#17383e]">Confirmação indisponível</h1><p className="mt-3 text-sm leading-6 text-[#668087]">{evidence.error?.message ?? "Este convite não foi encontrado, expirou ou não está mais disponível."}</p></section></main>;

  const data = evidence.data;
  const confirmed = data.status === "confirmed" || accepted;
  const expired = data.status === "expired" || data.status === "revoked";

  return <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#ddf3ec,_transparent_38%),linear-gradient(180deg,_#f4f8f7_0%,_#eef6f4_100%)] px-4 py-8 sm:px-6"><section className="mx-auto max-w-2xl overflow-hidden rounded-[2rem] border border-[#d6e8e3] bg-white shadow-[0_24px_70px_rgba(23,56,62,.13)]"><header className="bg-gradient-to-br from-[#075f65] via-[#0c7474] to-[#1c9a8d] px-7 py-8 text-white"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#baf0e4]">TST BRASIL HUB · NR-06</p><h1 className="mt-2 text-2xl font-bold">Confirmação de recebimento de EPI</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#e2faf4]">Confira a ficha, as orientações e confirme somente se o equipamento foi efetivamente recebido.</p></div><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15"><ShieldCheck className="h-6 w-6" /></span></div></header>
    <div className="space-y-6 p-6 sm:p-8">
      {confirmed ? <div className="rounded-2xl border border-[#b8e5d7] bg-[#effcf7] p-5"><div className="flex gap-3"><BadgeCheck className="h-6 w-6 shrink-0 text-[#098765]" /><div><h2 className="font-bold text-[#075f65]">Recebimento confirmado</h2><p className="mt-1 text-sm leading-6 text-[#40716c]">A ciência do recebimento e das orientações foi registrada em {formatDate(data.confirmedAt)}. A empresa mantém esta ficha e sua trilha de auditoria para consulta.</p></div></div></div> : expired ? <div className="rounded-2xl border border-[#f0d1b7] bg-[#fff8f2] p-5"><div className="flex gap-3"><Clock3 className="h-6 w-6 shrink-0 text-[#d67845]" /><div><h2 className="font-bold text-[#9b531c]">Convite expirado ou bloqueado</h2><p className="mt-1 text-sm leading-6 text-[#8a664b]">Solicite ao responsável pela entrega que envie uma nova confirmação.</p></div></div></div> : <div className="rounded-2xl border border-[#c8e5dd] bg-[#f2fbf8] p-5"><div className="flex gap-3"><MailCheck className="h-6 w-6 shrink-0 text-[#0c7474]" /><div><h2 className="font-bold text-[#075f65]">Código enviado por e-mail</h2><p className="mt-1 text-sm leading-6 text-[#40716c]">Use o código de seis dígitos enviado ao seu e-mail. Este convite expira em {formatDate(data.otpExpiresAt)}.</p></div></div></div>}

      <section className="rounded-2xl border border-[#dcebe8] bg-[#fbfefd] p-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e4f5ef] text-[#0c7474]"><PackageCheck className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-[.12em] text-[#5c8e86]">Ficha congelada</p><h2 className="text-lg font-bold text-[#17383e]">{data.document.epiName}</h2></div></div><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-xs font-bold uppercase tracking-[.1em] text-[#78948f]">Empresa</dt><dd className="mt-1 font-semibold text-[#23454b]">{data.document.companyName}</dd></div><div><dt className="text-xs font-bold uppercase tracking-[.1em] text-[#78948f]">Trabalhador</dt><dd className="mt-1 font-semibold text-[#23454b]">{data.document.employeeName}</dd></div><div><dt className="text-xs font-bold uppercase tracking-[.1em] text-[#78948f]">CA / lote</dt><dd className="mt-1 font-semibold text-[#23454b]">{data.document.caNumber ?? "Não informado"} · {data.document.lotNumber ?? "Não informado"}</dd></div><div><dt className="text-xs font-bold uppercase tracking-[.1em] text-[#78948f]">Quantidade e condição</dt><dd className="mt-1 font-semibold text-[#23454b]">{data.document.quantity} unidade(s) · {data.document.conditionAtDelivery}</dd></div><div><dt className="text-xs font-bold uppercase tracking-[.1em] text-[#78948f]">Entrega registrada</dt><dd className="mt-1 font-semibold text-[#23454b]">{formatDate(data.document.deliveredAt)}</dd></div><div><dt className="text-xs font-bold uppercase tracking-[.1em] text-[#78948f]">Responsável</dt><dd className="mt-1 font-semibold text-[#23454b]">{data.document.deliveredByName ?? "Não informado"}</dd></div></dl>{data.document.orientationTopics && <div className="mt-5 rounded-xl bg-white p-4"><p className="text-xs font-bold uppercase tracking-[.1em] text-[#0c7474]">Orientações registradas</p><p className="mt-2 text-sm leading-6 text-[#456269]">{data.document.orientationTopics}</p></div>}</section>

      {!confirmed && !expired && <section className="rounded-2xl border border-[#dcebe8] p-5"><div className="flex gap-3"><ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#0c7474]" /><div><h2 className="font-bold text-[#17383e]">Confirmar recebimento</h2><p className="mt-1 text-sm leading-6 text-[#668087]">Ao confirmar, você declara que recebeu o EPI identificado nesta ficha e recebeu as orientações acima.</p></div></div><Input value={otp} onChange={event => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="Código de 6 dígitos" className="mt-5 h-12 text-center text-lg font-bold tracking-[.45em]" /><Button disabled={confirm.isPending || otp.length !== 6} onClick={() => confirm.mutate({ verificationCode, otp, receiptConfirmed: true })} className="mt-4 h-11 w-full rounded-xl bg-[#0c7474] text-white hover:bg-[#075f65]"><MailCheck className="mr-2 h-4 w-4" />{confirm.isPending ? "Registrando confirmação..." : "Confirmar recebimento e orientações"}</Button><p className="mt-3 text-center text-xs leading-5 text-[#78948f]">A confirmação registra data/hora, integridade da ficha e o resultado da validação do código. O código não é armazenado em texto.</p></section>}
      <footer className="border-t border-[#e4efed] pt-5 text-center text-xs text-[#78948f]">Código de verificação: {data.documentHash.slice(0, 16).toUpperCase()} · <Link href="/" className="font-semibold text-[#0c7474]">TST BRASIL HUB</Link></footer>
    </div>
  </section></main>;
}

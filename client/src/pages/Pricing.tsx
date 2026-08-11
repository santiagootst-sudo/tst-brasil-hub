import { Check, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const { data: plans, isLoading } = trpc.billing.plans.useQuery();
  const checkout = trpc.billing.checkout.useMutation({
    onSuccess: ({ url }) => { window.open(url, "_blank", "noopener"); toast.success("Abrimos o checkout em uma nova aba."); },
    onError: error => toast.error(error.message),
  });
  const selectPlan = (code: "pgr_pro" | "autonomo" | "empresa", enabled: boolean) => {
    if (!isAuthenticated) return startLogin();
    if (!enabled) return toast.info("O checkout deste plano será liberado assim que o preço recorrente for configurado.");
    checkout.mutate({ planCode: code });
  };

  const cancelled = new URLSearchParams(window.location.search).get("billing") === "cancelled";
  return <main className="min-h-screen bg-[#f7fbfa] px-6 py-10 text-[#102b32] lg:px-8"><div className="mx-auto max-w-7xl"><Link href="/" className="text-sm font-bold text-[#0c7474]">← Portal TST Brasil</Link>{cancelled && <div className="mt-6 rounded-2xl border border-[#f4d4c4] bg-[#fff6f0] px-5 py-4 text-sm text-[#884c32]">A contratação foi cancelada. Nenhuma assinatura foi criada; você pode escolher um plano quando estiver pronto.</div>}<div className="mx-auto mt-12 max-w-3xl text-center"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#0c8c89]">Assinatura mensal</p><h1 className="mt-3 text-5xl font-bold tracking-[-.05em]">Escolha como o Portal TST vai trabalhar com você.</h1><p className="mt-5 text-lg leading-8 text-[#5d7479]">Comece pelo PGR Pro e evolua para a operação autônoma ou interna quando a sua rotina pedir.</p></div><div className="mt-14 grid gap-6 lg:grid-cols-3">{isLoading ? <Loader2 className="mx-auto animate-spin text-[#0c7474]" /> : plans?.map(plan => <article key={plan.code} className={`relative rounded-[1.75rem] border bg-white p-7 shadow-sm ${plan.featured ? "border-[#0c8c89] ring-4 ring-[#d9f1e7]" : "border-[#deece9]"}`}>{plan.featured && <span className="absolute -top-3 left-7 rounded-full bg-[#0c7474] px-3 py-1 text-xs font-bold text-white">Mais completo</span>}<p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">{plan.name}</p><h2 className="mt-4 text-3xl font-bold">{plan.displayPrice}<span className="text-sm font-medium text-[#698187]"> / mês</span></h2><p className="mt-3 min-h-12 text-sm leading-6 text-[#5d7479]">{plan.audience}</p><Button disabled={checkout.isPending} onClick={() => selectPlan(plan.code, plan.checkoutReady)} className="mt-7 w-full rounded-xl bg-[#0c7474] text-white hover:bg-[#063b43]">{checkout.isPending ? "Preparando checkout" : "Escolher plano"}</Button><ul className="mt-7 space-y-3">{plan.features.map(feature => <li key={feature} className="flex gap-2 text-sm text-[#315158]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#39a77e]" />{feature}</li>)}</ul></article>)}</div><p className="mx-auto mt-10 max-w-3xl text-center text-xs leading-5 text-[#6f858a]">A ativação de acesso é confirmada por eventos de pagamento. Os preços e produtos recorrentes podem ser configurados no painel de pagamentos antes do lançamento.</p></div></main>;
}

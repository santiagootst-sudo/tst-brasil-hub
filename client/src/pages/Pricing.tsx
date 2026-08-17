import { useState } from "react";
import { useState, useEffect } from "react";
import { ArrowRight, Check, CircleHelp, Loader2, LockKeyhole, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { LoginModal } from "@/components/LoginModal";

type PlanCode = "mensal" | "trimestral" | "anual";

const cycleLabel: Record<PlanCode, string> = {
  mensal: "Mensal",
  trimestral: "Trimestral",
  anual: "Anual",
};

const cycleNote: Record<PlanCode, string> = {
  mensal: "Comece com flexibilidade e ajuste sua rotina mês a mês.",
  trimestral: "Um ciclo organizado para planejar a operação dos próximos 90 dias.",
  anual: "Mais continuidade para estruturar a gestão de SST durante todo o ano.",
};

const monthlyEquivalent: Record<PlanCode, string> = {
  mensal: "R$ 99,90 por mês após a oferta",
  trimestral: "equivalente a R$ 89,90/mês",
  anual: "Equivale a R$ 74,90/mês — economia de R$ 25,00 por mês",
};

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { data: plans, isLoading } = trpc.billing.plans.useQuery();
  const checkout = trpc.billing.checkout.useMutation({
    onSuccess: ({ url }) => {
      window.open(url, "_blank", "noopener");
      toast.success("Abrimos o checkout seguro em uma nova aba.");
    },
    onError: error => toast.error(error.message),
  });

  useEffect(() => {
    if (isAuthenticated) {
      const pendingPlan = localStorage.getItem("tst_pending_plan") as PlanCode | null;
      if (pendingPlan) {
        localStorage.removeItem("tst_pending_plan");
        toast.success("Autenticação concluída! Abrindo checkout do Stripe...");
        checkout.mutate({ planCode: pendingPlan });
      }
    }
  }, [isAuthenticated]);

  const selectPlan = (code: PlanCode, enabled: boolean) => {
    if (!enabled) {
      toast.info("Este ciclo ainda precisa ser habilitado no ambiente Stripe de teste.");
      return;
    }
    if (!isAuthenticated) {
      localStorage.setItem("tst_pending_plan", code);
      setIsLoginModalOpen(true);
      return;
    }
    checkout.mutate({ planCode: code });
  };

  const cancelled = new URLSearchParams(window.location.search).get("billing") === "cancelled";

  return (
    <main className="min-h-screen bg-[#f7fbfa] px-4 py-8 text-[#102b32] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center text-sm font-bold text-[#0c7474] transition hover:text-[#063b43]">
            ← Portal TST Brasil
          </Link>
          <Button onClick={() => setIsLoginModalOpen(true)} variant="outline" className="rounded-full border-[#0c7474] text-[#0c7474] hover:bg-[#0c7474]/10 font-bold text-xs">
            {isAuthenticated ? "Meu Painel" : "Entrar com e-mail"}
          </Button>
        </div>

        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

        {cancelled && (
          <div className="mt-6 rounded-2xl border border-[#f4d4c4] bg-[#fff6f0] px-5 py-4 text-sm text-[#884c32]">
            A contratação foi cancelada. Nenhuma assinatura foi criada; você pode escolher um ciclo quando estiver pronto.
          </div>
        )}

        <section className="relative mt-10 overflow-hidden rounded-[2rem] bg-[#063b43] px-6 py-10 text-white shadow-[0_24px_80px_rgba(6,59,67,.18)] sm:px-10 lg:px-14 lg:py-14">
          <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#64e1c1]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-[#3173a8]/20 blur-3xl" />
          <div className="relative mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#9ce8cb]/30 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[.16em] text-[#b9f3db]">
              <Sparkles className="h-4 w-4" />
              Oferta de lançamento
            </div>
            <h1 className="mt-5 text-4xl font-bold tracking-[-.05em] sm:text-5xl lg:text-6xl">Escolha o ritmo da sua gestão de SST.</h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
              A mesma plataforma completa para PGR, EPIs, CIPA, biblioteca, treinamentos e certificados. Escolha apenas o ciclo que combina com o seu planejamento.
            </p>
          </div>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full grid min-h-56 place-items-center rounded-3xl border border-[#dcebe8] bg-white">
              <Loader2 className="h-7 w-7 animate-spin text-[#0c7474]" />
            </div>
          ) : plans?.map(plan => {
            const code = plan.code as PlanCode;
            const isFeatured = plan.featured;
            return (
              <article key={plan.code} className={`relative flex flex-col rounded-[1.75rem] border bg-white p-6 shadow-[0_12px_36px_rgba(19,76,76,.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(19,76,76,.12)] sm:p-7 ${isFeatured ? "border-[#0c8c89] ring-4 ring-[#d9f1e7]" : "border-[#deece9]"}`}>
                {isFeatured && <span className="absolute -top-3 left-7 rounded-full bg-[#0c7474] px-3 py-1 text-xs font-bold text-white shadow-sm">Mais escolhido</span>}
                {code === "anual" && <span className="pricing-badge-pulse absolute -top-3 right-7 rounded-full border border-[#d6a84f]/40 bg-[#f4c76b] px-3 py-1 text-xs font-bold text-[#5a3d0e] shadow-sm">Melhor Opção</span>}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">{cycleLabel[code]}</p>
                    <h2 className="mt-2 text-2xl font-bold tracking-[-.03em]">{plan.name}</h2>
                  </div>
                  <span className="rounded-xl bg-[#eff9f4] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.08em] text-[#0c7474]">{code === "mensal" ? "flexível" : code === "trimestral" ? "90 dias" : "12 meses"}</span>
                </div>
                <p className="mt-4 min-h-12 text-sm leading-6 text-[#5d7479]">{cycleNote[code]}</p>
                <div className="mt-6 rounded-2xl border border-[#dcebe8] bg-[#f8fcfa] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#66827c]">Oferta de lançamento</p>
                  <p className="mt-2 text-2xl font-bold tracking-[-.04em] text-[#102b32]">{plan.promotionDisplayPrice}</p>
                  <div className="my-4 h-px bg-[#deece9]" />
                  <p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#66827c]">Após a promoção</p>
                  <p className="mt-2 text-lg font-bold text-[#0c7474]">{plan.recurringDisplayPrice}</p>
                  <p className="mt-1 text-xs text-[#78928d]">{monthlyEquivalent[code]}</p>
                </div>
                <Button disabled={checkout.isPending} onClick={() => selectPlan(code, plan.checkoutReady)} className={`mt-6 w-full rounded-xl text-white transition active:scale-[.98] ${isFeatured ? "bg-[#0c7474] hover:bg-[#063b43]" : "bg-[#3173a8] hover:bg-[#235882]"}`}>
                  {checkout.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                  {checkout.isPending ? "Preparando checkout" : `Escolher plano ${cycleLabel[code]}`}
                </Button>
                <ul className="mt-7 space-y-3 border-t border-[#e5f0ed] pt-6">
                  {plan.features.map(feature => <li key={feature} className="flex gap-2 text-sm leading-5 text-[#315158]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#39a77e]" />{feature}</li>)}
                </ul>
              </article>
            );
          })}
        </section>

        <section className="mt-10 overflow-hidden rounded-[1.75rem] border border-[#dcebe8] bg-white shadow-sm">
          <div className="border-b border-[#e5f0ed] px-5 py-6 sm:px-7">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Compare os ciclos</p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-.03em]">Uma tabela simples para decidir com segurança.</h2>
          </div>
          <div className="grid gap-px bg-[#e5f0ed] md:grid-cols-3">
            {plans?.map(plan => {
              const code = plan.code as PlanCode;
              return <div key={`compare-${plan.code}`} className="bg-white p-5 sm:p-7"><p className="text-sm font-bold text-[#102b32]">{cycleLabel[code]}</p><p className="mt-4 text-xs font-bold uppercase tracking-[.12em] text-[#66827c]">Oferta de lançamento</p><p className="mt-2 text-lg font-bold text-[#315158]">{plan.promotionDisplayPrice}</p><p className="mt-5 text-xs font-bold uppercase tracking-[.12em] text-[#66827c]">Após a promoção</p><p className="mt-2 text-lg font-bold text-[#0c7474]">{plan.recurringDisplayPrice}</p></div>;
            })}
          </div>
        </section>

        <section className="mx-auto mt-8 grid max-w-4xl gap-3 text-center text-xs text-[#6f858a] sm:grid-cols-3">
          <p className="flex items-center justify-center gap-2"><LockKeyhole className="h-4 w-4 text-[#0c7474]" />Checkout protegido pelo Stripe</p>
          <p className="flex items-center justify-center gap-2"><CircleHelp className="h-4 w-4 text-[#0c7474]" />Suporte para escolher o ciclo</p>
          <p className="flex items-center justify-center gap-2"><Check className="h-4 w-4 text-[#0c7474]" />Acesso aos mesmos módulos</p>
        </section>

        <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-5 text-[#78928d]">A oferta mensal aplica R$ 69,90 apenas na primeira cobrança e depois passa a R$ 99,90/mês. Os ciclos trimestral e anual mantêm os valores apresentados nas cobranças seguintes, conforme o plano selecionado.</p>
      </div>
    </main>
  );
}

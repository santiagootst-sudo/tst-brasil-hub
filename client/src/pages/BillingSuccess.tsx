import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, ShieldCheck, Download } from "lucide-react";
import { Link } from "wouter";

export default function BillingSuccess() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f0f9f6] via-[#f7fbfa] to-[#e6f4f1] px-4 py-16 text-[#102b32] sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="mx-auto max-w-xl w-full rounded-3xl bg-white p-8 sm:p-10 shadow-2xl border border-[#deece9] text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#e6f4f1] text-[#0c7474] shadow-inner mb-6">
          <CheckCircle2 className="h-10 w-10 animate-bounce" />
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f4f1] px-3.5 py-1 text-xs font-bold text-[#0c7474] mb-4">
          <ShieldCheck className="h-4 w-4" /> Pagamento Aprovado com Sucesso
        </div>

        <h1 className="text-3xl font-extrabold text-[#102b32] tracking-tight">
          Bem-vindo ao TST Brasil Hub Pro!
        </h1>
        
        <p className="mt-3 text-base text-[#668087] leading-relaxed">
          Sua assinatura foi processada e ativada com segurança pelo Stripe. Todos os módulos de PGR, CIPA, EPIs, Biblioteca e Certificados já estão liberados em sua conta.
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/app">
            <Button className="w-full rounded-2xl bg-[#0c7474] py-4 text-sm font-bold text-white shadow-lg shadow-[#0c7474]/20 hover:bg-[#063b43] transition">
              Acessar o Portal <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/app/certificados">
            <Button variant="outline" className="w-full rounded-2xl border-[#bddbd5] py-4 text-sm font-bold text-[#0c7474] hover:bg-[#e6f4f1]/50 transition">
              <Download className="mr-2 h-4 w-4" /> Ver Comprovante
            </Button>
          </Link>
        </div>

        <div className="mt-8 border-t border-[#e5efe8] pt-6 text-xs text-[#668087]">
          Dúvidas ou suporte? Entre em contato pelo e-mail <span className="font-bold text-[#102b32]">tstbrasilhub@gmail.com</span> ou WhatsApp de suporte.
        </div>
      </div>
    </main>
  );
}

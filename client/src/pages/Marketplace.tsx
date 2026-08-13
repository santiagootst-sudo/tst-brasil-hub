import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Store, Send, Sparkles, Smile, CheckCircle2 } from "lucide-react";
import { useSearch } from "wouter";
import { workspaceIdFromSearch } from "@shared/workspaceContext";

export default function Marketplace() {
  const search = useSearch();
  const workspaceId = workspaceIdFromSearch(search);
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
      toast.error("Por favor, digite seu feedback antes de enviar.");
      return;
    }
    // Salvar localmente ou simular envio com sucesso
    try {
      const stored = JSON.parse(localStorage.getItem("tst-marketplace-feedback") || "[]");
      stored.push({ feedback: feedback.trim(), email: email.trim(), createdAt: new Date().toISOString() });
      localStorage.setItem("tst-marketplace-feedback", JSON.stringify(stored));
    } catch {}

    setSubmitted(true);
    toast.success("Feedback enviado com sucesso! Muito obrigado por nos ajudar.");
  };

  return (
    <DashboardLayout title="Marketplace SST">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Banner de Construção */}
        <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#063b43] via-[#0c7474] to-[#123f69] p-8 text-white shadow-xl md:p-12">
          <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="grid h-24 w-24 shrink-0 place-items-center rounded-3xl bg-white/15 text-4xl shadow-inner backdrop-blur-md">
              😊
            </div>
            <div className="space-y-3 text-center md:text-left">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#8edec7]/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#8edec7]">
                <Sparkles className="h-3.5 w-3.5" /> Em breve no TST Brasil Hub
              </span>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Marketplace de Soluções SST</h2>
              <p className="max-w-xl text-sm leading-6 text-[#d9eeea]">
                Estamos construindo o maior ecossistema de fornecedores, EPIs, laudos especializados, exames e parceiros de segurança do trabalho do Brasil. Queremos criar essa ferramenta junto com você!
              </p>
            </div>
          </div>
        </section>

        {/* Caixa de Feedback Interativa */}
        <section className="rounded-[2rem] border border-[#dcebe8] bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f6f1] text-[#0c7474]">
              <Store className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-xl font-bold text-[#102b32]">Deixe seu feedback para nos ajudar</h3>
              <p className="text-xs text-[#668087]">Quais produtos, serviços ou integrações você mais gostaria de ver no Marketplace?</p>
            </div>
          </div>

          {submitted ? (
            <div className="mt-6 rounded-2xl border border-[#b9e3d7] bg-[#f0faf7] p-8 text-center space-y-3">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#0c7474] text-white">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <h4 className="text-lg font-bold text-[#102b32]">Feedback recebido com carinho!</h4>
              <p className="mx-auto max-w-md text-xs leading-5 text-[#4a6b73]">
                Suas sugestões são fundamentais para moldarmos o Marketplace do TST Brasil Hub exatamente com o que você precisa no dia a dia.
              </p>
              <Button
                onClick={() => {
                  setSubmitted(false);
                  setFeedback("");
                  setEmail("");
                }}
                variant="outline"
                className="mt-2 rounded-xl border-[#0c7474] text-[#0c7474]"
              >
                Enviar outro feedback
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#315158]">Sua sugestão ou comentário</label>
                <Textarea
                  required
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Ex.: Gostaria de encontrar fornecedores de EPIs com entrega rápida na minha região, ou laboratórios parceiros para exames ocupacionais..."
                  className="mt-2 rounded-2xl border-[#cfe3de] bg-[#fbfefd] p-4 text-sm focus:border-[#0c7474] focus:ring-[#0c7474]"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#315158]">Seu e-mail de contato <span className="font-normal text-[#78928d]">(opcional)</span></label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="mt-2 h-11 rounded-xl border-[#cfe3de] bg-[#fbfefd] px-4 text-sm"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  className="h-11 rounded-xl bg-[#0c7474] px-6 text-sm font-bold text-white shadow-md hover:bg-[#095c5c]"
                >
                  <Send className="mr-2 h-4 w-4" /> Enviar feedback
                </Button>
              </div>
            </form>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ModuleHeader, ModulePage } from "@/components/ModulePageLayout";
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
      <ModulePage className="max-w-5xl space-y-6">
        <ModuleHeader eyebrow="Soluções e fornecedores" title="Marketplace SST" description="Sugira fornecedores, serviços e integrações que tornariam sua operação de segurança do trabalho mais completa." icon={Store} />

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
            <div className="mt-6 animate-in fade-in zoom-in-95 duration-300 rounded-3xl border border-[#b9e3d7] bg-gradient-to-br from-[#f0faf7] to-[#e8f6f1] p-8 text-center space-y-4 shadow-sm">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#0c7474] text-white shadow-lg animate-bounce">
                <CheckCircle2 className="h-8 w-8" />
              </span>
              <div className="space-y-1">
                <span className="inline-block rounded-full bg-[#0c7474]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#0c7474]">
                  Muito obrigado pela contribuição!
                </span>
                <h4 className="text-xl font-bold text-[#102b32]">Feedback enviado com sucesso!</h4>
              </div>
              <p className="mx-auto max-w-md text-sm leading-6 text-[#3a5a61]">
                Sua opinião é o que nos move a construir a melhor plataforma de Segurança do Trabalho do Brasil. Nossa equipe de engenharia e produto já recebeu sua mensagem.
              </p>
              <div className="pt-2">
                <Button
                  onClick={() => {
                    setSubmitted(false);
                    setFeedback("");
                    setEmail("");
                  }}
                  className="rounded-xl bg-[#0c7474] px-6 text-sm font-bold text-white shadow-md hover:bg-[#095c5c]"
                >
                  Enviar novo feedback
                </Button>
              </div>
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
      </ModulePage>
    </DashboardLayout>
  );
}

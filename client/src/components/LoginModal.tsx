import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { startLogin, isOAuthConfigured } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Shield, Sparkles, X, Mail, Loader2 } from "lucide-react";

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const utils = trpc.useUtils();
  const directLoginMutation = trpc.auth.directLogin.useMutation({
    onSuccess: () => {
      setIsSubmitting(false);
      toast.success("Login efetuado com sucesso!");
      utils.auth.me.invalidate();
      const isMaster = emailInput.trim().toLowerCase() === "santiagoocorretor@gmail.com";
      if (isMaster) {
        localStorage.removeItem("tst_pending_plan");
        window.location.assign("/app");
        return;
      }
      const pendingPlan = localStorage.getItem("tst_pending_plan");
      if (pendingPlan) {
        window.location.assign("/planos");
      } else {
        window.location.assign("/app");
      }
    },
    onError: (err) => {
      setIsSubmitting(false);
      toast.error(err.message || "Erro ao entrar.");
    }
  });

  if (!isOpen) return null;

  const handleOAuthLogin = () => {
    if (isOAuthConfigured()) {
      startLogin();
    } else {
      toast.info("O servidor de autenticação externo não está configurado neste ambiente de teste.");
    }
  };

  const handleMasterLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      toast.error("Informe seu e-mail de acesso.");
      return;
    }
    if (!passwordInput.trim()) {
      toast.error("Informe sua senha de acesso.");
      return;
    }
    setIsSubmitting(true);
    directLoginMutation.mutate({ email: emailInput.trim(), password: passwordInput.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl border border-[#deece9] overflow-hidden">
        {isSubmitting && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 backdrop-blur-xs transition-all animate-in fade-in duration-300">
            <div className="relative flex items-center justify-center">
              <div className="absolute h-16 w-16 rounded-full border-4 border-[#0c7474]/20 border-t-[#0c7474] animate-spin"></div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0c7474] text-white shadow-md">
                <Shield className="h-5 w-5 animate-pulse" />
              </div>
            </div>
            <p className="mt-4 text-sm font-bold text-[#102b32] animate-pulse">Autenticando credenciais...</p>
            <p className="mt-1 text-xs text-[#668087]">Configurando ambiente seguro SST</p>
          </div>
        )}
        <button 
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e6f4f1] text-[#0c7474]">
            <Shield className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-2xl font-bold text-[#102b32]">Acessar Portal TST</h3>
          <p className="mt-2 text-sm text-[#668087]">
            Entre com seu e-mail ou utilize o acesso rápido de administrador mestre.
          </p>
        </div>

        <form onSubmit={handleMasterLogin} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email" className="text-xs font-bold uppercase tracking-wider text-[#405c63]">
              E-mail de Acesso
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#668087]" />
              <Input
                id="login-email"
                type="email"
                placeholder="seu.email@empresa.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="rounded-xl border-[#bddbd5] pl-10 py-3 text-sm focus:border-[#0c7474] focus:ring-[#0c7474]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-password" className="text-xs font-bold uppercase tracking-wider text-[#405c63]">
              Senha de Acesso
            </Label>
            <div className="relative">
              <Shield className="absolute left-3.5 top-3.5 h-4 w-4 text-[#668087]" />
              <Input
                id="login-password"
                type="password"
                placeholder="Digite sua senha"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="rounded-xl border-[#bddbd5] pl-10 py-3 text-sm focus:border-[#0c7474] focus:ring-[#0c7474]"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#0c7474] py-3 text-sm font-bold text-white shadow-lg shadow-[#0c7474]/20 hover:bg-[#063b43] transition flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Autenticando e gerando sessão...</span>
              </>
            ) : (
              "Continuar para o Portal"
            )}
          </Button>
        </form>

        <div className="mt-6 border-t border-[#e5efe8] pt-5 text-center">
          <p className="text-xs text-[#668087]">
            É profissional de SST ou empresa parceira?
          </p>
          <button
            type="button"
            onClick={handleOAuthLogin}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#0c7474] hover:underline"
          >
            <Sparkles className="h-3.5 w-3.5" /> Entrar via Servidor Seguro OAuth
          </button>
        </div>
      </div>
    </div>
  );
}

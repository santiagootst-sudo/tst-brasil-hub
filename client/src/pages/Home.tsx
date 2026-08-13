import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BrandLockup } from "@/components/BrandLockup";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  FileCheck2,
  HelpCircle,
  Mail,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

const steps = [
  { num: "01", title: "Crie a sua conta", text: "Cadastre-se rapidamente para desbloquear o acesso aos ambientes especializados de gestão em segurança do trabalho." },
  { num: "02", title: "Escolha o seu contexto", text: "Selecione entre Prestador de serviço para gerenciar sua carteira e PGR, ou Empresa para a rotina corporativa." },
  { num: "03", title: "Use as ferramentas", text: "Tenha em mãos PGR integrado, controle de EPIs com CA, certificados com QR Code, inspeções e suporte contínuo." },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const [selectedHub, setSelectedHub] = useState<"prestador" | "empresa">("prestador");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactSubject, setContactSubject] = useState("Suporte");
  const [contactMessage, setContactMessage] = useState("");
  const [isSendingContact, setIsSendingContact] = useState(false);

  const enter = () => {
    if (isAuthenticated) setLocation("/app");
    else startLogin();
  };

  const handleContactSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      toast.error("Preencha todos os campos obrigatórios para enviar sua mensagem.");
      return;
    }
    setIsSendingContact(true);
    setTimeout(() => {
      setIsSendingContact(false);
      toast.success(`Mensagem sobre "${contactSubject}" enviada com sucesso! Responderemos em breve.`);
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setContactSubject("Suporte");
      setContactMessage("");
    }, 900);
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-[#091e22]">
      {/* Top Navbar */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8 bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-[#e5efe8]">
        <Link href="/" className="flex items-center">
          <BrandLockup aria-label="TST Brasil Hub" />
        </Link>
        <div className="hidden items-center gap-8 text-sm font-semibold text-[#405c63] md:flex">
          <a href="#beneficios" className="hover:text-[#0c7474]">Benefícios</a>
          <a href="#produto" className="hover:text-[#0c7474]">Ecossistema</a>
          <Link href="/planos" className="hover:text-[#0c7474]">Planos</Link>
          <a href="#como-funciona" className="hover:text-[#0c7474]">Como Funciona</a>
          <a href="#faq" className="hover:text-[#0c7474]">FAQ</a>
          <a href="#contato" className="hover:text-[#0c7474]">Contato e Suporte</a>
        </div>
        <Button onClick={enter} className="rounded-full bg-[#0c7474] px-7 py-2.5 text-sm text-white hover:bg-[#063b43] font-bold shadow-md shadow-[#0c7474]/15">
          {loading ? "Carregando" : isAuthenticated ? "Acessar portal" : "Portal de Acesso"}
        </Button>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#072d32] via-[#0b484e] to-[#0c7474] text-white py-20 lg:py-28">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-[#14a095]/30 blur-[140px] pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-[#39a77e]/20 blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10 grid gap-12 lg:grid-cols-[1.1fr_.9fr] items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#48c7b8]/40 bg-[#063b43]/60 px-4 py-2 text-xs font-bold text-[#88ddc4] backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" /> TST Brasil Hub · Ecossistema completo de SST
            </span>
            <h1 className="mt-6 font-display text-4xl sm:text-6xl font-extrabold leading-[1.08] tracking-[-.03em] text-white">
              A PLATAFORMA PARA PROFISSIONAIS DE <span className="text-[#64e2d1]">SST QUE QUEREM EVOLUIR</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#d0e6e1]">
              Unifique a gestão de PGR, LTCAT, CIPA, EPIs, exames ocupacionais, biblioteca técnica e certificados profissionais com QR Code em um único portal moderno e seguro.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Button onClick={enter} size="lg" className="h-14 rounded-2xl bg-[#0c7474] px-8 text-base text-white hover:bg-[#095a5a] shadow-xl shadow-black/20 border border-[#23b3a6]/40">
                Acessar Plataforma <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Link href="/planos" className="inline-flex h-14 items-center justify-center rounded-2xl border-2 border-[#64e2d1]/40 bg-white/10 px-8 text-sm font-bold text-white hover:bg-white/20 backdrop-blur-sm">
                Explorar Planos
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-[#bce3dc]">
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#48c7b8]" /> PGR e Documentos Legais</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#48c7b8]" /> Certificados com QR Code</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#48c7b8]" /> Suporte e Treinamentos</span>
            </div>
          </div>

          {/* Workspace Hub Aprimorado com Hover Suave, Seleção e CTAs */}
          <div className="rounded-[2.5rem] border border-white/20 bg-white p-7 text-[#0d2227] shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-[#eaf2ef] pb-5">
              <div className="flex items-center gap-3">
                <BrandLockup compact aria-label="TST Brasil Hub" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#0c8c89]">Workspace Hub</span>
                  <h3 className="text-base font-bold text-[#0d2227]">Escolha seu ambiente de trabalho</h3>
                </div>
              </div>
              <BadgeCheck className="h-6 w-6 text-[#0c7474]" />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div
                onClick={() => setSelectedHub("prestador")}
                onMouseEnter={() => setSelectedHub("prestador")}
                className={`group cursor-pointer rounded-2xl border p-5 transition-all duration-300 transform hover:-translate-y-1 ${
                  selectedHub === "prestador"
                    ? "border-[#c68b48] bg-gradient-to-b from-[#fbf6f0] to-[#f7f0e8] ring-2 ring-[#c68b48]/40 shadow-xl"
                    : "border-[#e5d5c5] bg-[#fbf6f0]/50 hover:border-[#c68b48] hover:shadow-md"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c68b48]/15 text-[#a46d32]">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <span className="rounded-md bg-[#f3e4d4] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.1em] text-[#915a24]">Prestador</span>
                </div>
                <h4 className="text-lg font-bold text-[#0d2227]">Preste serviços.</h4>
                <p className="mt-1 text-xs leading-5 text-[#526b73]">Gerenciamento de carteira de clientes, PGR, visitas e acervo documental unificado.</p>
                <Button
                  onClick={enter}
                  className="mt-5 w-full rounded-xl bg-[#a46d32] text-white text-xs font-bold hover:bg-[#855523] shadow-sm"
                >
                  Acessar Prestador <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>

              <div
                onClick={() => setSelectedHub("empresa")}
                onMouseEnter={() => setSelectedHub("empresa")}
                className={`group cursor-pointer rounded-2xl border p-5 transition-all duration-300 transform hover:-translate-y-1 ${
                  selectedHub === "empresa"
                    ? "border-[#0c7474] bg-gradient-to-b from-[#f0f9f8] to-[#eaf5f3] ring-2 ring-[#0c7474]/40 shadow-xl"
                    : "border-[#cce5e0] bg-[#f0f9f8]/50 hover:border-[#0c7474] hover:shadow-md"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0c7474]/15 text-[#0c7474]">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <span className="rounded-md bg-[#d9f1e7] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.1em] text-[#0c7474]">Empresa</span>
                </div>
                <h4 className="text-lg font-bold text-[#0d2227]">Cuide da rotina.</h4>
                <p className="mt-1 text-xs leading-5 text-[#526b73]">Controle operacional de EPIs com CA, CIPA, exames ASO, inspeções e planos de ação.</p>
                <Button
                  onClick={enter}
                  className="mt-5 w-full rounded-xl bg-[#0c7474] text-white text-xs font-bold hover:bg-[#063b43] shadow-sm"
                >
                  Acessar Empresa <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção Detalhada de Benefícios e Recursos por Perfil */}
      <section id="beneficios" className="py-20 bg-white border-b border-[#e1ede8]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[.18em] text-[#0c8c89]">Recursos sob medida</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-[-.03em] text-[#0d2227]">
              Benefícios exclusivos para cada modelo de atuação.
            </h2>
            <p className="mt-4 text-base text-[#526b73]">
              Seja prestando consultoria para múltiplas empresas ou gerindo a segurança interna de uma organização, o TST Brasil Hub entrega a ferramenta certa.
            </p>
          </div>

          <div className="mt-16 grid gap-10 lg:grid-cols-2">
            {/* Bloco Prestador de Serviço */}
            <div className="rounded-3xl border border-[#d2a366]/30 bg-gradient-to-b from-[#fbf6f0] to-white p-8 shadow-sm">
              <div className="flex items-center gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f3e4d4] text-[#915a24]">
                  <Briefcase className="h-6 w-6" />
                </span>
                <div>
                  <span className="text-xs font-bold uppercase tracking-[.15em] text-[#915a24]">Para Prestadores de Serviço</span>
                  <h3 className="text-2xl font-bold text-[#0d2227]">Gestão ágil de carteira e clientes</h3>
                </div>
              </div>
              <ul className="mt-8 space-y-4 text-sm text-[#405c63]">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#915a24] shrink-0 mt-0.5" />
                  <span><b>Multi-empresas isoladas:</b> Gerencie diferentes clientes e filiais sem misturar dados ou logos.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#915a24] shrink-0 mt-0.5" />
                  <span><b>Gerador de PGR e LTCAT:</b> Crie documentações técnicas profissionais com exportação instantânea em PDF.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#915a24] shrink-0 mt-0.5" />
                  <span><b>Agenda de visitas e contratos:</b> Acompanhe status de visitas, honorários e entregas de forma centralizada.</span>
                </li>
              </ul>
              <div className="mt-8 pt-6 border-t border-[#f3e4d4]">
                <Button onClick={enter} className="rounded-xl bg-[#a46d32] text-white font-bold hover:bg-[#855523] px-6">
                  Começar como Prestador <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Bloco Empresa */}
            <div className="rounded-3xl border border-[#0c7474]/30 bg-gradient-to-b from-[#f0f9f8] to-white p-8 shadow-sm">
              <div className="flex items-center gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#d9f1e7] text-[#0c7474]">
                  <Building2 className="h-6 w-6" />
                </span>
                <div>
                  <span className="text-xs font-bold uppercase tracking-[.15em] text-[#0c8c89]">Para Empresas e Corporativo</span>
                  <h3 className="text-2xl font-bold text-[#0d2227]">Controle total da rotina interna</h3>
                </div>
              </div>
              <ul className="mt-8 space-y-4 text-sm text-[#405c63]">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#0c7474] shrink-0 mt-0.5" />
                  <span><b>Controle avançado de EPIs:</b> Estoque mínimo, CA, validades, fichas individuais e aceite digital.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#0c7474] shrink-0 mt-0.5" />
                  <span><b>Inspeções e Planos de Ação:</b> Checklists reutilizáveis por setor e acompanhamento de pendências críticas.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#0c7474] shrink-0 mt-0.5" />
                  <span><b>Treinamentos e Indicadores:</b> Acompanhe capacitações, ocorrências SST e conformidade em tempo real.</span>
                </li>
              </ul>
              <div className="mt-8 pt-6 border-t border-[#d9f1e7]">
                <Button onClick={enter} className="rounded-xl bg-[#0c7474] text-white font-bold hover:bg-[#063b43] px-6">
                  Começar como Empresa <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Destaques / Ecossistema Completo */}
      <section id="produto" className="bg-[#f8fcfb] py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[.18em] text-[#0c8c89]">Ecossistema integrado</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-[-.03em] text-[#0d2227]">
              Muito mais que PGR: um ecossistema completo de SST.
            </h2>
            <p className="mt-4 text-base text-[#526b73]">
              O TST Brasil Hub unifica todas as ferramentas críticas da segurança do trabalho em uma única interface intuitiva, segura e com suporte robusto.
            </p>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            <article className="rounded-3xl border border-[#e1ede8] bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f6f1] text-[#0c7474] mb-6">
                <FileCheck2 className="h-6 w-6" />
              </span>
              <h3 className="text-xl font-bold text-[#0d2227]">Gerador de PGR e Certificados NR</h3>
              <p className="mt-3 text-sm leading-6 text-[#526b73]">
                Crie documentos técnicos, ordens de serviço e certificados profissionais frente e verso com QR Code de autenticidade e upload de assinatura digital.
              </p>
            </article>

            <article className="rounded-3xl border border-[#e1ede8] bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f6f1] text-[#0c7474] mb-6">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <h3 className="text-xl font-bold text-[#0d2227]">CIPA, EPIs e Saúde Ocupacional</h3>
              <p className="mt-3 text-sm leading-6 text-[#526b73]">
                Monitore o dimensionamento da CIPA, fichas de EPI com controle de CA e assinatura digital via QR Code, além do controle de exames e ASOs periódicos.
              </p>
            </article>

            <article className="rounded-3xl border border-[#e1ede8] bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f6f1] text-[#0c7474] mb-6">
                <BookOpen className="h-6 w-6" />
              </span>
              <h3 className="text-xl font-bold text-[#0d2227]">Biblioteca e Riscos COPSOQ</h3>
              <p className="mt-3 text-sm leading-6 text-[#526b73]">
                Consulte normas regulamentadoras atualizadas, armazene materiais didáticos e aplique questionários psicossociais com transferência automática para o PGR.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Seção de Passos */}
      <section id="como-funciona" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="rounded-[2.5rem] bg-[#072d32] px-8 py-14 text-white lg:px-16 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#14a095]/20 blur-[100px] pointer-events-none" />
          <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr] items-center relative z-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-[.18em] text-[#88ddc4]">Próximo passo</span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-[-.03em] leading-tight text-white">
                A sua operação SST não precisa caber em ferramentas desconectadas.
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#c5e5df]">
                Conecte todas as frentes da sua atuação profissional em um ecossistema unificado, seguro e pronto para o futuro.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {steps.map(step => (
                <div key={step.num} className="rounded-2xl bg-white/5 p-6 border border-white/15 backdrop-blur-md">
                  <span className="text-3xl font-extrabold text-[#88ddc4]">{step.num}</span>
                  <h4 className="mt-4 text-base font-bold text-white">{step.title}</h4>
                  <p className="mt-2 text-xs leading-5 text-[#c5e5df]">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Perguntas Frequentes (FAQ) */}
      <section id="faq" className="py-20 bg-[#f8fcfb] border-t border-[#e1ede8]">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[.18em] text-[#0c8c89]">Tire suas dúvidas</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-[-.03em] text-[#0d2227]">
              Perguntas Frequentes sobre o TST Brasil Hub
            </h2>
            <p className="mt-4 text-base text-[#526b73]">
              Tudo o que você precisa saber sobre os ambientes especializados, emissão de PGR, certificados com QR Code e suporte operacional.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-[#dcebe8] bg-white p-7 shadow-sm">
              <h3 className="text-lg font-bold text-[#0d2227]">Qual a diferença entre os perfis Prestador e Empresa?</h3>
              <p className="mt-3 text-sm leading-6 text-[#526b73]">
                O perfil <b>Prestador de Serviço</b> é voltado ao TST autônomo ou consultorias que gerenciam múltiplos clientes, carteiras de empresas, PGRs e agendas. O perfil <b>Empresa</b> é focado na rotina interna corporativa, controlando EPIs com CA, CIPA, exames ocupacionais e inspeções de uma única organização.
              </p>
            </div>

            <div className="rounded-3xl border border-[#dcebe8] bg-white p-7 shadow-sm">
              <h3 className="text-lg font-bold text-[#0d2227]">Como funciona o gerador de certificados com QR Code?</h3>
              <p className="mt-3 text-sm leading-6 text-[#526b73]">
                O gerador permite emitir certificados frente e verso para as principais NRs (como NR-05, NR-10, NR-20, NR-33 e NR-35). Ele inclui conteúdo programático editável, modelos salvos, upload de assinatura digital e gera um QR Code real no verso para validação de autenticidade.
              </p>
            </div>

            <div className="rounded-3xl border border-[#dcebe8] bg-white p-7 shadow-sm">
              <h3 className="text-lg font-bold text-[#0d2227]">Posso testar a plataforma antes de assinar?</h3>
              <p className="mt-3 text-sm leading-6 text-[#526b73]">
                Sim! Você pode explorar todos os ambientes, cadastrar empresas de teste, emitir documentos e testar os fluxos do sistema. Os checkouts de plano em sandbox simulam transações reais de forma gratuita.
              </p>
            </div>

            <div className="rounded-3xl border border-[#dcebe8] bg-white p-7 shadow-sm">
              <h3 className="text-lg font-bold text-[#0d2227]">Como aciono o suporte em caso de dúvidas na rotina?</h3>
              <p className="mt-3 text-sm leading-6 text-[#526b73]">
                Disponibilizamos um botão flutuante de WhatsApp em todas as telas da plataforma para atendimento rápido, além do e-mail de suporte dedicado, telefone e o formulário de contato abaixo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Contato, Dúvidas e Suporte */}
      <section id="contato" className="py-20 bg-white border-t border-[#e1ede8]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-[.18em] text-[#0c8c89]">Atendimento dedicado</span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-[-.03em] text-[#0d2227]">
                Precisa de ajuda, demonstração ou orientação sobre o funcionamento?
              </h2>
              <p className="mt-4 text-base leading-7 text-[#526b73]">
                Nossa equipe de especialistas em segurança do trabalho está pronta para esclarecer suas dúvidas, demonstrar o funcionamento dos módulos e apoiar sua transição para o TST Brasil Hub.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-4 rounded-2xl border border-[#e1ede8] bg-[#f8fcfb] p-4">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0c7474]/10 text-[#0c7474]">
                    <Mail className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#78928d]">E-mail de suporte</p>
                    <p className="text-sm font-bold text-[#0d2227]">suporte@tstbrasilhub.com.br</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-[#e1ede8] bg-[#f8fcfb] p-4">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0c7474]/10 text-[#0c7474]">
                    <PhoneCall className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#78928d]">Atendimento telefônico e WhatsApp</p>
                    <p className="text-sm font-bold text-[#0d2227]">(54) 99909-7610 · Seg a Sex das 8h às 18h</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-[#e1ede8] bg-[#f8fcfb] p-4">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0c7474]/10 text-[#0c7474]">
                    <HelpCircle className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#78928d]">Base de conhecimento</p>
                    <p className="text-sm font-bold text-[#0d2227]">Manuais, guias das NRs e tutoriais em vídeo no portal</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulário de Contato por E-mail */}
            <div className="rounded-[2.5rem] border border-[#dcebe8] bg-[#f8fcfb] p-8 lg:p-10 shadow-lg">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0c7474]/10 px-3 py-1 text-[11px] font-bold text-[#0c7474]">
                <Mail className="h-3.5 w-3.5" /> Atendimento por e-mail
              </span>
              <h3 className="mt-3 text-2xl font-bold text-[#0d2227]">Envie suas dúvidas por e-mail</h3>
              <p className="mt-2 text-xs leading-5 text-[#526b73]">
                Prefere escrever detalhadamente? Preencha os campos abaixo. Nossa equipe responderá diretamente na sua caixa de entrada em até 2 horas úteis.
              </p>

              <form onSubmit={handleContactSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#315158]">Seu nome *</label>
                  <Input
                    required
                    value={contactName}
                    onChange={event => setContactName(event.target.value)}
                    placeholder="Nome completo"
                    className="mt-1.5 h-11 rounded-xl border-[#d5e8e2] bg-white text-sm"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-[#315158]">E-mail profissional *</label>
                    <Input
                      required
                      type="email"
                      value={contactEmail}
                      onChange={event => setContactEmail(event.target.value)}
                      placeholder="seu.email@empresa.com"
                      className="mt-1.5 h-11 rounded-xl border-[#d5e8e2] bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#315158]">Assunto principal *</label>
                    <select
                      value={contactSubject}
                      onChange={event => setContactSubject(event.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-[#d5e8e2] bg-white px-3 text-sm text-[#0d2227] focus:outline-none focus:ring-2 focus:ring-[#0c7474]/30"
                    >
                      <option value="Suporte">Suporte Técnico</option>
                      <option value="Vendas">Vendas e Planos</option>
                      <option value="Dúvidas">Dúvidas sobre o Sistema</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#315158]">Telefone / WhatsApp (opcional)</label>
                  <Input
                    value={contactPhone}
                    onChange={event => setContactPhone(event.target.value)}
                    placeholder="(00) 00000-0000"
                    className="mt-1.5 h-11 rounded-xl border-[#d5e8e2] bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#315158]">Como podemos ajudar? *</label>
                  <Textarea
                    required
                    rows={4}
                    value={contactMessage}
                    onChange={event => setContactMessage(event.target.value)}
                    placeholder="Descreva suas dúvidas, solicite demonstração ou suporte técnico..."
                    className="mt-1.5 rounded-xl border-[#d5e8e2] bg-white p-3 text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSendingContact}
                  className="w-full h-12 rounded-xl bg-[#0c7474] text-white font-bold hover:bg-[#063b43] shadow-md shadow-[#0c7474]/20"
                >
                  {isSendingContact ? "Enviando mensagem..." : "Enviar solicitação de suporte"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e5efe8] bg-[#072d32] py-12 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <BrandLockup compact aria-label="TST Brasil Hub" />
            <span className="text-xs text-[#a3c2bc]">© 2026 TST Brasil Hub. Todos os direitos reservados.</span>
          </div>
          <div className="flex items-center gap-6 text-xs font-semibold text-[#a3c2bc]">
            <a href="#beneficios" className="hover:text-white">Benefícios</a>
            <a href="#produto" className="hover:text-white">Ecossistema</a>
            <Link href="/planos" className="hover:text-white">Planos</Link>
            <a href="#faq" className="hover:text-white">FAQ</a>
            <a href="#contato" className="hover:text-white">Contato</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

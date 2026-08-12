import { ArrowRight, BadgeCheck, BookOpen, CheckCircle2, FileCheck2, ShieldCheck, Sparkles, UsersRound, Layers, Briefcase, Building2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/BrandLockup";
import { useState } from "react";

const steps = [
  { num: "01", title: "Crie a sua conta", text: "Cadastre-se rapidamente para desbloquear o acesso aos ambientes especializados de gestão em segurança do trabalho." },
  { num: "02", title: "Escolha o seu contexto", text: "Selecione entre Prestador de serviço para gerenciar sua carteira e PGR, ou Empresa para a rotina corporativa." },
  { num: "03", title: "Use as ferramentas", text: "Tenha em mãos PGR integrado, controle de EPIs com CA, certificados, inspeções e suporte contínuo." },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const [selectedHub, setSelectedHub] = useState<"prestador" | "empresa">("prestador");

  const enter = () => {
    if (isAuthenticated) setLocation("/app");
    else startLogin();
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
          <a href="#produto" className="hover:text-[#0c7474]">Produto</a>
          <Link href="/planos" className="hover:text-[#0c7474]">Planos</Link>
          <a href="#como-funciona" className="hover:text-[#0c7474]">Como Funciona</a>
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
              <Sparkles className="h-3.5 w-3.5" /> TST Brasil Hub · ecossistema profissional de SST
            </span>
            <h1 className="mt-6 font-display text-4xl sm:text-6xl font-extrabold leading-[1.08] tracking-[-.03em] text-white">
              A PLATAFORMA PARA PROFISSIONAIS DE <span className="text-[#64e2d1]">SST QUE QUEREM EVOLUIR</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#d0e6e1]">
              Conteúdo, networking, ferramentas operacionais e oportunidades para prestadores de serviço e empresas escalarem sua atuação com método e conformidade.
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
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#48c7b8]" /> Gestão completa de PGR e EPIs</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#48c7b8]" /> Biblioteca técnica e certificados</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#48c7b8]" /> Suporte especializado</span>
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
                <p className="mt-1 text-xs leading-5 text-[#526b73]">Clientes, empresas, PGR e materiais em um ambiente exclusivo.</p>
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
                <p className="mt-1 text-xs leading-5 text-[#526b73]">Indicadores, treinamentos, documentos e PGR da empresa ativa.</p>
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

      {/* Seção de Destaques / Excelência Profissional */}
      <section id="produto" className="bg-[#f8fcfb] py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[.18em] text-[#0c8c89]">Excelência profissional</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-[-.03em] text-[#0d2227]">
              Tudo o que você precisa para dominar a rotina de SST.
            </h2>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            <article className="rounded-3xl border border-[#e1ede8] bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f6f1] text-[#0c7474] mb-6">
                <UsersRound className="h-6 w-6" />
              </span>
              <h3 className="text-xl font-bold text-[#0d2227]">Ambientes especializados</h3>
              <p className="mt-3 text-sm leading-6 text-[#526b73]">
                Experiência dedicada para prestadores de serviço na gestão de carteira e PGR, e para empresas no acompanhamento da rotina corporativa.
              </p>
            </article>

            <article className="rounded-3xl border border-[#e1ede8] bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f6f1] text-[#0c7474] mb-6">
                <FileCheck2 className="h-6 w-6" />
              </span>
              <h3 className="text-xl font-bold text-[#0d2227]">Conformidade em tempo real</h3>
              <p className="mt-3 text-sm leading-6 text-[#526b73]">
                Gestão de EPIs com CA e validade, documentos legais, inspeções estruturadas e planos de ação integrados sem margem para falhas.
              </p>
            </article>

            <article className="rounded-3xl border border-[#e1ede8] bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f6f1] text-[#0c7474] mb-6">
                <BookOpen className="h-6 w-6" />
              </span>
              <h3 className="text-xl font-bold text-[#0d2227]">Biblioteca e suporte técnico</h3>
              <p className="mt-3 text-sm leading-6 text-[#526b73]">
                Normas regulamentadoras, materiais de apoio e suporte contínuo para elevar o padrão da segurança do trabalho na sua operação.
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
    </main>
  );
}

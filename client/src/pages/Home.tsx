import { ArrowRight, BadgeCheck, BookOpen, CheckCircle2, FileCheck2, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";

const steps = [
  { num: "01", title: "Crie a sua conta", text: "Cadastre-se rapidamente para desbloquear o acesso aos ambientes especializados de gestão em segurança do trabalho." },
  { num: "02", title: "Escolha o seu contexto", text: "Selecione entre Prestador de serviço para gerenciar sua carteira e PGR, ou Empresa para a rotina corporativa." },
  { num: "03", title: "Use as ferramentas", text: "Tenha em mãos PGR integrado, controle de EPIs com CA, certificados, inspeções e suporte contínuo." },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const enter = () => {
    if (isAuthenticated) setLocation("/app");
    else startLogin();
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-[#091e22]">
      {/* Top Navbar */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8 bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-[#e5efe8]">
        <Link href="/" className="flex items-center">
          <img src="/manus-storage/portal-tst-logo-clean_28523a59.png" alt="Portal do TST Brasil" className="h-12 w-[190px] object-contain object-left" />
        </Link>
        <div className="hidden items-center gap-8 text-sm font-semibold text-[#405c63] md:flex">
          <a href="#sobre" className="hover:text-[#0c7474]">Sobre Nós</a>
          <a href="#produto" className="hover:text-[#0c7474]">Produto</a>
          <Link href="/planos" className="hover:text-[#0c7474]">Planos</Link>
          <a href="#funcionalidades" className="hover:text-[#0c7474]">Funcionalidades</a>
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
              <Sparkles className="h-3.5 w-3.5" /> O maior portal de segurança do trabalho do Brasil
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

          {/* Choice Hub com Prestador de serviço e Empresa */}
          <div className="rounded-[2.5rem] border border-white/20 bg-white p-7 text-[#0d2227] shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-[#eaf2ef] pb-5">
              <div className="flex items-center gap-3">
                <img src="/manus-storage/portal-tst-logo-clean_28523a59.png" alt="Logo" className="h-10 w-auto object-contain" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#0c8c89]">Choice Hub</span>
                  <h3 className="text-base font-bold text-[#0d2227]">Escolha seu ambiente de trabalho</h3>
                </div>
              </div>
              <BadgeCheck className="h-6 w-6 text-[#0c7474]" />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div onClick={enter} className="group cursor-pointer rounded-2xl border border-[#d2a366]/40 bg-gradient-to-b from-[#fbf6f0] to-[#f7f0e8] p-5 transition-all hover:border-[#c68b48] hover:shadow-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c68b48]/15 text-[#a46d32] mb-3">
                  <UsersRound className="h-5 w-5" />
                </div>
                <span className="rounded-md bg-[#f3e4d4] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.1em] text-[#915a24]">Prestador de serviço</span>
                <h4 className="mt-3 text-lg font-bold text-[#0d2227]">Preste serviços.</h4>
                <p className="mt-1 text-xs leading-5 text-[#526b73]">Clientes, empresas, PGR e materiais em um ambiente exclusivo.</p>
                <div className="mt-4 inline-flex items-center text-xs font-bold text-[#915a24] group-hover:translate-x-1 transition-transform">
                  Abrir ambiente <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </div>
              </div>

              <div onClick={enter} className="group cursor-pointer rounded-2xl border border-[#0c7474]/30 bg-gradient-to-b from-[#f0f9f8] to-[#eaf5f3] p-5 transition-all hover:border-[#0c7474] hover:shadow-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0c7474]/15 text-[#0c7474] mb-3">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="rounded-md bg-[#d9f1e7] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.1em] text-[#0c7474]">Empresa</span>
                <h4 className="mt-3 text-lg font-bold text-[#0d2227]">Cuide da rotina.</h4>
                <p className="mt-1 text-xs leading-5 text-[#526b73]">Indicadores, treinamentos, documentos e PGR da empresa ativa.</p>
                <div className="mt-4 inline-flex items-center text-xs font-bold text-[#0c7474] group-hover:translate-x-1 transition-transform">
                  Abrir ambiente <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Destaques */}
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

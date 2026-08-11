import { ArrowRight, BadgeCheck, BookOpen, CheckCircle2, FileCheck2, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";

const pillars = [
  { icon: UsersRound, title: "Dois caminhos, uma plataforma", text: "Atue como prestador de serviços ou profissional CLT com a experiência ajustada à sua rotina." },
  { icon: FileCheck2, title: "Ferramentas no contexto certo", text: "PGR, treinamentos, certificados, biblioteca e materiais ficam disponíveis em ambos os ambientes." },
  { icon: BookOpen, title: "Ecossistema que cresce com você", text: "Suporte, materiais técnicos e marketplace se conectam à operação sem misturar dados entre empresas." },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const enter = () => {
    if (isAuthenticated) setLocation("/app");
    else startLogin();
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7fbfa] text-[#102b32]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#063b43] text-[#88ddc4] shadow-lg shadow-[#063b43]/15"><ShieldCheck className="h-6 w-6" /></span>
          <span><strong className="font-display block text-lg leading-5">Portal TST</strong><small className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0c8c89]">Brasil</small></span>
        </Link>
        <div className="hidden items-center gap-7 text-sm font-semibold text-[#49636a] md:flex"><a href="#produto">Produto</a><a href="#como-funciona">Como funciona</a><Link href="/planos">Planos</Link></div>
        <Button onClick={enter} className="rounded-xl bg-[#0c7474] px-5 text-white hover:bg-[#063b43]">{loading ? "Carregando" : isAuthenticated ? "Acessar portal" : "Entrar"}</Button>
      </nav>

      <section className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-16 lg:grid-cols-[1.06fr_.94fr] lg:px-8 lg:pb-28 lg:pt-24">
        <div className="absolute -right-44 top-0 h-96 w-96 rounded-full bg-[#d9f1e7] blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#b9e3d7] bg-white px-4 py-2 text-xs font-bold text-[#0c7474]"><Sparkles className="h-3.5 w-3.5" /> Gestão SST para quem move empresas com segurança</span>
          <h1 className="mt-6 max-w-3xl font-display text-5xl font-extrabold leading-[1.04] tracking-[-.055em] text-[#102b32] sm:text-6xl">A plataforma completa para a rotina do <span className="text-[#0c8c89]">TST</span>.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#49636a]">Escolha o seu contexto de trabalho — TST Autônomo ou TST CLT — e tenha as mesmas ferramentas do Portal TST organizadas pela rotina que você vive todos os dias.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Button onClick={enter} size="lg" className="h-13 rounded-xl bg-[#0c7474] px-6 text-base text-white hover:bg-[#063b43]">Conhecer o Portal TST <ArrowRight className="ml-2 h-4 w-4" /></Button><Link href="/planos" className="inline-flex h-13 items-center justify-center rounded-xl border border-[#b7d8d2] bg-white px-6 text-sm font-bold text-[#0c7474] hover:border-[#0c7474]">Ver planos mensais</Link></div>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-[#315158]"><span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#39a77e]" /> Contextos separados</span><span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#39a77e]" /> Ferramentas compartilhadas</span><span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#39a77e]" /> Dados por ambiente</span></div>
        </div>

        <div className="relative rounded-[2rem] border border-white bg-white p-4 shadow-2xl shadow-[#063b43]/10">
          <div className="rounded-[1.5rem] bg-[#063b43] p-6 text-white">
            <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[0.15em] text-[#9fd6ca]">Portal TST Brasil</span><BadgeCheck className="h-5 w-5 text-[#88ddc4]" /></div>
            <p className="mt-9 text-sm text-[#c5e5df]">Olá, profissional de SST</p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight">Escolha seu ambiente de trabalho</h2>
          </div>
          <div className="grid gap-4 p-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#a6ddcf] bg-[#f4fcf8] p-5"><span className="rounded-lg bg-[#d9f1e7] px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#168c89]">TST Autônomo</span><h3 className="mt-5 text-xl font-bold">Preste serviços com método.</h3><p className="mt-2 text-sm leading-6 text-[#5d7479]">Clientes, empresas, PGR e materiais em um ambiente exclusivo.</p><div className="mt-6 flex items-center text-sm font-bold text-[#0c7474]">Abrir ambiente <ArrowRight className="ml-2 h-4 w-4" /></div></div>
            <div className="rounded-2xl border border-[#bddbed] bg-[#f4f9ff] p-5"><span className="rounded-lg bg-[#dbeeff] px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#2165a9]">TST CLT</span><h3 className="mt-5 text-xl font-bold">Cuide da rotina interna.</h3><p className="mt-2 text-sm leading-6 text-[#5d7479]">Indicadores, treinamentos, documentos e PGR da empresa ativa.</p><div className="mt-6 flex items-center text-sm font-bold text-[#2165a9]">Abrir ambiente <ArrowRight className="ml-2 h-4 w-4" /></div></div>
          </div>
        </div>
      </section>

      <section id="produto" className="border-y border-[#deece9] bg-white py-20"><div className="mx-auto max-w-7xl px-6 lg:px-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#0c8c89]">Base do ecossistema</p><h2 className="mt-3 max-w-2xl text-4xl font-bold tracking-[-.04em]">Uma conta, dois contextos e todas as ferramentas que o TST precisa.</h2><div className="mt-12 grid gap-5 lg:grid-cols-3">{pillars.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-3xl border border-[#deece9] bg-[#fbfefd] p-7"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e8f6f1] text-[#0c7474]"><Icon className="h-5 w-5" /></span><h3 className="mt-6 text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-[#5d7479]">{text}</p></article>)}</div></div></section>

      <section id="como-funciona" className="mx-auto max-w-7xl px-6 py-20 lg:px-8"><div className="rounded-[2rem] bg-[#102b32] px-8 py-12 text-white lg:px-14"><div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#9fd6ca]">Próximo passo</p><h2 className="mt-3 text-4xl font-bold tracking-[-.04em]">A sua operação SST não precisa caber em ferramentas desconectadas.</h2></div><div className="grid gap-5 sm:grid-cols-3">{["Crie a conta", "Escolha o contexto", "Use as ferramentas"].map((step, index) => <div key={step}><span className="text-3xl font-bold text-[#88ddc4]">0{index + 1}</span><p className="mt-4 text-sm font-semibold">{step}</p><p className="mt-2 text-sm leading-6 text-[#b6d9d2]">Dados, permissões e recursos ficam organizados pelo ambiente que você escolheu.</p></div>)}</div></div></div></section>
    </main>
  );
}

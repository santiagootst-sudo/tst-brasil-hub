import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { Search, BookMarked, ShieldCheck, FileText, ExternalLink, Sparkles, BookOpen, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

const libraryItems = [
  {
    code: "NR-01",
    title: "Disposições Gerais e Gerenciamento de Riscos (GRO/PGR)",
    kind: "Norma Oficial",
    category: "Normas Regulamentadoras",
    description: "Diretrizes sobre o Gerenciamento de Riscos Ocupacionais (GRO) e elaboração do PGR.",
    badge: "Obrigatória",
    color: "from-[#063b43] to-[#0c7474]",
    url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-1"
  },
  {
    code: "NR-05",
    title: "Comissão Interna de Prevenção de Acidentes e Assédio (CIPA)",
    kind: "Norma Oficial",
    category: "Normas Regulamentadoras",
    description: "Requisitos para constituição, dimensionamento e funcionamento da CIPA e prevenção ao assédio.",
    badge: "Obrigatória",
    color: "from-[#123f69] to-[#2165a9]",
    url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-5-nr-5"
  },
  {
    code: "NR-06",
    title: "Equipamentos de Proteção Individual (EPI)",
    kind: "Norma Oficial",
    category: "Normas Regulamentadoras",
    description: "Regras sobre fornecimento, uso, higienização, CA e responsabilidades sobre EPIs.",
    badge: "Obrigatória",
    color: "from-[#0c7474] to-[#14b8a6]",
    url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-6-nr-6"
  },
  {
    code: "NR-07",
    title: "Programa de Controle Médico de Saúde Ocupacional (PCMSO)",
    kind: "Norma Oficial",
    category: "Normas Regulamentadoras",
    description: "Diretrizes de rastreio e diagnóstico precoce dos agravos à saúde relacionados ao trabalho.",
    badge: "Obrigatória",
    color: "from-[#1d4ed8] to-[#3b82f6]",
    url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-7-nr-7"
  },
  {
    code: "NR-09",
    title: "Avaliação e Controle das Exposições Ocupacionais",
    kind: "Norma Oficial",
    category: "Normas Regulamentadoras",
    description: "Metodologia para identificação e avaliação de agentes físicos, químicos e biológicos.",
    badge: "Técnica",
    color: "from-[#0f766e] to-[#14b8a6]",
    url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-9-nr-9"
  },
  {
    code: "NR-10",
    title: "Segurança em Instalações e Serviços em Eletricidade",
    kind: "Norma Oficial",
    category: "Normas Regulamentadoras",
    description: "Medidas preventivas e procedimentos para trabalhos com eletricidade.",
    badge: "Segurança",
    color: "from-[#b45309] to-[#d97706]",
    url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-10-nr-10"
  },
  {
    code: "NR-12",
    title: "Segurança no Trabalho em Máquinas e Equipamentos",
    kind: "Norma Oficial",
    category: "Normas Regulamentadoras",
    description: "Requisitos técnicos de segurança para fabricação, importação e operação de máquinas.",
    badge: "Industrial",
    color: "from-[#475569] to-[#64748b]",
    url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-12-nr-12"
  },
  {
    code: "NR-15",
    title: "Atividades e Operações Insalubres",
    kind: "Norma Oficial",
    category: "Normas Regulamentadoras",
    description: "Limites de tolerância e caracterização de insalubridade por agentes ambientais.",
    badge: "Legal",
    color: "from-[#b91c1c] to-[#ef4444]",
    url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-15-nr-15"
  },
  {
    code: "NR-16",
    title: "Atividades e Operações Perigosas",
    kind: "Norma Oficial",
    category: "Normas Regulamentadoras",
    description: "Parâmetros para caracterização de periculosidade (explosivos, inflamáveis, radiações, eletricidade).",
    badge: "Legal",
    color: "from-[#c2410c] to-[#f97316]",
    url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-16-nr-16"
  },
  {
    code: "NR-18",
    title: "Segurança na Indústria da Construção",
    kind: "Norma Oficial",
    category: "Normas Regulamentadoras",
    description: "Diretrizes de planejamento e organização para canteiros de obras.",
    badge: "Construção",
    color: "from-[#854d0e] to-[#ca8a04]",
    url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-18-nr-18"
  },
  {
    code: "NR-35",
    title: "Trabalho em Altura",
    kind: "Norma Oficial",
    category: "Normas Regulamentadoras",
    description: "Requisitos para planejamento, organização e execução de trabalhos em altura superior a 2 metros.",
    badge: "Altura",
    color: "from-[#1e3a8a] to-[#2563eb]",
    url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-35-nr-35"
  },
  {
    code: "MANUAL",
    title: "Manual de Orientação GRO e PGR da NR-01",
    kind: "Manual MTE",
    category: "Manuais Oficiais",
    description: "Orientações oficiais detalhadas sobre a implementação do Gerenciamento de Riscos Ocupacionais.",
    badge: "Prático",
    color: "from-[#065f46] to-[#047857]",
    url: "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/manuais-e-publicacoes/manual_gro_pgr_da_nr_1.pdf/"
  },
  {
    code: "FAQ",
    title: "Perguntas e Respostas Oficiais sobre GRO e PGR",
    kind: "Perguntas Frequentes",
    category: "Manuais Oficiais",
    description: "Esclarecimentos oficiais do MTE para dúvidas recorrentes na elaboração de inventários de riscos.",
    badge: "Consulta",
    color: "from-[#312e81] to-[#4f46e5]",
    url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/PerguntaseRespostasGROPGRMaio2026.pdf"
  }
];

export default function Library() {
  const { loading } = useAuth({ redirectOnUnauthenticated: true });
  const [term, setTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Todas");

  const categories = ["Todas", "Normas Regulamentadoras", "Manuais Oficiais"];

  const filtered = libraryItems.filter(item => {
    const matchesCategory = activeCategory === "Todas" || item.category === activeCategory;
    const matchesTerm = `${item.code} ${item.title} ${item.description}`.toLocaleLowerCase("pt-BR").includes(term.toLocaleLowerCase("pt-BR"));
    return matchesCategory && matchesTerm;
  });

  if (loading) return null;

  return (
    <DashboardLayout title="Biblioteca Técnica e NRs">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Banner principal */}
        <section className="overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#063b43] via-[#0c7474] to-[#123f69] p-8 text-white shadow-xl md:p-10">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#8edec7]/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#8edec7]">
              <Sparkles className="h-3.5 w-3.5" /> Consulta oficial do MTE e NRs
            </span>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Biblioteca Técnica e Normas Regulamentadoras</h2>
            <p className="text-sm leading-6 text-[#d9eeea]">
              Explore o acervo completo de Normas Regulamentadoras (NRs) e manuais oficiais. Os cards compactos otimizam sua visualização para acesso imediato aos textos vigentes publicados pelo Ministério do Trabalho e Emprego.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#749e97]" />
              <Input
                value={term}
                onChange={event => setTerm(event.target.value)}
                placeholder="Pesquisar por norma (ex.: NR-01, NR-35, CIPA) ou termo..."
                className="h-12 rounded-2xl border-white/15 bg-white/95 text-[#102b32] pl-11 shadow-sm placeholder:text-[#668087]"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-xl px-4 py-3 text-xs font-bold transition ${activeCategory === cat ? "bg-[#8edec7] text-[#063b43] shadow-md" : "bg-white/10 text-white hover:bg-white/20"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Grade de Cards Menores */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Acervo atualizado</p>
              <h3 className="text-xl font-bold text-[#102b32]">Normas e Manuais Disponíveis</h3>
            </div>
            <span className="rounded-full bg-[#e8f6f1] px-3.5 py-1 text-xs font-bold text-[#0c7474]">
              {filtered.length} itens encontrados
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map(item => (
              <article
                key={item.code}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#dcebe8] bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-[#0c7474]/40 hover:shadow-lg"
              >
                <div>
                  {/* Capa ilustrada do card */}
                  <div className={`relative h-24 w-full overflow-hidden rounded-xl bg-gradient-to-br ${item.color} p-3.5 text-white shadow-inner flex flex-col justify-between`}>
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-black/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest backdrop-blur-xs">
                        {item.code}
                      </span>
                      <span className="rounded-md bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider backdrop-blur-xs">
                        {item.badge}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-white/80">{item.kind}</p>
                      <h4 className="text-sm font-bold tracking-tight line-clamp-1">{item.title.split("—")[0]}</h4>
                    </div>
                  </div>

                  {/* Informações resumidas */}
                  <div className="mt-3 space-y-1.5">
                    <h4 className="text-xs font-bold text-[#102b32] line-clamp-2 leading-relaxed">
                      {item.title}
                    </h4>
                    <p className="text-[11px] leading-relaxed text-[#668087] line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Ação */}
                <div className="mt-4 pt-3 border-t border-[#f0f5f4] flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#8a9e9a]">Oficial MTE</span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#e8f6f1] px-2.5 py-1.5 text-xs font-bold text-[#0c7474] transition group-hover:bg-[#0c7474] group-hover:text-white"
                  >
                    <span>Abrir</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </article>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="rounded-3xl border border-dashed border-[#bddbd5] bg-white p-12 text-center space-y-3">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f6f1] text-[#0c7474]">
                <BookOpen className="h-6 w-6" />
              </span>
              <h4 className="text-lg font-bold text-[#102b32]">Nenhum material encontrado</h4>
              <p className="mx-auto max-w-sm text-xs leading-5 text-[#668087]">
                Tente buscar por outro termo ou selecione a categoria "Todas" para visualizar o catálogo completo de NRs.
              </p>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

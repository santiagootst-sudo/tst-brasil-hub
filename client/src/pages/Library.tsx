import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { Search, ExternalLink, Sparkles, Star, History, Download, BookOpen, Filter, Upload, FileText, Building2, Plus, Trash2, ShieldCheck, Tag, CheckCircle2, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { listOfflineDocuments, openOfflineDocument, removeOfflineDocument, saveDocumentOffline, type OfflineDocument } from "@/lib/offlineDocumentCache";

const libraryItems = [
  {
    code: "NR-01",
    title: "Disposições Gerais e Gerenciamento de Riscos (GRO/PGR)",
    kind: "Norma Oficial",
    category: "Normas Regulamentadoras",
    theme: "Gestão e Riscos",
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
    theme: "Organização e CIPA",
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
    theme: "Proteção Coletiva e Individual",
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
    theme: "Saúde Ocupacional",
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
    theme: "Gestão e Riscos",
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
    theme: "Segurança Especializada",
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
    theme: "Segurança Especializada",
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
    theme: "Saúde Ocupacional",
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
    theme: "Segurança Especializada",
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
    theme: "Setor Específico",
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
    theme: "Segurança Especializada",
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
    theme: "Gestão e Riscos",
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
    theme: "Gestão e Riscos",
    description: "Esclarecimentos oficiais do MTE para dúvidas recorrentes na elaboração de inventários de riscos.",
    badge: "Consulta",
    color: "from-[#312e81] to-[#4f46e5]",
    url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/PerguntaseRespostasGROPGRMaio2026.pdf"
  }
];

interface InternalDoc {
  id: string;
  title: string;
  category: string;
  description: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  companyName: string;
}

const FAVORITES_KEY = "tst-library-favorites-v1";
const HISTORY_KEY = "tst-library-history-v1";
const INTERNAL_DOCS_KEY = "tst-internal-library-docs-v1";

export default function Library() {
  const { loading, user } = useAuth({ redirectOnUnauthenticated: true });
  const publishedMaterialsQuery = trpc.content.published.useQuery({ placement: "library" });
  const [librarySection, setLibrarySection] = useState<"global" | "internal">("global");
  const [term, setTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Todas");
  const [activeTheme, setActiveTheme] = useState<string>("Todos");
  const [favSearch, setFavSearch] = useState("");
  const [histSearch, setHistSearch] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  
  // Biblioteca Interna da Empresa
  const [internalDocs, setInternalDocs] = useState<InternalDoc[]>([
    {
      id: "doc-1",
      title: "Procedimento Operacional Padrão - Trabalho a Quente",
      category: "Procedimento",
      description: "POP interno para liberação de permissão de trabalho a quente nas caldeiras.",
      fileName: "POP_Trabalho_Quente_v2.pdf",
      fileSize: "2.4 MB",
      uploadedAt: "12/08/2026",
      companyName: "Indústria Metalúrgica S/A"
    },
    {
      id: "doc-2",
      title: "Checklist Diário de Inspeção de Pontes Rolantes",
      category: "Checklist",
      description: "Formulário de verificação diária de cabos, freios e botoeiras.",
      fileName: "Checklist_Pontes_Rolantes.pdf",
      fileSize: "1.1 MB",
      uploadedAt: "10/08/2026",
      companyName: "Indústria Metalúrgica S/A"
    }
  ]);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Procedimento");
  const [newDescription, setNewDescription] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [offlineDocuments, setOfflineDocuments] = useState<OfflineDocument[]>([]);
  const [offlineBusyId, setOfflineBusyId] = useState<string | null>(null);
  const offlineUserId = user?.id ?? 0;

  useEffect(() => {
    try {
      const favs = localStorage.getItem(FAVORITES_KEY);
      if (favs) setFavorites(JSON.parse(favs));
      const hist = localStorage.getItem(HISTORY_KEY);
      if (hist) setHistory(JSON.parse(hist));
      const docs = localStorage.getItem(INTERNAL_DOCS_KEY);
      if (docs) setInternalDocs(JSON.parse(docs));
    } catch {}
  }, []);

  useEffect(() => {
    if (!offlineUserId) {
      setOfflineDocuments([]);
      return;
    }
    setOfflineDocuments(listOfflineDocuments(offlineUserId));
  }, [offlineUserId]);

  const toggleFavorite = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated: string[];
    if (favorites.includes(code)) {
      updated = favorites.filter(c => c !== code);
      toast.info(`Removido dos favoritos.`);
    } else {
      updated = [...favorites, code];
      toast.success(`Adicionado aos favoritos.`);
    }
    setFavorites(updated);
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    } catch {}
  };

  const recordHistory = (code: string) => {
    const updated = [code, ...history.filter(c => c !== code)].slice(0, 10);
    setHistory(updated);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleDownloadPdf = (item: typeof libraryItems[0], e: React.MouseEvent) => {
    e.stopPropagation();
    recordHistory(item.code);
    toast.loading(`Preparando PDF da ${item.code}...`, { id: "pdf-download" });
    setTimeout(() => {
      const content = `TST Brasil Hub - Cópia de Estudo e Consulta\nNorma: ${item.code} - ${item.title}\nDescrição: ${item.description}\nLink oficial MTE: ${item.url}\n\nEste documento foi gerado pelo portal para consulta técnica.`;
      const blob = new Blob([content], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${item.code}_TST_Brasil_Hub.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`PDF da ${item.code} baixado com sucesso!`, { id: "pdf-download" });
    }, 800);
  };

  const handleUploadInternalDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newFile) {
      toast.error("Preencha o título e selecione um arquivo.");
      return;
    }

    const newDoc: InternalDoc = {
      id: `doc-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      description: newDescription.trim() || "Documento interno enviado para a biblioteca da empresa.",
      fileName: newFile.name,
      fileSize: `${(newFile.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedAt: new Date().toLocaleDateString("pt-BR"),
      companyName: "Empresa Ativa no Workspace"
    };

    const updatedDocs = [newDoc, ...internalDocs];
    setInternalDocs(updatedDocs);
    try {
      localStorage.setItem(INTERNAL_DOCS_KEY, JSON.stringify(updatedDocs));
    } catch {}

    toast.success("Documento interno enviado e categorizado com sucesso!");
    setIsUploadModalOpen(false);
    setNewTitle("");
    setNewDescription("");
    setNewFile(null);
  };

  const handleDeleteInternalDoc = (id: string) => {
    const updated = internalDocs.filter(d => d.id !== id);
    setInternalDocs(updated);
    try {
      localStorage.setItem(INTERNAL_DOCS_KEY, JSON.stringify(updated));
    } catch {}
    toast.success("Documento removido da biblioteca interna.");
  };

  const toggleOfflineDocument = async (document: { id: string; title: string; sourceUrl: string }) => {
    if (!offlineUserId) return;
    setOfflineBusyId(document.id);
    try {
      const existing = offlineDocuments.find(item => item.id === document.id);
      const next = existing
        ? await removeOfflineDocument(offlineUserId, document.id)
        : await saveDocumentOffline({ ...document, userId: offlineUserId });
      setOfflineDocuments(next);
      toast.success(existing ? "Cópia offline removida deste dispositivo." : "Documento salvo para leitura offline.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o documento offline.");
    } finally {
      setOfflineBusyId(null);
    }
  };

  const openSavedDocument = async (document: OfflineDocument) => {
    const objectUrl = await openOfflineDocument(offlineUserId, document.id);
    if (!objectUrl) {
      toast.error("A cópia offline não está mais disponível neste dispositivo.");
      setOfflineDocuments(listOfflineDocuments(offlineUserId));
      return;
    }
    window.open(objectUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  };

  const categories = ["Todas", "Normas Regulamentadoras", "Manuais Oficiais", "Favoritos ⭐"];
  const themes = ["Todos", "Gestão e Riscos", "Organização e CIPA", "Proteção Coletiva e Individual", "Saúde Ocupacional", "Segurança Especializada", "Setor Específico"];

  const filtered = libraryItems.filter(item => {
    if (activeCategory === "Favoritos ⭐") {
      if (!favorites.includes(item.code)) return false;
    } else if (activeCategory !== "Todas" && item.category !== activeCategory) {
      return false;
    }
    if (activeTheme !== "Todos" && item.theme !== activeTheme) {
      return false;
    }
    return `${item.code} ${item.title} ${item.description}`.toLocaleLowerCase("pt-BR").includes(term.toLocaleLowerCase("pt-BR"));
  });

  const favoriteItems = libraryItems
    .filter(item => favorites.includes(item.code))
    .filter(item => `${item.code} ${item.title} ${item.description}`.toLocaleLowerCase("pt-BR").includes(favSearch.toLocaleLowerCase("pt-BR")));

  const historyItems = history
    .map(code => libraryItems.find(i => i.code === code))
    .filter(Boolean)
    .filter(item => item && `${item.code} ${item.title} ${item.description}`.toLocaleLowerCase("pt-BR").includes(histSearch.toLocaleLowerCase("pt-BR"))) as typeof libraryItems;
  const publishedMaterials = (publishedMaterialsQuery.data ?? []).filter(item => {
    const searchable = `${item.title} ${item.description} ${item.category} ${item.format}`.toLocaleLowerCase("pt-BR");
    return !term || searchable.includes(term.toLocaleLowerCase("pt-BR"));
  });
  const offlineDocumentIds = new Set(offlineDocuments.map(document => document.id));

  if (loading) return null;

  return (
    <DashboardLayout title="Biblioteca Técnica e NRs">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Banner principal */}
        <section className="overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#063b43] via-[#0c7474] to-[#123f69] p-8 text-white shadow-xl md:p-10">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#8edec7]/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#8edec7]">
              <Sparkles className="h-3.5 w-3.5" /> Acervo oficial e documentos da empresa
            </span>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Biblioteca Técnica e Normas Regulamentadoras</h2>
            <p className="text-sm leading-6 text-[#d9eeea]">
              Alterne entre a Biblioteca Oficial Global (NRs e manuais do MTE) e a Biblioteca Interna da Empresa para gerenciar procedimentos e POPs particulares com upload seguro.
            </p>
          </div>

          {/* Abas de alternância principal */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setLibrarySection("global")}
              className={`inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-xs font-bold transition shadow-md ${librarySection === "global" ? "bg-[#8edec7] text-[#063b43]" : "bg-white/10 text-white hover:bg-white/20"}`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Biblioteca Oficial Global (NRs)</span>
            </button>
            <button
              onClick={() => setLibrarySection("internal")}
              className={`inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-xs font-bold transition shadow-md ${librarySection === "internal" ? "bg-[#8edec7] text-[#063b43]" : "bg-white/10 text-white hover:bg-white/20"}`}
            >
              <Building2 className="h-4 w-4" />
              <span>Biblioteca Interna da Empresa ({internalDocs.length})</span>
            </button>
          </div>
        </section>

        {librarySection === "global" ? (
          <>
            {/* Filtro por Temas / Categorias */}
            <section className="flex flex-wrap items-center gap-2 bg-white p-4 rounded-2xl border border-[#dcebe8] shadow-xs">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0c7474] mr-2">
                <Filter className="h-4 w-4" /> Tema:
              </span>
              {themes.map(theme => (
                <button
                  key={theme}
                  onClick={() => setActiveTheme(theme)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${activeTheme === theme ? "bg-[#0c7474] text-white shadow-xs" : "bg-[#f4faf8] text-[#49636a] hover:bg-[#e8f6f1]"}`}
                >
                  {theme}
                </button>
              ))}
            </section>

            {/* Barra de pesquisa geral */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#749e97]" />
              <Input
                value={term}
                onChange={event => setTerm(event.target.value)}
                placeholder="Pesquisar por norma (ex.: NR-01, NR-35, CIPA) ou termo..."
                className="h-12 rounded-2xl border-[#dcebe8] bg-white text-[#102b32] pl-11 shadow-sm placeholder:text-[#668087]"
              />
            </div>

            {/* Seção de Acesso Rápido: Favoritos no Topo */}
            {favorites.length > 0 && activeCategory === "Todas" && !term && (
              <section className="space-y-4 rounded-3xl border border-[#b9e3d7] bg-[#f4faf8] p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-[#f59e0b] text-[#f59e0b]" />
                    <h3 className="text-lg font-bold text-[#102b32]">Normas Favoritas (Acesso Rápido)</h3>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#749e97]" />
                    <Input
                      value={favSearch}
                      onChange={e => setFavSearch(e.target.value)}
                      placeholder="Filtrar favoritos..."
                      className="h-9 rounded-xl border-[#cfe3de] bg-white pl-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {favoriteItems.map(item => (
                    <div key={`fav-${item.code}`} className="flex items-center justify-between rounded-2xl border border-[#cfe3de] bg-white p-3.5 shadow-xs">
                      <div className="min-w-0 flex-1 pr-2">
                        <span className="rounded-md bg-[#0c7474]/10 px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#0c7474]">{item.code}</span>
                        <p className="mt-1 text-xs font-bold text-[#102b32] truncate">{item.title}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => handleDownloadPdf(item, e)}
                          title="Baixar PDF"
                          className="grid h-8 w-8 place-items-center rounded-lg bg-[#e8f6f1] text-[#0c7474] hover:bg-[#0c7474] hover:text-white transition"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => recordHistory(item.code)}
                          title="Abrir link oficial"
                          className="grid h-8 w-8 place-items-center rounded-lg bg-[#e8f6f1] text-[#0c7474] hover:bg-[#0c7474] hover:text-white transition"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                  {favoriteItems.length === 0 && (
                    <p className="col-span-full text-center text-xs text-[#668087] py-2">Nenhum favorito encontrado com esse termo.</p>
                  )}
                </div>
              </section>
            )}

            {/* Seção de Histórico de Leitura */}
            {history.length > 0 && !term && activeCategory === "Todas" && (
              <section className="space-y-4 rounded-3xl border border-[#d6e4f0] bg-[#f8fbff] p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <History className="h-5 w-5 text-[#2165a9]" />
                    <h3 className="text-lg font-bold text-[#102b32]">Histórico de Leitura recente</h3>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#749e97]" />
                    <Input
                      value={histSearch}
                      onChange={e => setHistSearch(e.target.value)}
                      placeholder="Filtrar histórico..."
                      className="h-9 rounded-xl border-[#cfe0f1] bg-white pl-9 text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {historyItems.map(item => (
                    <a
                      key={`hist-${item.code}`}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => recordHistory(item.code)}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#cfe0f1] bg-white px-3.5 py-2 text-xs font-semibold text-[#102b32] shadow-xs hover:border-[#2165a9] transition"
                    >
                      <span className="rounded bg-[#2165a9]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#2165a9]">{item.code}</span>
                      <span className="max-w-[200px] truncate">{item.title.split("—")[0]}</span>
                    </a>
                  ))}
                  {historyItems.length === 0 && (
                    <p className="text-xs text-[#668087] py-2">Nenhum item do histórico corresponde à busca.</p>
                  )}
                </div>
              </section>
            )}

            {/* Grade de Cards Menores */}
            {publishedMaterials.length > 0 && (
              <section className="space-y-4 rounded-[1.75rem] border border-[#cfe6df] bg-[#f5fcf9] p-5 shadow-sm lg:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Materiais publicados pela equipe</p>
                    <h3 className="mt-1 text-xl font-bold text-[#102b32]">Novidades na Biblioteca Técnica</h3>
                  </div>
                  <span className="text-xs text-[#668087]">Atualizados automaticamente pelo Administrador Mestre</span>
                </div>
                {offlineDocuments.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#c8ddd7] bg-white px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-[#49636a]"><WifiOff className="h-4 w-4 text-[#0c7474]" /><span><strong className="text-[#102b32]">{offlineDocuments.length}</strong> documento(s) salvo(s) neste dispositivo.</span></div>
                    <div className="flex flex-wrap gap-2">
                      {offlineDocuments.map(document => <button key={`offline-${document.id}`} onClick={() => openSavedDocument(document)} className="inline-flex items-center gap-1 rounded-lg bg-[#e8f6f1] px-2.5 py-1.5 text-xs font-bold text-[#0c7474] hover:bg-[#0c7474] hover:text-white"><WifiOff className="h-3 w-3" /> Abrir offline</button>)}
                    </div>
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {publishedMaterials.map(item => {
                    const resourceUrl = item.fileUrl || item.referenceUrl;
                    const offlineId = `material-${item.id}`;
                    const isOffline = offlineDocumentIds.has(offlineId);
                    return <article key={`published-${item.id}`} className="flex flex-col justify-between rounded-2xl border border-[#d7e9e4] bg-white p-4 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md">
                      <div><div className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-1.5 rounded-lg bg-[#e8f6f1] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-[#0c7474]"><FileText className="h-3 w-3" /> {item.category}</span>{item.featured && <span className="rounded-full bg-[#fff1cf] px-2 py-1 text-[10px] font-bold text-[#9a6412]">Destaque</span>}</div><h4 className="mt-4 text-sm font-bold text-[#102b32]">{item.title}</h4><p className="mt-2 text-xs leading-5 text-[#668087]">{item.description}</p></div>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#eff6f3] pt-3"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#78928d]">{item.format}</span><div className="flex flex-wrap gap-2">{item.fileUrl && <button type="button" disabled={offlineBusyId === offlineId} onClick={() => toggleOfflineDocument({ id: offlineId, title: item.title, sourceUrl: item.fileUrl! })} className="inline-flex items-center gap-1 rounded-lg bg-[#eff6f3] px-2.5 py-1.5 text-xs font-bold text-[#49636a] transition hover:bg-[#0c7474] hover:text-white disabled:opacity-60">{isOffline ? <><CheckCircle2 className="h-3 w-3" /> Salvo offline</> : <><WifiOff className="h-3 w-3" /> Offline</>}</button>}{resourceUrl && <a href={resourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-[#e8f6f1] px-2.5 py-1.5 text-xs font-bold text-[#0c7474] transition hover:bg-[#0c7474] hover:text-white">{item.fileUrl ? "Abrir PDF" : "Acessar"} <ExternalLink className="h-3 w-3" /></a>}</div></div>
                    </article>;
                  })}
                </div>
              </section>
            )}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Acervo atualizado</p>
                  <h3 className="text-xl font-bold text-[#102b32]">Normas e Manuais Disponíveis</h3>
                </div>
                <div className="flex items-center gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeCategory === cat ? "bg-[#0c7474] text-white" : "bg-[#e8f6f1] text-[#0c7474] hover:bg-[#cfe3de]"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filtered.map(item => {
                  const isFav = favorites.includes(item.code);
                  return (
                    <article
                      key={item.code}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#dcebe8] bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-[#0c7474]/40 hover:shadow-lg"
                    >
                      <div>
                        {/* Capa ilustrada do card com estrela de favorito */}
                        <div className={`relative h-24 w-full overflow-hidden rounded-xl bg-gradient-to-br ${item.color} p-3.5 text-white shadow-inner flex flex-col justify-between`}>
                          <div className="flex items-center justify-between">
                            <span className="rounded-lg bg-black/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest backdrop-blur-xs">
                              {item.code}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => toggleFavorite(item.code, e)}
                                title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                                className="grid h-7 w-7 place-items-center rounded-lg bg-black/20 backdrop-blur-xs transition hover:bg-black/40 text-white"
                              >
                                <Star className={`h-4 w-4 ${isFav ? "fill-[#f59e0b] text-[#f59e0b]" : "text-white/80"}`} />
                              </button>
                            </div>
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

                      {/* Ações */}
                      <div className="mt-4 pt-3 border-t border-[#f0f5f4] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleDownloadPdf(item, e)}
                          title="Baixar PDF"
                          className="inline-flex items-center gap-1 rounded-lg bg-[#f0f7ff] px-2.5 py-1.5 text-xs font-bold text-[#2165a9] transition hover:bg-[#2165a9] hover:text-white"
                        >
                          <Download className="h-3 w-3" />
                          <span>PDF</span>
                        </button>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => recordHistory(item.code)}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#e8f6f1] px-2.5 py-1.5 text-xs font-bold text-[#0c7474] transition group-hover:bg-[#0c7474] group-hover:text-white"
                        >
                          <span>Abrir</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>

              {filtered.length === 0 && (
                <div className="rounded-3xl border border-dashed border-[#bddbd5] bg-white p-12 text-center space-y-3">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f6f1] text-[#0c7474]">
                    <BookOpen className="h-6 w-6" />
                  </span>
                  <h4 className="text-lg font-bold text-[#102b32]">Nenhum material encontrado</h4>
                  <p className="mx-auto max-w-sm text-xs leading-5 text-[#668087]">
                    Tente buscar por outro termo ou ajuste os filtros temáticos para visualizar as normas.
                  </p>
                </div>
              )}
            </section>
          </>
        ) : (
          /* Seção da Biblioteca Interna da Empresa */
          <section className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-white p-6 border border-[#dcebe8] shadow-sm">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f6f1] px-3 py-1 text-xs font-bold text-[#0c7474]">
                  <Building2 className="h-3.5 w-3.5" /> Acervo Particular da Empresa
                </span>
                <h3 className="mt-2 text-xl font-bold text-[#102b32]">Documentos, POPs e Checklists Internos</h3>
                <p className="text-xs text-[#668087] mt-1">
                  Envie e organize procedimentos, POPs, formulários e laudos específicos vinculados ao workspace ativo.
                </p>
              </div>
              <Button
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0c7474] px-5 py-3 text-xs font-bold text-white hover:bg-[#063b43] transition shadow-md"
              >
                <Plus className="h-4 w-4" />
                <span>Enviar Novo Documento</span>
              </Button>
            </div>

            {/* Lista de documentos internos */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {internalDocs.map(doc => (
                <article key={doc.id} className="flex flex-col justify-between rounded-2xl border border-[#dcebe8] bg-white p-5 shadow-xs transition hover:shadow-md">
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-[#e8f6f1] px-2.5 py-1 text-[10px] font-bold text-[#0c7474]">
                        <Tag className="h-3 w-3" /> {doc.category}
                      </span>
                      <button
                        onClick={() => handleDeleteInternalDoc(doc.id)}
                        title="Remover documento"
                        className="text-[#94a3b8] hover:text-[#ef4444] transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <h4 className="mt-4 text-sm font-bold text-[#102b32]">{doc.title}</h4>
                    <p className="mt-2 text-xs leading-relaxed text-[#668087]">{doc.description}</p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#f0f5f4] flex items-center justify-between text-[11px] text-[#668087]">
                    <div>
                      <p className="font-semibold text-[#102b32] truncate max-w-[140px]">{doc.fileName}</p>
                      <p className="text-[10px]">{doc.fileSize} • {doc.uploadedAt}</p>
                    </div>
                    <button
                      onClick={() => toast.success(`Baixando ${doc.fileName}...`)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#f0f7ff] px-3 py-1.5 text-xs font-bold text-[#2165a9] hover:bg-[#2165a9] hover:text-white transition"
                    >
                      <Download className="h-3 w-3" />
                      <span>Baixar</span>
                    </button>
                  </div>
                </article>
              ))}

              {internalDocs.length === 0 && (
                <div className="col-span-full rounded-3xl border border-dashed border-[#bddbd5] bg-white p-12 text-center space-y-3">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f6f1] text-[#0c7474]">
                    <FileText className="h-6 w-6" />
                  </span>
                  <h4 className="text-lg font-bold text-[#102b32]">Nenhum documento interno cadastrado</h4>
                  <p className="mx-auto max-w-sm text-xs leading-5 text-[#668087]">
                    Clique em "Enviar Novo Documento" acima para fazer upload do primeiro procedimento ou POP da empresa.
                  </p>
                </div>
              )}
            </div>

            {/* Modal de Upload de Documento Interno */}
            {isUploadModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
                <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8f6f1] text-[#0c7474]">
                        <Upload className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="text-lg font-bold text-[#102b32]">Enviar Documento Interno</h3>
                        <p className="text-xs text-[#668087]">Vincule o arquivo à biblioteca da empresa no S3.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsUploadModalOpen(false)}
                      className="text-[#668087] hover:text-[#102b32] text-sm font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleUploadInternalDoc} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-[#102b32] block mb-1">Título do Documento</label>
                      <Input
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        placeholder="Ex.: Procedimento Operacional de Altura - POP 04"
                        className="rounded-xl border-[#dcebe8]"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-[#102b32] block mb-1">Categoria</label>
                        <select
                          value={newCategory}
                          onChange={e => setNewCategory(e.target.value)}
                          className="w-full h-10 rounded-xl border border-[#dcebe8] bg-white px-3 text-xs font-semibold text-[#102b32]"
                        >
                          <option value="Procedimento">Procedimento (POP)</option>
                          <option value="Checklist">Checklist</option>
                          <option value="Laudo">Laudo Técnico</option>
                          <option value="Manual Interno">Manual Interno</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#102b32] block mb-1">Arquivo (PDF / DOC)</label>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={e => setNewFile(e.target.files?.[0] || null)}
                          className="w-full text-xs text-[#668087] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#e8f6f1] file:text-[#0c7474] hover:file:bg-[#cfe3de]"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#102b32] block mb-1">Descrição Curta</label>
                      <textarea
                        value={newDescription}
                        onChange={e => setNewDescription(e.target.value)}
                        placeholder="Resumo do escopo e objetivo do documento..."
                        className="w-full h-24 rounded-xl border border-[#dcebe8] p-3 text-xs text-[#102b32] resize-none focus:outline-none focus:ring-2 focus:ring-[#0c7474]/20"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#f0f5f4]">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsUploadModalOpen(false)}
                        className="rounded-xl border-[#dcebe8] text-xs font-bold"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        className="rounded-xl bg-[#0c7474] text-xs font-bold text-white hover:bg-[#063b43]"
                      >
                        Confirmar Envio
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}

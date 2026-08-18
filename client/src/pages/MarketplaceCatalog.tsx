import { useMemo, useState } from "react";
import { ArrowUpRight, BookOpen, CircleDollarSign, FileSpreadsheet, Filter, GraduationCap, PackageOpen, Search, ShoppingBag, SlidersHorizontal } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

const formatLabels = {
  modelo: "Modelo editável",
  planilha: "Planilha",
  checklist: "Checklist",
  ebook: "E-book",
  curso: "Curso",
  documento: "Documento técnico",
  outro: "Material profissional",
} as const;

const platformLabels = {
  hotmart: "Hotmart",
  kiwify: "Kiwify",
  externo: "Compra externa",
  nenhuma: "Acesso externo",
} as const;

const formatIcons = {
  modelo: BookOpen,
  planilha: FileSpreadsheet,
  checklist: SlidersHorizontal,
  ebook: BookOpen,
  curso: GraduationCap,
  documento: PackageOpen,
  outro: ShoppingBag,
} as const;

function formatPrice(value: number | null) {
  if (value === null) return "Ver condições";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);
}

export default function MarketplaceCatalog() {
  const materialsQuery = trpc.content.published.useQuery({ placement: "marketplace" });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const materials = materialsQuery.data ?? [];
  const categories = useMemo(() => ["Todos", ...Array.from(new Set(materials.map(item => item.category))).sort((a, b) => a.localeCompare(b, "pt-BR"))], [materials]);
  const filteredMaterials = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return materials.filter(item => {
      const matchesCategory = category === "Todos" || item.category === category;
      const content = `${item.title} ${item.description} ${item.category} ${item.format}`.toLocaleLowerCase("pt-BR");
      return matchesCategory && (!term || content.includes(term));
    });
  }, [category, materials, search]);

  return (
    <DashboardLayout title="Marketplace SST">
      <div className="mx-auto max-w-7xl space-y-7">
        <section className="relative overflow-hidden rounded-[2rem] bg-[#073b43] px-6 py-8 text-white shadow-[0_22px_52px_rgba(7,59,67,.17)] lg:px-9 lg:py-10">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#7fe0c4]/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-8rem] left-1/3 h-48 w-48 rounded-full bg-[#8ebbe8]/20 blur-3xl" />
          <div className="relative grid gap-7 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#a6ded0]/20 bg-[#9be2cd]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-[#b9f0dd]"><ShoppingBag className="h-3.5 w-3.5" /> Materiais para a rotina do TST</span>
              <h2 className="mt-4 max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">Ferramentas profissionais para aplicar no seu dia a dia.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#c8e6df]">Encontre materiais selecionados para apoiar a gestão de SST: modelos editáveis, planilhas, checklists, documentos técnicos e capacitações. A compra é concluída nas plataformas oficiais de cada oferta.</p>
            </div>
            <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div><p className="text-2xl font-bold text-white">{materials.length}</p><p className="mt-1 text-[11px] font-medium text-[#b7dad2]">materiais publicados</p></div>
              <div><p className="text-2xl font-bold text-white">{materials.filter(item => item.salePlatform === "hotmart").length}</p><p className="mt-1 text-[11px] font-medium text-[#b7dad2]">ofertas Hotmart</p></div>
              <div><p className="text-2xl font-bold text-white">{materials.filter(item => item.salePlatform === "kiwify").length}</p><p className="mt-1 text-[11px] font-medium text-[#b7dad2]">ofertas Kiwify</p></div>
            </div>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-[#dcebe8] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6e8c88]" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Busque por planilha, modelo, NR, CIPA ou outro material..." className="h-11 rounded-xl border-[#d6e8e3] bg-[#fbfefd] pl-10 text-sm" /></div>
            <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[.12em] text-[#668087]"><Filter className="h-3.5 w-3.5" /> Categoria</span>{categories.map(item => <button key={item} type="button" onClick={() => setCategory(item)} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${category === item ? "bg-[#0c7474] text-white" : "bg-[#edf7f3] text-[#397069] hover:bg-[#d9eee7]"}`}>{item}</button>)}</div>
          </div>
        </section>

        {materialsQuery.isLoading ? <div className="grid min-h-64 place-items-center rounded-[1.5rem] border border-[#dcebe8] bg-white text-sm font-semibold text-[#668087]">Carregando materiais publicados...</div> : filteredMaterials.length ? <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{filteredMaterials.map(material => {
          const Icon = formatIcons[material.format];
          return <article key={material.id} className="group flex min-h-[310px] flex-col overflow-hidden rounded-[1.75rem] border border-[#dcebe8] bg-white p-5 shadow-[0_12px_34px_rgba(16,43,50,.06)] transition hover:-translate-y-1 hover:border-[#7ebfb1] hover:shadow-[0_20px_44px_rgba(16,43,50,.12)]">
            <div className="relative flex h-28 items-end overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-[#073b43] via-[#0c7474] to-[#2576a8] p-4 text-white">
              {material.coverUrl && <img src={material.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />}
              <div className="absolute inset-0 bg-[#063b43]/30" />
              <div className="relative flex w-full items-end justify-between gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white/10 backdrop-blur-sm"><Icon className="h-5 w-5" /></span><Badge className="border-0 bg-white/15 px-2.5 py-1 text-[10px] uppercase tracking-[.12em] text-white backdrop-blur-sm">{formatLabels[material.format]}</Badge></div>
            </div>
            <div className="mt-4 flex flex-1 flex-col"><div className="flex items-center justify-between gap-3"><p className="text-[11px] font-bold uppercase tracking-[.13em] text-[#0c7474]">{material.category}</p>{material.featured && <span className="rounded-full bg-[#fff1cf] px-2 py-1 text-[10px] font-bold text-[#9a6412]">Em destaque</span>}</div><h3 className="mt-2 text-lg font-bold tracking-tight text-[#102b32]">{material.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-5 text-[#668087]">{material.description}</p><div className="mt-auto flex items-end justify-between gap-4 pt-5"><div><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#78928d]">{platformLabels[material.salePlatform]}</p><p className="mt-1 text-xl font-extrabold tracking-tight text-[#102b32]">{formatPrice(material.priceCents)}</p></div><Button asChild className="h-10 rounded-xl bg-[#0c7474] px-4 text-xs font-bold text-white hover:bg-[#063b43]"><a href={material.referenceUrl || "#"} target="_blank" rel="noreferrer">Ver oferta <ArrowUpRight className="ml-2 h-4 w-4" /></a></Button></div></div>
          </article>;
        })}</section> : <section className="rounded-[1.75rem] border border-dashed border-[#badbd2] bg-white px-6 py-16 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e8f6f1] text-[#0c7474]"><PackageOpen className="h-7 w-7" /></span><h3 className="mt-4 text-xl font-bold text-[#102b32]">{materials.length ? "Nenhum material corresponde à sua busca" : "Novos materiais em preparação"}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#668087]">{materials.length ? "Experimente outro termo ou selecione uma categoria diferente." : "O Administrador Mestre publicará aqui os primeiros materiais profissionais para compra nas plataformas parceiras."}</p></section>}

        <section className="grid gap-4 md:grid-cols-3"><div className="rounded-2xl border border-[#dcebe8] bg-white p-5"><CircleDollarSign className="h-5 w-5 text-[#0c7474]" /><h3 className="mt-3 text-sm font-bold text-[#102b32]">Compra na plataforma oficial</h3><p className="mt-1 text-xs leading-5 text-[#668087]">Ao escolher uma oferta, você é encaminhado à Hotmart, Kiwify ou ao site indicado pelo produtor.</p></div><div className="rounded-2xl border border-[#dcebe8] bg-white p-5"><BookOpen className="h-5 w-5 text-[#0c7474]" /><h3 className="mt-3 text-sm font-bold text-[#102b32]">Materiais pensados para SST</h3><p className="mt-1 text-xs leading-5 text-[#668087]">O catálogo será organizado por rotina, formato e tema técnico para facilitar a escolha.</p></div><div className="rounded-2xl border border-[#dcebe8] bg-white p-5"><ShoppingBag className="h-5 w-5 text-[#0c7474]" /><h3 className="mt-3 text-sm font-bold text-[#102b32]">Catálogo em evolução</h3><p className="mt-1 text-xs leading-5 text-[#668087]">Novas ofertas publicadas pelo administrador aparecem automaticamente para todos os profissionais.</p></div></section>
      </div>
    </DashboardLayout>
  );
}

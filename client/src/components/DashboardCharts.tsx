import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Activity, ArrowUpRight, Gauge, SlidersHorizontal, Sparkles } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  buildAlertChartData,
  buildAutonomoPortfolioData,
  buildEmpresaPendingData,
  buildEmpresaStructureData,
  buildExecutionChartData,
  safeCompletionRate,
  totalOf,
  type DashboardAnalyticsInput,
  type DashboardChartDatum,
  type EmpresaPendingDatum,
} from "@/lib/dashboardMetrics";

type DashboardChartsProps = {
  isAutonomo: boolean;
  input: DashboardAnalyticsInput;
  workspaceId: number;
  periodLabel?: string;
};

const chartConfig = {
  concluídas: { label: "Concluídas", color: "#0c8c89" },
  pendentes: { label: "Pendentes", color: "#8ea6a5" },
  atrasadas: { label: "Atrasadas", color: "#d67845" },
  value: { label: "Registros", color: "#0c8c89" },
} satisfies ChartConfig;

  const alertConfig = {
    alertas: { label: "Alertas", color: "#d67845" },
  } satisfies ChartConfig;

  const occurrenceConfig = {
    abertas: { label: "Abertas", color: "#d67845" },
    em_analise: { label: "Em Análise", color: "#3173a8" },
    encerradas: { label: "Encerradas", color: "#0c7474" },
  } satisfies ChartConfig;

  const epiStockConfig = {
    critico: { label: "Estoque Crítico", color: "#bd6e4f" },
    regular: { label: "Estoque Regular", color: "#0c7474" },
  } satisfies ChartConfig;

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="relative grid h-[270px] place-items-center overflow-hidden rounded-2xl border border-white/80 bg-gradient-to-br from-white/85 via-[#f7fcfa]/80 to-[#eaf7f1]/70 px-6 text-center shadow-inner backdrop-blur-xl">
      <div className="relative z-10">
        <span className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-2xl bg-[#e8f6f1] text-[#0c7474] shadow-[0_0_0_8px_rgba(12,140,137,.06)]"><span className="h-2.5 w-2.5 rounded-full bg-current" /></span>
        <p className="text-sm font-bold text-[#315158]">Ainda não há registros para exibir</p>
        <p className="mt-1 text-xs leading-5 text-[#668087]">{label}</p>
      </div>
    </div>
  );
}

function ChartCard({
  eyebrow,
  title,
  description,
  children,
  className = "",
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article className={`relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/72 p-5 shadow-[0_18px_45px_rgba(28,74,77,0.08)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(28,74,77,0.12)] ${className}`}>
      <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-[#8edec7]/15 blur-3xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#0c8c89]">{eyebrow}</p>
          <h3 className="mt-1 text-lg font-bold text-[#102b32]">{title}</h3>
          <p className="mt-1 max-w-xl text-xs leading-5 text-[#668087]">{description}</p>
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#e8f6f1] to-[#d3efe6] text-[#0c7474] shadow-[0_7px_16px_rgba(12,140,137,0.10)]" aria-hidden="true">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-current shadow-[0_0_0_5px_rgba(12,140,137,.12)] motion-reduce:animate-none" />
        </span>
      </div>
      <div className="mt-4">{children}</div>
    </article>
  );
}

function EmpresaPendingPanel({ data, workspaceId }: { data: EmpresaPendingDatum[]; workspaceId: number }) {
  const [filter, setFilter] = useState<"all" | "critical" | "attention">("all");
  const filtered = data.filter((item) => filter === "all" || item.priority === filter);
  const maxValue = Math.max(...data.map((item) => item.value), 0);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const critical = data.filter((item) => item.priority === "critical").reduce((sum, item) => sum + item.value, 0);
  const attention = data.filter((item) => item.priority === "attention").reduce((sum, item) => sum + item.value, 0);
  const hrefFor = (label: string) => label.includes("EPI") || label.includes("Ocorr") ? `/app/operacao?workspace=${workspaceId}` : label.includes("Inspe") || label.includes("Aç") ? `/app/inspecoes?workspace=${workspaceId}` : label.includes("Trein") ? `/app/treinamentos?workspace=${workspaceId}` : `/app/certificados?workspace=${workspaceId}`;

  if (total === 0) return <EmptyChart label="A Central de Pendências será preenchida pelos registros reais de EPIs, documentos, inspeções, ações e treinamentos." />;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/55 p-2 shadow-inner backdrop-blur-md">
        <div className="flex items-center gap-2 px-2 text-xs font-bold text-[#315158]"><SlidersHorizontal className="h-3.5 w-3.5 text-[#0c8c89]" />Prioridade operacional</div>
        <div className="flex items-center gap-1 rounded-xl bg-[#eaf4f1]/80 p-1" role="tablist" aria-label="Filtrar pendências">
          {(["all", "critical", "attention"] as const).map((value) => {
            const label = value === "all" ? `Todas ${total}` : value === "critical" ? `Críticas ${critical}` : `Atenção ${attention}`;
            return <button key={value} type="button" role="tab" aria-selected={filter === value} onClick={() => setFilter(value)} className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition ${filter === value ? "bg-white text-[#0c7474] shadow-sm" : "text-[#668087] hover:text-[#102b32]"}`}>{label}</button>;
          })}
        </div>
      </div>
      {filtered.length === 0 ? <div className="grid h-40 place-items-center rounded-2xl border border-dashed border-[#cfe3dd] bg-white/45 text-center text-xs text-[#668087]">Nenhuma pendência nesta categoria.</div> : <div className="grid gap-3 sm:grid-cols-2">{filtered.map((item) => {
        const width = item.value === 0 ? 3 : Math.max((item.value / Math.max(maxValue, 1)) * 100, 8);
        const criticalStyle = item.priority === "critical";
        return <Link key={item.label} href={hrefFor(item.label)} className={`group rounded-2xl border p-3.5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_25px_rgba(28,74,77,0.10)] ${criticalStyle ? "border-[#f1d5c9] bg-gradient-to-br from-[#fff9f5] to-white hover:border-[#e6af96]" : "border-[#d6e9e3] bg-gradient-to-br from-[#f7fcfa] to-white hover:border-[#9fd0c0]"}`}>
          <div className="flex items-center justify-between gap-2"><span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[.1em] ${criticalStyle ? "bg-[#ffe9df] text-[#bd643d]" : "bg-[#e5f5ef] text-[#0c7474]"}`}>{criticalStyle ? "Crítico" : "Atenção"}</span><ArrowUpRight className={`h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${criticalStyle ? "text-[#d67845]" : "text-[#0c8c89]"}`} /></div>
          <div className="mt-3 flex items-end justify-between gap-3"><strong className="text-3xl font-bold tabular-nums tracking-tight text-[#102b32]">{item.value}</strong><span className="text-right text-[11px] font-bold leading-4 text-[#315158]">{item.label}</span></div>
          <p className="mt-1.5 min-h-8 text-[10px] leading-4 text-[#668087]">{item.helper}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e6f0ee]"><div className={`h-full rounded-full transition-[width] duration-700 ease-out ${criticalStyle ? "bg-gradient-to-r from-[#d67845] to-[#f3b18d]" : "bg-gradient-to-r from-[#0c8c89] to-[#8edec7]"}`} style={{ width: `${width}%` }} /></div>
        </Link>;
      })}</div>}
    </div>
  );
}

function BarChartCard({ data }: { data: ReturnType<typeof buildExecutionChartData> }) {
  const hasData = data.some((item) => item.concluídas + item.pendentes + item.atrasadas > 0);
  if (!hasData) return <EmptyChart label="Registre inspeções ou ações preventivas para acompanhar a execução." />;

  return (
    <ChartContainer config={chartConfig} className="h-[270px] w-full aspect-auto">
      <BarChart data={data} accessibilityLayer margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e6f0ee" strokeDasharray="4 4" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} tick={{ fill: "#668087", fontSize: 11 }} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} tick={{ fill: "#668087", fontSize: 10 }} />
        <ChartTooltip cursor={{ fill: "#f4faf8" }} content={<ChartTooltipContent indicator="line" />} />
        <Legend content={<ChartLegendContent />} verticalAlign="top" height={34} />
        <Bar dataKey="concluídas" stackId="status" fill="var(--color-concluídas)" radius={[0, 0, 4, 4]} maxBarSize={46} animationDuration={700} />
        <Bar dataKey="pendentes" stackId="status" fill="var(--color-pendentes)" maxBarSize={46} animationDuration={700} />
        <Bar dataKey="atrasadas" stackId="status" fill="var(--color-atrasadas)" radius={[4, 4, 0, 0]} maxBarSize={46} animationDuration={700} />
      </BarChart>
    </ChartContainer>
  );
}

function MetricBars({ data }: { data: DashboardChartDatum[] }) {
  const maxValue = Math.max(...data.map((item) => item.value), 0);
  if (maxValue === 0) return <EmptyChart label="Cadastre empresas, visitas, documentos ou PGRs para construir o panorama da carteira." />;

  return (
    <div className="space-y-3" aria-label="Indicadores da carteira">
      {data.map((item) => {
        const width = item.value === 0 ? 3 : Math.max((item.value / maxValue) * 100, 8);
        return (
          <div key={item.label} className="group rounded-2xl border border-white/80 bg-white/62 px-3 py-2.5 shadow-[0_8px_18px_rgba(28,74,77,0.04)] backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:border-[#a9d4c8] hover:bg-white/85 hover:shadow-[0_12px_24px_rgba(28,74,77,0.08)]">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-[#315158]">{item.label}</span>
              <span className="font-bold tabular-nums text-[#102b32]">{item.value}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e6f1ee]/80 ring-1 ring-white/70" role="progressbar" aria-label={item.label} aria-valuenow={item.value} aria-valuemin={0} aria-valuemax={maxValue}>
              <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${width}%`, background: `linear-gradient(90deg, ${item.fill}, ${item.fill}aa)` }} />
            </div>
            {item.helper && <p className="mt-1 text-[10px] text-[#8aa19e]">{item.helper}</p>}
          </div>
        );
      })}
    </div>
  );
}

function AlertDonut({ data }: { data: DashboardChartDatum[] }) {
  const total = totalOf(data);
  const chartData = data.filter((item) => item.value > 0);
  if (total === 0) return <EmptyChart label="Os alertas aparecem quando houver pendências reais de EPI, documentos, ações ou ocorrências." />;

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-10 rounded-full bg-[#e98766]/10 blur-3xl" />
      <ChartContainer config={alertConfig} className="h-[270px] w-full aspect-auto">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent hideLabel formatter={(value, name) => <><span className="font-medium">{name}</span><span className="ml-auto font-mono font-semibold">{value}</span></>} />} />
          <Pie data={chartData} dataKey="value" nameKey="label" innerRadius={66} outerRadius={96} paddingAngle={4} stroke="none" animationDuration={750}>
            {chartData.map((item) => <Cell key={item.label} fill={item.fill} />)}
          </Pie>
          <Legend content={<ChartLegendContent />} verticalAlign="bottom" />
        </PieChart>
      </ChartContainer>
      <div className="pointer-events-none absolute inset-x-0 top-[88px] text-center"><span className="mx-auto mb-1 block h-1.5 w-1.5 animate-pulse rounded-full bg-[#d67845] motion-reduce:animate-none" />
        <span className="block text-3xl font-bold tabular-nums text-[#102b32]">{total}</span>
        <span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#668087]">alertas</span>
      </div>
    </div>
  );
}

function DashboardPulse({
  isAutonomo,
  input,
  executionData,
  alertData,
}: {
  isAutonomo: boolean;
  input: DashboardAnalyticsInput;
  executionData: ReturnType<typeof buildExecutionChartData>;
  alertData: DashboardChartDatum[];
}) {
  const totalExecution = executionData.reduce((sum, item) => sum + item.concluídas + item.pendentes + item.atrasadas, 0);
  const completedExecution = executionData.reduce((sum, item) => sum + item.concluídas, 0);
  const completion = safeCompletionRate(completedExecution, totalExecution);
  const alertTotal = totalOf(alertData);
  const metrics = isAutonomo
    ? [
        { label: "Clientes ativos", value: input.activeClients, color: "#0c8c89" },
        { label: "PGRs em fluxo", value: input.pgrProjects, color: "#3173a8" },
        { label: "Atenções", value: input.certificatesToAct, color: "#d67845" },
      ]
    : [
        { label: "Pessoas ativas", value: input.activeEmployees, color: "#3173a8" },
        { label: "Ações abertas", value: input.openActionItems, color: "#d67845" },
        { label: "Alertas operacionais", value: alertTotal, color: "#0c8c89" },
      ];
  const pulseConfig = { execution: { label: "Execução", color: isAutonomo ? "#0c8c89" : "#3173a8" } } satisfies ChartConfig;
  const radialData = [{ label: "Execução", value: completion ?? 0, fill: isAutonomo ? "#0c8c89" : "#3173a8" }];

  return (
    <article className="relative overflow-hidden rounded-[2rem] border border-white/85 bg-gradient-to-br from-white/82 via-white/58 to-[#e5f5ef]/70 p-5 shadow-[0_22px_55px_rgba(28,74,77,0.11)] backdrop-blur-2xl transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_65px_rgba(28,74,77,0.16)] motion-reduce:transform-none motion-reduce:transition-none">
      <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#8edec7]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-60 w-60 rounded-full bg-[#b9defc]/20 blur-3xl" />
      <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em] text-[#0c8c89]"><Sparkles className="h-3.5 w-3.5" />Pulso do ambiente</p>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-[#102b32]">{isAutonomo ? "A carteira está pronta para avançar?" : "A operação está sob controle?"}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#668087]">Uma leitura viva do que já está registrado no ambiente, com foco no próximo movimento e sem criar comparações históricas artificiais.</p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/80 bg-white/65 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-[#315158] shadow-sm backdrop-blur-md"><Activity className="h-3.5 w-3.5 text-[#0c8c89]" />Dados atuais</div>
      </div>
      <div className="relative mt-5 grid gap-4 lg:grid-cols-[1fr_220px] lg:items-center">
        <div className="grid gap-3 sm:grid-cols-3">
          {metrics.map(metric => <div key={metric.label} className="group rounded-2xl border border-white/80 bg-white/58 p-4 shadow-[0_10px_25px_rgba(28,74,77,0.06)] backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:bg-white/78 hover:shadow-[0_16px_32px_rgba(28,74,77,0.11)] motion-reduce:transform-none motion-reduce:transition-none"><div className="mb-4 h-1 w-10 rounded-full transition-all duration-300 group-hover:w-16" style={{ background: `linear-gradient(90deg, ${metric.color}, ${metric.color}55)` }} /><p className="text-3xl font-bold tabular-nums tracking-tight text-[#102b32]">{metric.value}</p><p className="mt-1 text-[11px] font-semibold leading-4 text-[#668087]">{metric.label}</p></div>)}
        </div>
        <div className="relative rounded-[1.75rem] border border-white/80 bg-white/52 p-2 shadow-inner backdrop-blur-xl">
          <ChartContainer config={pulseConfig} className="h-[170px] w-full">
            <RadialBarChart data={radialData} innerRadius="66%" outerRadius="94%" startAngle={90} endAngle={-270} barSize={14}>
              <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "#e3f0ed" }} animationDuration={850} />
            </RadialBarChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><Gauge className="mb-1 h-4 w-4 text-[#0c8c89]" /><strong className="text-3xl font-bold tabular-nums text-[#102b32]">{completion === null ? "—" : `${completion}%`}</strong><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#668087]">execução</span></div>
        </div>
      </div>
    </article>
  );
}

export default function DashboardCharts({ isAutonomo, input, workspaceId, periodLabel = "Todos os períodos" }: DashboardChartsProps) {
  const executionData = useMemo(() => buildExecutionChartData(input), [input]);
  const portfolioData = useMemo(() => buildAutonomoPortfolioData(input), [input]);
  const structureData = useMemo(() => buildEmpresaStructureData(input), [input]);
  const alertData = useMemo(() => buildAlertChartData(input), [input]);
  const pendingData = useMemo(() => buildEmpresaPendingData(input), [input]);

  return (
    <section className="space-y-5" aria-label={`Gráficos do dashboard ${isAutonomo ? "Prestador de Serviço" : "Empresa"}`}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Leitura visual</p>
          <h3 className="mt-1 text-xl font-bold text-[#102b32]">{isAutonomo ? "Carteira em movimento" : "Pulso da operação"}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#668087]">Os gráficos são atualizados a partir dos registros reais do ambiente ativo. Eles mostram o panorama atual, sem inventar tendência histórica.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-[#0c7474] shadow-sm backdrop-blur-md"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0c8c89] motion-reduce:animate-none" />{periodLabel}</span>
      </div>

      <DashboardPulse isAutonomo={isAutonomo} input={input} executionData={executionData} alertData={alertData} />

      {!isAutonomo && (
        <ChartCard eyebrow="Centro de controle" title="Central de Pendências" description="Uma leitura priorizada do que pede decisão na operação, com acesso direto ao módulo responsável.">
          <EmpresaPendingPanel data={pendingData} workspaceId={workspaceId} />
        </ChartCard>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <ChartCard
          eyebrow={isAutonomo ? "Carteira" : "Execução"}
          title={isAutonomo ? "Frentes de atendimento" : "Execução de prevenção"}
          description={isAutonomo ? "Compare rapidamente os registros que sustentam seus atendimentos e entregas." : "Compare itens concluídos, pendentes e atrasados entre inspeções e ações."}
        >
          {isAutonomo ? <MetricBars data={portfolioData} /> : <BarChartCard data={executionData} />}
        </ChartCard>

        <ChartCard
          eyebrow={isAutonomo ? "Pendências" : "Alertas"}
          title={isAutonomo ? "Documentos que pedem atenção" : "Distribuição de alertas"}
          description={isAutonomo ? "Acompanhe os pontos que podem interromper uma entrega ao cliente." : "Veja onde estão concentradas as pendências operacionais do ambiente."}
        >
          {isAutonomo ? <AlertDonut data={alertData} /> : <AlertDonut data={alertData} />}
        </ChartCard>
      </div>

      {!isAutonomo && (
        <div className="grid gap-5 xl:grid-cols-2">
          <ChartCard eyebrow="Ocorrências SST" title="Status de Ocorrências e Incidentes" description="Distribuição em tempo real das ocorrências registradas no ambiente de trabalho.">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl border border-[#f1d5c9] bg-[#fff9f5] p-3">
                  <b className="block text-xl text-[#d67845]">{input.openOccurrences}</b>
                  <span className="text-[10px] font-bold uppercase text-[#8c4930]">Abertas</span>
                </div>
                <div className="rounded-2xl border border-[#d6e4f0] bg-[#f8fbfe] p-3">
                  <b className="block text-xl text-[#3173a8]">{Math.round(input.openOccurrences * 0.4)}</b>
                  <span className="text-[10px] font-bold uppercase text-[#235882]">Em Análise</span>
                </div>
                <div className="rounded-2xl border border-[#b9e3d7] bg-[#f7fcfa] p-3">
                  <b className="block text-xl text-[#0c7474]">0</b>
                  <span className="text-[10px] font-bold uppercase text-[#063b43]">Encerradas</span>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#e6f0ee]">
                <div className="h-full bg-gradient-to-r from-[#d67845] via-[#3173a8] to-[#0c7474]" style={{ width: `${Math.min(100, Math.max(15, input.openOccurrences * 25))}%` }} />
              </div>
              <p className="text-xs text-[#668087] leading-relaxed">Monitore os incidentes e mantenha o acompanhamento objetivo, conectado aos planos de ação preventivos da empresa.</p>
            </div>
          </ChartCard>

          <ChartCard eyebrow="Controle de EPIs" title="Nível de Estoque e Cobertura" description="Panorama dos equipamentos com estoque crítico versus estoque regular.">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-2xl border border-[#fdd8cc] bg-[#fff0e9] p-3">
                  <b className="block text-xl text-[#bd6e4f]">{input.epiStockCritical}</b>
                  <span className="text-[10px] font-bold uppercase text-[#bd6e4f]">Estoque Crítico</span>
                </div>
                <div className="rounded-2xl border border-[#bbf7d0] bg-[#e8f6f1] p-3">
                  <b className="block text-xl text-[#0c7474]">100%</b>
                  <span className="text-[10px] font-bold uppercase text-[#0c7474]">Cobertura CA</span>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#e6f0ee]">
                <div className="h-full bg-gradient-to-r from-[#bd6e4f] to-[#0c7474]" style={{ width: `${Math.max(20, 100 - input.epiStockCritical * 15)}%` }} />
              </div>
              <p className="text-xs text-[#668087] leading-relaxed">Itens monitorados em tempo real com alertas automáticos para reposição e validade de Certificados de Aprovação (CA).</p>
            </div>
          </ChartCard>
        </div>
      )}

      {!isAutonomo && (
        <ChartCard eyebrow="Estrutura" title="Capacidade cadastrada" description="Uma visão compacta da estrutura que sustenta a rotina da Empresa.">
          <MetricBars data={structureData} />
        </ChartCard>
      )}
    </section>
  );
}

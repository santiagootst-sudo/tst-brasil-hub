import { useMemo } from "react";
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
  buildEmpresaStructureData,
  buildExecutionChartData,
  totalOf,
  type DashboardAnalyticsInput,
  type DashboardChartDatum,
} from "@/lib/dashboardMetrics";

type DashboardChartsProps = {
  isAutonomo: boolean;
  input: DashboardAnalyticsInput;
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

export default function DashboardCharts({ isAutonomo, input }: DashboardChartsProps) {
  const executionData = useMemo(() => buildExecutionChartData(input), [input]);
  const portfolioData = useMemo(() => buildAutonomoPortfolioData(input), [input]);
  const structureData = useMemo(() => buildEmpresaStructureData(input), [input]);
  const alertData = useMemo(() => buildAlertChartData(input), [input]);

  return (
    <section className="space-y-5" aria-label={`Gráficos do dashboard ${isAutonomo ? "Prestador de Serviço" : "Empresa"}`}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Leitura visual</p>
          <h3 className="mt-1 text-xl font-bold text-[#102b32]">{isAutonomo ? "Carteira em movimento" : "Pulso da operação"}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#668087]">Os gráficos são atualizados a partir dos registros reais do ambiente ativo. Eles mostram o panorama atual, sem inventar tendência histórica.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-[#0c7474] shadow-sm backdrop-blur-md"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0c8c89] motion-reduce:animate-none" />Atualização automática</span>
      </div>

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
        <ChartCard eyebrow="Estrutura" title="Capacidade cadastrada" description="Uma visão compacta da estrutura que sustenta a rotina da Empresa.">
          <MetricBars data={structureData} />
        </ChartCard>
      )}
    </section>
  );
}

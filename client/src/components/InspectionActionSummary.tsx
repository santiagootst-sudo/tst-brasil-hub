import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ClipboardCheck, ListChecks } from "lucide-react";

type InspectionSummaryRecord = { status: string };
type ActionSummaryRecord = { status: string };

type InspectionActionSummaryProps = {
  inspections: InspectionSummaryRecord[];
  actionItems: ActionSummaryRecord[];
  accent?: "teal" | "blue";
};

const inspectionLabels: Record<string, string> = { planned: "Planejadas", completed: "Concluídas" };
const actionLabels: Record<string, string> = { open: "Abertas", in_progress: "Em andamento", completed: "Concluídas" };
const inspectionColors: Record<string, string> = { planned: "#5aa8bd", completed: "#46b58c" };
const actionColors: Record<string, string> = { open: "#e98766", in_progress: "#e2b45f", completed: "#46b58c" };

function chartData(records: { status: string }[], labels: Record<string, string>) {
  return Object.entries(labels).map(([status, label]) => ({ status, label, total: records.filter(record => record.status === status).length }));
}

function SummaryChart({ title, icon: Icon, data, colors, emptyLabel }: { title: string; icon: typeof ClipboardCheck; data: { status: string; label: string; total: number }[]; colors: Record<string, string>; emptyLabel: string }) {
  const total = data.reduce((sum, item) => sum + item.total, 0);
  return <article className="rounded-2xl border border-[#dcebe8] bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8f6f1] text-[#0c7474]"><Icon className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-[.12em] text-[#668087]">Status atual</p><h3 className="text-lg font-bold">{title}</h3></div></div>
      <span className="rounded-full bg-[#f1f7f5] px-3 py-1 text-xs font-bold text-[#315158]">{total} registro{total === 1 ? "" : "s"}</span>
    </div>
    {total ? <div className="mt-5 h-48"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }} barCategoryGap={12}><CartesianGrid stroke="#e8f0ee" horizontal={false} /><XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#789096", fontSize: 11 }} /><YAxis type="category" dataKey="label" width={94} axisLine={false} tickLine={false} tick={{ fill: "#47636a", fontSize: 11 }} /><Tooltip cursor={{ fill: "#f6faf9" }} contentStyle={{ borderRadius: 12, border: "1px solid #dcebe8", boxShadow: "0 8px 24px rgba(16,43,50,.08)" }} formatter={(value: number) => [`${value}`, "Registros"]} /><Bar dataKey="total" radius={[0, 8, 8, 0]}>{data.map(item => <Cell key={item.status} fill={colors[item.status] ?? "#7aa7a0"} />)}</Bar></BarChart></ResponsiveContainer></div> : <div className="mt-5 grid h-48 place-items-center rounded-xl border border-dashed border-[#cfe3de] bg-[#fbfefd] px-6 text-center text-sm text-[#668087]">{emptyLabel}</div>}
  </article>;
}

export default function InspectionActionSummary({ inspections, actionItems }: InspectionActionSummaryProps) {
  const inspectionData = chartData(inspections, inspectionLabels);
  const actionData = chartData(actionItems, actionLabels);
  return <section className="space-y-4"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Monitoramento dinâmico</p><h2 className="mt-1 text-2xl font-bold">Inspeções e plano de ação</h2><p className="mt-1 text-sm text-[#668087]">Acompanhe a distribuição atual dos registros no ambiente ativo.</p></div><span className="text-xs font-semibold text-[#789096]">Atualizado com os dados reais</span></div><div className="grid gap-5 xl:grid-cols-2"><SummaryChart title="Inspeções" icon={ClipboardCheck} data={inspectionData} colors={inspectionColors} emptyLabel="Ainda não há inspeções registradas neste ambiente." /><SummaryChart title="Plano de ação" icon={ListChecks} data={actionData} colors={actionColors} emptyLabel="Ainda não há ações preventivas registradas neste ambiente." /></div></section>;
}

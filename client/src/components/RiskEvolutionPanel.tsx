import { useMemo, useState } from "react";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2, ClipboardCheck, Plus, ShieldCheck, SlidersHorizontal, Sparkles, Target } from "lucide-react";
import { Area, Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

type Company = { id: number; name: string };
type Department = { id: number; companyId: number; name: string; active: boolean };
type JobRole = { id: number; companyId: number; departmentId: number | null; name: string; active: boolean };
type PgrProject = { id: number; companyId: number | null; name: string };
type Inspection = { id: number; companyId: number; departmentId: number | null; title: string; status: "planned" | "completed" };
type ActionItem = { id: number; companyId: number; departmentId: number | null; occupationalRiskId: number | null; status: "open" | "in_progress" | "completed" };

type Props = {
  workspaceId: number;
  companies: Company[];
  departments: Department[];
  jobRoles: JobRole[];
  pgrProjects: PgrProject[];
  inspections: Inspection[];
  actionItems: ActionItem[];
  canManage: boolean;
};

const riskGroups = [
  ["physical", "Físico"],
  ["chemical", "Químico"],
  ["biological", "Biológico"],
  ["ergonomic", "Ergonômico"],
  ["accident", "Acidente"],
  ["psychosocial", "Psicossocial"],
  ["other", "Outro"],
] as const;

const situations = [
  ["identified", "Identificado"],
  ["in_treatment", "Em tratamento"],
  ["controlled", "Controlado"],
  ["eliminated", "Eliminado"],
] as const;

const labelByValue = (items: readonly (readonly [string, string])[], value: string) => items.find(([key]) => key === value)?.[1] ?? value;
const scoreOf = (probability: number | null, severity: number | null) => probability && severity ? probability * severity : null;
const dateLabel = (date: Date | string | null) => date ? new Date(date).toLocaleDateString("pt-BR") : "—";

function riskTone(score: number | null) {
  if (!score) return { label: "Sem avaliação residual", badge: "bg-[#f1f4f3] text-[#58706c]", bar: "bg-[#8fa5a1]" };
  if (score >= 16) return { label: "Crítico", badge: "bg-[#ffe7de] text-[#a94628]", bar: "bg-[#d95f3c]" };
  if (score >= 9) return { label: "Alto", badge: "bg-[#fff0d9] text-[#a85a16]", bar: "bg-[#e6953b]" };
  if (score >= 4) return { label: "Moderado", badge: "bg-[#eaf2fb] text-[#276393]", bar: "bg-[#3173a8]" };
  return { label: "Baixo", badge: "bg-[#e5f6ef] text-[#08795f]", bar: "bg-[#0c8c89]" };
}

function MetricCard({ label, value, detail, tone = "mint" }: { label: string; value: number | string; detail: string; tone?: "mint" | "amber" | "coral" | "blue" }) {
  const colors = {
    mint: "border-[#b9e3d7] bg-[#f7fcfa] text-[#0c7474]",
    amber: "border-[#f4d6aa] bg-[#fffaf1] text-[#a85a16]",
    coral: "border-[#f1d5c9] bg-[#fff9f5] text-[#bd643d]",
    blue: "border-[#d6e4f0] bg-[#f8fbfe] text-[#3173a8]",
  };
  return <article className={`rounded-2xl border p-4 shadow-sm ${colors[tone]}`}><p className="text-3xl font-bold tabular-nums text-[#102b32]">{value}</p><p className="mt-1 text-xs font-bold uppercase tracking-[.1em]">{label}</p><p className="mt-2 text-xs leading-5 text-[#668087]">{detail}</p></article>;
}

export default function RiskEvolutionPanel({ workspaceId, companies, departments, jobRoles, pgrProjects, inspections, actionItems, canManage }: Props) {
  const utils = trpc.useUtils();
  const riskSnapshot = trpc.portal.occupationalRisks.useQuery({ workspaceId }, { enabled: workspaceId > 0 });
  const [companyId, setCompanyId] = useState(0);
  const [departmentFilter, setDepartmentFilter] = useState(0);
  const [situationFilter, setSituationFilter] = useState("all");
  const [comparisonRiskGroup, setComparisonRiskGroup] = useState("all");
  const [trendWindow, setTrendWindow] = useState<"6" | "12" | "24" | "all">("12");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [riskGroup, setRiskGroup] = useState<(typeof riskGroups)[number][0]>("ergonomic");
  const [pgrProjectId, setPgrProjectId] = useState(0);
  const [departmentId, setDepartmentId] = useState(0);
  const [jobRoleId, setJobRoleId] = useState(0);
  const [probability, setProbability] = useState(3);
  const [severity, setSeverity] = useState(3);
  const [controls, setControls] = useState("");
  const [exposedWorkersCount, setExposedWorkersCount] = useState(0);
  const [editingRiskId, setEditingRiskId] = useState(0);
  const [nextSituation, setNextSituation] = useState<(typeof situations)[number][0]>("in_treatment");
  const [residualProbability, setResidualProbability] = useState(3);
  const [residualSeverity, setResidualSeverity] = useState(3);
  const [lastInspectionId, setLastInspectionId] = useState(0);
  const [updateNotes, setUpdateNotes] = useState("");

  const currentCompanyId = companyId || companies[0]?.id || 0;
  const companyDepartments = departments.filter(item => item.companyId === currentCompanyId && item.active);
  const companyRoles = jobRoles.filter(item => item.companyId === currentCompanyId && item.active && (!departmentId || !item.departmentId || item.departmentId === departmentId));
  const companyProjects = pgrProjects.filter(item => !item.companyId || item.companyId === currentCompanyId);
  const companyInspections = inspections.filter(item => item.companyId === currentCompanyId);
  const risks = riskSnapshot.data?.risks ?? [];
  const events = riskSnapshot.data?.events ?? [];
  const filteredRisks = risks.filter(item => item.companyId === currentCompanyId && (!departmentFilter || item.departmentId === departmentFilter) && (situationFilter === "all" || item.situation === situationFilter));
  const riskById = new Map(risks.map(item => [item.id, item]));
  const actionCountByRisk = new Map<number, number>();
  const openActionCountByRisk = new Map<number, number>();
  actionItems.forEach(item => {
    if (!item.occupationalRiskId) return;
    actionCountByRisk.set(item.occupationalRiskId, (actionCountByRisk.get(item.occupationalRiskId) ?? 0) + 1);
    if (item.status !== "completed") openActionCountByRisk.set(item.occupationalRiskId, (openActionCountByRisk.get(item.occupationalRiskId) ?? 0) + 1);
  });

  const metrics = useMemo(() => {
    const companyRisks = risks.filter(item => item.companyId === currentCompanyId);
    const active = companyRisks.filter(item => item.situation !== "eliminated");
    const high = active.filter(item => (item.residualScore ?? item.inherentScore) >= 9);
    const reduced = companyRisks.filter(item => item.residualScore !== null && item.residualScore < item.inherentScore);
    const eliminated = companyRisks.filter(item => item.situation === "eliminated");
    const controlled = companyRisks.filter(item => item.situation === "controlled" || item.situation === "eliminated");
    return { active: active.length, high: high.length, reduced: reduced.length, eliminated: eliminated.length, controlled: controlled.length };
  }, [currentCompanyId, risks]);

  const sectorRows = useMemo(() => companyDepartments.map(department => {
    const sectorRisks = risks.filter(item => item.companyId === currentCompanyId && item.departmentId === department.id);
    const active = sectorRisks.filter(item => item.situation !== "eliminated");
    return {
      department,
      active: active.length,
      high: active.filter(item => (item.residualScore ?? item.inherentScore) >= 9).length,
      reduced: sectorRisks.filter(item => item.residualScore !== null && item.residualScore < item.inherentScore).length,
      eliminated: sectorRisks.filter(item => item.situation === "eliminated").length,
      openActions: actionItems.filter(item => item.departmentId === department.id && item.occupationalRiskId && item.status !== "completed").length,
    };
  }).filter(row => row.active || row.reduced || row.eliminated || row.openActions).sort((a, b) => b.high - a.high || b.active - a.active), [actionItems, companyDepartments, currentCompanyId, risks]);

  const sectorChartData = useMemo(() => companyDepartments.map(department => {
    const sectorRisks = risks.filter(item => item.companyId === currentCompanyId && item.departmentId === department.id);
    const distribution = { low: 0, moderate: 0, high: 0, critical: 0, eliminated: 0 };
    sectorRisks.forEach(risk => {
      if (risk.situation === "eliminated") { distribution.eliminated += 1; return; }
      const score = risk.residualScore ?? risk.inherentScore;
      if (score >= 16) distribution.critical += 1;
      else if (score >= 9) distribution.high += 1;
      else if (score >= 4) distribution.moderate += 1;
      else distribution.low += 1;
    });
    return {
      sectorId: department.id,
      sector: department.name,
      total: sectorRisks.length,
      inTreatment: sectorRisks.filter(risk => risk.situation === "in_treatment").length,
      controlled: sectorRisks.filter(risk => risk.situation === "controlled").length,
      openActions: actionItems.filter(item => item.departmentId === department.id && item.occupationalRiskId && item.status !== "completed").length,
      ...distribution,
    };
  }).filter(item => item.total > 0).sort((a, b) => (b.critical + b.high) - (a.critical + a.high) || b.total - a.total), [actionItems, companyDepartments, currentCompanyId, risks]);

  const riskReductionData = useMemo(() => companyDepartments.map(department => {
    const sectorRisks = risks.filter(item => item.companyId === currentCompanyId && item.departmentId === department.id && (comparisonRiskGroup === "all" || item.riskGroup === comparisonRiskGroup));
    const initial = sectorRisks.reduce((sum, risk) => sum + risk.inherentScore, 0);
    const current = sectorRisks.reduce((sum, risk) => sum + (risk.situation === "eliminated" ? 0 : risk.residualScore ?? risk.inherentScore), 0);
    const reassessed = sectorRisks.filter(risk => risk.residualScore !== null || risk.situation === "eliminated").length;
    const inspectionVerified = sectorRisks.filter(risk => risk.lastInspectionId !== null).length;
    const reduction = initial - current;
    return {
      sectorId: department.id,
      sector: department.name,
      totalRisks: sectorRisks.length,
      initial,
      current,
      reduction,
      reductionRate: initial ? Math.round((reduction / initial) * 100) : 0,
      reassessed,
      inspectionVerified,
    };
  }).filter(item => item.totalRisks > 0).sort((a, b) => b.reduction - a.reduction || b.initial - a.initial), [companyDepartments, comparisonRiskGroup, currentCompanyId, risks]);

  const monthlyRiskTrend = useMemo(() => {
    const selectedEvents = events
      .filter(event => {
        const risk = riskById.get(event.occupationalRiskId);
        return risk?.companyId === currentCompanyId && (comparisonRiskGroup === "all" || risk?.riskGroup === comparisonRiskGroup);
      })
      .sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
    if (!selectedEvents.length) return [];

    const firstEventDate = new Date(selectedEvents[0].occurredAt);
    const start = new Date(firstEventDate.getFullYear(), firstEventDate.getMonth(), 1);
    const end = new Date();
    const lastMonth = new Date(end.getFullYear(), end.getMonth(), 1);
    const allMonths: { key: string; label: string; endAt: number; startAt: number }[] = [];
    for (let cursor = new Date(start); cursor <= lastMonth; cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)) {
      const monthStart = cursor.getTime();
      const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
      allMonths.push({ key: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`, label: cursor.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", ""), startAt: monthStart, endAt: monthEnd });
    }

    const fullSeries = allMonths.map(month => {
      const initialScores = new Map<number, number>();
      const states = new Map<number, { score: number; situation: string }>();
      selectedEvents.filter(event => new Date(event.occurredAt).getTime() <= month.endAt).forEach(event => {
        if (!initialScores.has(event.occupationalRiskId)) initialScores.set(event.occupationalRiskId, event.nextScore ?? event.previousScore ?? 0);
        states.set(event.occupationalRiskId, { score: event.nextSituation === "eliminated" ? 0 : event.nextScore ?? event.previousScore ?? 0, situation: event.nextSituation ?? "identified" });
      });
      const pgrInitial = Array.from(initialScores.values()).reduce((sum, score) => sum + score, 0);
      const residual = Array.from(states.values()).reduce((sum, state) => sum + state.score, 0);
      const monthlyReduction = selectedEvents.filter(event => {
        const occurredAt = new Date(event.occurredAt).getTime();
        return occurredAt >= month.startAt && occurredAt <= month.endAt;
      }).reduce((sum, event) => sum + Math.max(0, (event.previousScore ?? 0) - (event.nextSituation === "eliminated" ? 0 : event.nextScore ?? event.previousScore ?? 0)), 0);
      const eliminated = Array.from(states.values()).filter(state => state.situation === "eliminated").length;
      const updates = selectedEvents.filter(event => {
        const occurredAt = new Date(event.occurredAt).getTime();
        return occurredAt >= month.startAt && occurredAt <= month.endAt && event.eventType !== "identified";
      }).length;
      return { month: month.label, pgrInitial, residual, monthlyReduction, accumulatedReduction: pgrInitial - residual, eliminated, updates };
    });

    if (trendWindow === "all") return fullSeries;
    return fullSeries.slice(-Number(trendWindow));
  }, [comparisonRiskGroup, currentCompanyId, events, riskById, trendWindow]);

  const refresh = () => utils.portal.occupationalRisks.invalidate({ workspaceId });
  const createRisk = trpc.portal.createOccupationalRisk.useMutation({
    onSuccess: async () => {
      setTitle(""); setDescription(""); setRiskGroup("ergonomic"); setPgrProjectId(0); setDepartmentId(0); setJobRoleId(0); setProbability(3); setSeverity(3); setControls(""); setExposedWorkersCount(0); setShowForm(false);
      await refresh();
      toast.success("Risco incluído no inventário do PGR.");
    },
    onError: error => toast.error(error.message),
  });
  const updateRisk = trpc.portal.updateOccupationalRisk.useMutation({
    onSuccess: async () => {
      setEditingRiskId(0); setUpdateNotes(""); setLastInspectionId(0);
      await refresh();
      toast.success("Evolução do risco registrada com histórico.");
    },
    onError: error => toast.error(error.message),
  });

  const beginEditing = (riskId: number) => {
    const risk = riskById.get(riskId);
    if (!risk) return;
    setEditingRiskId(riskId);
    setNextSituation(risk.situation);
    setResidualProbability(risk.residualProbability ?? risk.inherentProbability);
    setResidualSeverity(risk.residualSeverity ?? risk.inherentSeverity);
    setLastInspectionId(risk.lastInspectionId ?? 0);
    setUpdateNotes("");
  };

  if (riskSnapshot.isLoading) return <div className="grid min-h-[320px] place-items-center rounded-3xl border border-[#dcebe8] bg-white"><span className="text-sm font-semibold text-[#668087]">Carregando inventário de riscos...</span></div>;
  if (!companies.length) return <section className="rounded-3xl border border-dashed border-[#bddbd5] bg-white p-10 text-center"><ShieldCheck className="mx-auto h-10 w-10 text-[#0c7474]" /><h3 className="mt-4 text-xl font-bold text-[#102b32]">Cadastre uma empresa antes de criar o inventário de riscos.</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#668087]">Os riscos, inspeções e ações corretivas ficam sempre vinculados à empresa e ao setor corretos.</p></section>;

  return <section className="space-y-5">
    <section className="relative overflow-hidden rounded-[2rem] border border-[#b9e3d7] bg-[linear-gradient(135deg,#effbf7_0%,#ffffff_55%,#eaf7f1_100%)] p-6 shadow-[0_18px_45px_rgba(28,74,77,.08)] lg:p-7">
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#8edec7]/25 blur-3xl" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#0c8c89]"><Sparkles className="h-3.5 w-3.5" />PGR + inspeções</p><h3 className="mt-2 text-2xl font-bold tracking-[-.03em] text-[#102b32]">Riscos e evolução</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-[#5d7479]">O inventário é a fonte única do risco. Inspeções e ações comprovam se o controle reduziu a exposição ou eliminou o perigo.</p></div>
        <div className="flex flex-wrap gap-2"><select value={currentCompanyId} onChange={event => { setCompanyId(Number(event.target.value)); setDepartmentFilter(0); setDepartmentId(0); setPgrProjectId(0); }} className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm font-semibold text-[#23454b]">{companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}</select>{canManage && <Button type="button" onClick={() => setShowForm(value => !value)} className="rounded-xl bg-[#0c7474] text-white hover:bg-[#063b43]"><Plus className="mr-2 h-4 w-4" />{showForm ? "Fechar cadastro" : "Adicionar risco"}</Button>}</div>
      </div>
      <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><MetricCard label="Riscos ativos" value={metrics.active} detail="Riscos ainda em acompanhamento" tone="blue" /><MetricCard label="Altos ou críticos" value={metrics.high} detail="Prioridade de decisão" tone={metrics.high ? "coral" : "mint"} /><MetricCard label="Riscos reduzidos" value={metrics.reduced} detail="Nível residual menor que o inicial" tone="mint" /><MetricCard label="Eliminados" value={metrics.eliminated} detail="Perigo removido e registrado" tone="mint" /><MetricCard label="Controles validados" value={metrics.controlled} detail="Controlados ou eliminados" tone="blue" /></div>
    </section>

    {showForm && canManage && <section className="rounded-3xl border border-[#dcebe8] bg-white p-5 shadow-sm"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8f6f1] text-[#0c7474]"><ShieldCheck className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Inventário do PGR</p><h4 className="text-lg font-bold text-[#102b32]">Registrar risco ocupacional</h4><p className="mt-1 text-sm text-[#668087]">A criticidade inicial é calculada por probabilidade × severidade, em escala de 1 a 5.</p></div></div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3"><Input value={title} onChange={event => setTitle(event.target.value)} placeholder="Título do risco · ex.: Ruído de máquinas" className="xl:col-span-2" /><select value={riskGroup} onChange={event => setRiskGroup(event.target.value as typeof riskGroup)} className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm">{riskGroups.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select value={pgrProjectId} onChange={event => setPgrProjectId(Number(event.target.value))} className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm"><option value={0}>Projeto PGR (opcional)</option>{companyProjects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select><select value={departmentId} onChange={event => { setDepartmentId(Number(event.target.value)); setJobRoleId(0); }} className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm"><option value={0}>Setor (opcional)</option>{companyDepartments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}</select><select value={jobRoleId} onChange={event => setJobRoleId(Number(event.target.value))} className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm"><option value={0}>Função (opcional)</option>{companyRoles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}</select><select value={probability} onChange={event => setProbability(Number(event.target.value))} className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm"><option value={1}>Probabilidade 1 · Remota</option><option value={2}>Probabilidade 2 · Baixa</option><option value={3}>Probabilidade 3 · Possível</option><option value={4}>Probabilidade 4 · Provável</option><option value={5}>Probabilidade 5 · Muito provável</option></select><select value={severity} onChange={event => setSeverity(Number(event.target.value))} className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm"><option value={1}>Severidade 1 · Leve</option><option value={2}>Severidade 2 · Baixa</option><option value={3}>Severidade 3 · Moderada</option><option value={4}>Severidade 4 · Grave</option><option value={5}>Severidade 5 · Catastrófica</option></select><Input value={String(exposedWorkersCount)} onChange={event => setExposedWorkersCount(Math.max(0, Number(event.target.value) || 0))} type="number" min="0" placeholder="Pessoas expostas" /><Textarea value={description} onChange={event => setDescription(event.target.value)} placeholder="Descrição da fonte de perigo, situação ou consequência possível (opcional)." className="min-h-20 md:col-span-2 xl:col-span-3" /><Textarea value={controls} onChange={event => setControls(event.target.value)} placeholder="Controles já existentes: EPC, EPI, procedimento, treinamento ou organização do trabalho (opcional)." className="min-h-20 md:col-span-2 xl:col-span-3" /></div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#f7fcfa] p-3"><span className="text-sm font-semibold text-[#315158]">Criticidade inicial: <b className="text-[#0c7474]">{probability * severity}</b> · {riskTone(probability * severity).label}</span><Button type="button" disabled={createRisk.isPending || title.trim().length < 3} onClick={() => createRisk.mutate({ workspaceId, companyId: currentCompanyId, pgrProjectId: pgrProjectId || null, departmentId: departmentId || null, jobRoleId: jobRoleId || null, title: title.trim(), description: description.trim() || null, riskGroup, source: "pgr", inherentProbability: probability, inherentSeverity: severity, controls: controls.trim() || null, exposedWorkersCount })} className="rounded-xl bg-[#0c7474] text-white"><Plus className="mr-2 h-4 w-4" />Salvar risco no inventário</Button></div>
    </section>}

    <section className="rounded-3xl border border-[#dcebe8] bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Tendência temporal</p><h4 className="mt-1 text-lg font-bold text-[#102b32]">Evolução mensal da redução de riscos</h4><p className="mt-1 max-w-3xl text-sm leading-6 text-[#668087]">A série é recalculada no encerramento de cada mês a partir do histórico de riscos. Ela evidencia a criticidade residual, a redução confirmada, as eliminações acumuladas e cada atualização registrada.</p></div><div className="flex flex-wrap items-center gap-2"><select value={trendWindow} onChange={event => setTrendWindow(event.target.value as typeof trendWindow)} className="h-9 rounded-xl border border-[#cfe3de] bg-white px-3 text-xs font-semibold text-[#315158]"><option value="6">Últimos 6 meses</option><option value="12">Últimos 12 meses</option><option value="24">Últimos 24 meses</option><option value="all">Todo o histórico</option></select><span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#e8f6f1] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-[#0c7474]"><ArrowDownRight className="h-3.5 w-3.5" />Tipo: {labelByValue(riskGroups, comparisonRiskGroup === "all" ? "all" : comparisonRiskGroup) === "all" ? "Todos" : labelByValue(riskGroups, comparisonRiskGroup)}</span></div></div>{monthlyRiskTrend.length ? <><div className="mt-5" aria-label="Gráfico mensal da redução de riscos ocupacionais"><ResponsiveContainer width="100%" height={360}><ComposedChart data={monthlyRiskTrend} margin={{ top: 8, right: 28, left: 2, bottom: 0 }}><CartesianGrid stroke="#e6f0ee" strokeDasharray="4 4" vertical={false} /><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#668087", fontSize: 11 }} /><YAxis yAxisId="score" tickLine={false} axisLine={false} tick={{ fill: "#668087", fontSize: 11 }} /><YAxis yAxisId="count" orientation="right" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#668087", fontSize: 11 }} /><Tooltip cursor={{ stroke: "#9bcfc1", strokeWidth: 1 }} contentStyle={{ borderRadius: 14, borderColor: "#dcebe8", boxShadow: "0 10px 24px rgba(28,74,77,.10)" }} formatter={(value, name) => [value, String(name)]} /><Legend verticalAlign="top" height={34} wrapperStyle={{ fontSize: 11, color: "#47636a" }} /><Area yAxisId="score" type="monotone" dataKey="pgrInitial" name="PGR acumulado" stroke="#8fa5a1" fill="#dbe7e3" fillOpacity={0.58} strokeWidth={2} /><Bar yAxisId="score" dataKey="monthlyReduction" name="Redução no mês" fill="#9cdcc8" radius={[5, 5, 0, 0]} maxBarSize={28} /><Line yAxisId="score" type="monotone" dataKey="residual" name="Criticidade residual" stroke="#0c7474" strokeWidth={3} dot={{ r: 3, fill: "#0c7474" }} activeDot={{ r: 5 }} /><Line yAxisId="count" type="stepAfter" dataKey="eliminated" name="Eliminados acumulados" stroke="#275f54" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 2, fill: "#275f54" }} /><Line yAxisId="count" type="monotone" dataKey="updates" name="Atualizações no mês" stroke="#3173a8" strokeWidth={2} dot={{ r: 2, fill: "#3173a8" }} /></ComposedChart></ResponsiveContainer></div><div className="mt-5 grid gap-3 md:grid-cols-3"><article className="rounded-2xl border border-[#e6f0ee] bg-[#f7fcfa] p-4"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#0c8c89]">Redução acumulada</p><b className="mt-2 block text-2xl text-[#102b32]">{monthlyRiskTrend.at(-1)?.accumulatedReduction ?? 0}</b><p className="mt-1 text-xs text-[#668087]">Diferença entre o PGR acumulado e o residual atual.</p></article><article className="rounded-2xl border border-[#e2ebf0] bg-[#f8fbfe] p-4"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#3173a8]">Atualizações no período</p><b className="mt-2 block text-2xl text-[#102b32]">{monthlyRiskTrend.reduce((sum, month) => sum + month.updates, 0)}</b><p className="mt-1 text-xs text-[#668087]">Reavaliações e decisões registradas no histórico.</p></article><article className="rounded-2xl border border-[#d7ebe3] bg-[#f8fdfb] p-4"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#08795f]">Eliminados</p><b className="mt-2 block text-2xl text-[#102b32]">{monthlyRiskTrend.at(-1)?.eliminated ?? 0}</b><p className="mt-1 text-xs text-[#668087]">Quantidade acumulada ao final do período.</p></article></div></> : <div className="mt-5 rounded-2xl border border-dashed border-[#cfe3de] bg-[#f7fcfa] p-8 text-center text-sm text-[#668087]">A tendência aparecerá quando houver riscos e atualizações com data registrada no inventário.</div>}</section>

    <section className="rounded-3xl border border-[#dcebe8] bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#3173a8]">PGR inicial × condição atual</p><h4 className="mt-1 text-lg font-bold text-[#102b32]">Redução de criticidade por setor</h4><p className="mt-1 max-w-3xl text-sm leading-6 text-[#668087]">Compara a soma das criticidades iniciais do PGR com a condição residual atual. Risco eliminado vale zero na condição atual; risco ainda não reavaliado mantém o valor inicial, sem simular melhoria.</p></div><div className="flex flex-wrap items-center gap-2"><select value={comparisonRiskGroup} onChange={event => setComparisonRiskGroup(event.target.value)} className="h-9 rounded-xl border border-[#cbdde9] bg-white px-3 text-xs font-semibold text-[#315158]"><option value="all">Todos os tipos de risco</option>{riskGroups.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#eef6fd] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-[#3173a8]"><ClipboardCheck className="h-3.5 w-3.5" />Comparação real</span></div></div>{riskReductionData.length ? <><div className="mt-5" aria-label="Gráfico de redução de criticidade entre PGR inicial e condição atual por setor"><ResponsiveContainer width="100%" height={Math.max(300, riskReductionData.length * 58)}><BarChart data={riskReductionData} layout="vertical" margin={{ top: 6, right: 24, left: 8, bottom: 0 }}><CartesianGrid horizontal={false} stroke="#e6f0ee" strokeDasharray="4 4" /><XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#668087", fontSize: 11 }} /><YAxis dataKey="sector" type="category" width={130} tickLine={false} axisLine={false} tick={{ fill: "#315158", fontSize: 11, fontWeight: 600 }} /><Tooltip cursor={{ fill: "#f4faf8" }} contentStyle={{ borderRadius: 14, borderColor: "#dcebe8", boxShadow: "0 10px 24px rgba(28,74,77,.10)" }} formatter={(value, name) => [value, String(name)]} /><Legend verticalAlign="top" height={34} wrapperStyle={{ fontSize: 11, color: "#47636a" }} /><Bar dataKey="initial" name="PGR inicial" fill="#8fa5a1" radius={[0, 5, 5, 0]} maxBarSize={22} /><Bar dataKey="current" name="Condição atual" fill="#0c8c89" radius={[0, 5, 5, 0]} maxBarSize={22} /></BarChart></ResponsiveContainer></div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{riskReductionData.map(item => <div key={item.sectorId} className="rounded-2xl border border-[#dcebe8] bg-[#f8fbfe] p-4"><div className="flex items-start justify-between gap-3"><div><strong className="text-sm text-[#315158]">{item.sector}</strong><p className="mt-1 text-xs text-[#668087]">PGR {item.initial} → atual {item.current}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${item.reduction > 0 ? "bg-[#e5f6ef] text-[#08795f]" : "bg-[#f1f4f3] text-[#58706c]"}`}>{item.reduction > 0 ? `−${item.reduction} · ${item.reductionRate}%` : "Sem redução registrada"}</span></div><div className="mt-3 grid grid-cols-2 gap-2 text-center"><span className="rounded-lg bg-white p-2 text-[10px] font-semibold text-[#3173a8]"><b className="block text-sm">{item.reassessed}/{item.totalRisks}</b>riscos reavaliados</span><span className="rounded-lg bg-white p-2 text-[10px] font-semibold text-[#0c7474]"><b className="block text-sm">{item.inspectionVerified}</b>com inspeção vinculada</span></div></div>)}</div></> : <div className="mt-5 rounded-2xl border border-dashed border-[#d5e3e6] bg-[#f8fbfe] p-8 text-center text-sm text-[#668087]">Cadastre riscos por setor para comparar a criticidade inicial do PGR com a condição atual.</div>}</section>

    <section className="rounded-3xl border border-[#dcebe8] bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Distribuição por setor</p><h4 className="mt-1 text-lg font-bold text-[#102b32]">Criticidade atual dos riscos ocupacionais</h4><p className="mt-1 max-w-3xl text-sm leading-6 text-[#668087]">Cada barra consolida o inventário do setor. Os riscos ativos são classificados pela criticidade residual, quando existente; os eliminados permanecem visíveis para evidenciar a melhoria registrada.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f1f7f6] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-[#0c7474]"><SlidersHorizontal className="h-3.5 w-3.5" />Dados do inventário</span></div>{sectorChartData.length ? <><div className="mt-5" aria-label="Gráfico detalhado de distribuição de riscos por setor"><ResponsiveContainer width="100%" height={Math.max(300, sectorChartData.length * 56)}><BarChart data={sectorChartData} layout="vertical" margin={{ top: 6, right: 24, left: 8, bottom: 0 }}><CartesianGrid horizontal={false} stroke="#e6f0ee" strokeDasharray="4 4" /><XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#668087", fontSize: 11 }} /><YAxis dataKey="sector" type="category" width={130} tickLine={false} axisLine={false} tick={{ fill: "#315158", fontSize: 11, fontWeight: 600 }} /><Tooltip cursor={{ fill: "#f4faf8" }} contentStyle={{ borderRadius: 14, borderColor: "#dcebe8", boxShadow: "0 10px 24px rgba(28,74,77,.10)" }} formatter={(value, name) => [value, String(name)]} /><Legend verticalAlign="top" height={34} wrapperStyle={{ fontSize: 11, color: "#47636a" }} /><Bar dataKey="low" name="Baixo" stackId="criticidade" fill="#0c8c89" radius={[0, 0, 0, 0]} maxBarSize={28} /><Bar dataKey="moderate" name="Moderado" stackId="criticidade" fill="#3173a8" maxBarSize={28} /><Bar dataKey="high" name="Alto" stackId="criticidade" fill="#e6953b" maxBarSize={28} /><Bar dataKey="critical" name="Crítico" stackId="criticidade" fill="#d95f3c" maxBarSize={28} /><Bar dataKey="eliminated" name="Eliminado" stackId="criticidade" fill="#275f54" radius={[0, 6, 6, 0]} maxBarSize={28} /></BarChart></ResponsiveContainer></div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{sectorChartData.map(item => <div key={item.sectorId} className="rounded-2xl border border-[#e6f0ee] bg-[#fbfefd] p-4"><div className="flex items-start justify-between gap-3"><div><strong className="text-sm text-[#315158]">{item.sector}</strong><p className="mt-1 text-xs text-[#668087]">{item.total} risco(s) no inventário</p></div>{item.critical + item.high > 0 ? <span className="rounded-full bg-[#fff0e8] px-2 py-1 text-[10px] font-bold text-[#bd643d]">{item.critical + item.high} prioridade(s)</span> : <span className="rounded-full bg-[#e8f6f1] px-2 py-1 text-[10px] font-bold text-[#0c7474]">Sob controle</span>}</div><div className="mt-3 grid grid-cols-3 gap-2 text-center"><span className="rounded-lg bg-white p-2 text-[10px] font-semibold text-[#668087]"><b className="block text-sm text-[#3173a8]">{item.inTreatment}</b>em tratamento</span><span className="rounded-lg bg-white p-2 text-[10px] font-semibold text-[#0c7474]"><b className="block text-sm">{item.controlled}</b>controlados</span><span className="rounded-lg bg-white p-2 text-[10px] font-semibold text-[#bd643d]"><b className="block text-sm">{item.openActions}</b>ações abertas</span></div></div>)}</div></> : <div className="mt-5 rounded-2xl border border-dashed border-[#cfe3de] bg-[#f7fcfa] p-8 text-center text-sm text-[#668087]">Cadastre riscos vinculados aos setores para exibir a distribuição detalhada.</div>}</section>

    <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]"><article className="rounded-3xl border border-[#dcebe8] bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Setores</p><h4 className="mt-1 text-lg font-bold text-[#102b32]">Exposição e melhoria por setor</h4><p className="mt-1 text-sm text-[#668087]">Ordenado pela prioridade atual, não por acidentes já ocorridos.</p></div><Target className="h-5 w-5 text-[#0c8c89]" /></div><div className="mt-5 space-y-3">{sectorRows.length ? sectorRows.map(row => <div key={row.department.id} className="rounded-2xl border border-[#e6f0ee] bg-[#fbfefd] p-4"><div className="flex items-center justify-between gap-3"><div><strong className="text-sm text-[#315158]">{row.department.name}</strong><p className="mt-1 text-xs text-[#668087]">{row.active} ativo(s) · {row.reduced} reduzido(s) · {row.eliminated} eliminado(s)</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${row.high ? "bg-[#fff0e8] text-[#bd643d]" : "bg-[#e8f6f1] text-[#0c7474]"}`}>{row.high ? `${row.high} alto(s)` : "Sem alto risco"}</span></div><div className="mt-3 flex h-2 overflow-hidden rounded-full bg-[#e6f0ee]"><span className="bg-[#d67845]" style={{ width: `${Math.min(100, row.high * 25)}%` }} /><span className="bg-[#3173a8]" style={{ width: `${Math.min(100, row.active * 10)}%` }} /><span className="bg-[#0c8c89]" style={{ width: `${Math.min(100, row.reduced * 15)}%` }} /></div>{row.openActions > 0 && <p className="mt-2 text-xs font-semibold text-[#bd643d]">{row.openActions} ação(ões) de risco em aberto.</p>}</div>) : <p className="rounded-2xl border border-dashed border-[#cfe3de] bg-[#f7fcfa] p-6 text-center text-sm text-[#668087]">Os setores aparecerão aqui assim que os riscos forem cadastrados.</p>}</div></article>
      <article className="rounded-3xl border border-[#dcebe8] bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#3173a8]">Movimentação</p><h4 className="mt-1 text-lg font-bold text-[#102b32]">Evidências mais recentes</h4><p className="mt-1 text-sm text-[#668087]">Cada alteração preserva risco inicial, residual e situação.</p></div><ClipboardCheck className="h-5 w-5 text-[#3173a8]" /></div><div className="mt-5 space-y-3">{events.filter(event => riskById.get(event.occupationalRiskId)?.companyId === currentCompanyId).slice(0, 5).map(event => <div key={event.id} className="rounded-2xl border border-[#e2ebf0] bg-[#f8fbfe] p-3"><div className="flex items-center justify-between gap-3"><strong className="text-xs text-[#315158]">{riskById.get(event.occupationalRiskId)?.title ?? "Risco ocupacional"}</strong><span className="text-[10px] font-bold text-[#3173a8]">{dateLabel(event.occurredAt)}</span></div><p className="mt-1 text-xs text-[#668087]">{labelByValue(situations, event.previousSituation ?? "identified")} <ArrowDownRight className="mx-1 inline h-3 w-3" /> {labelByValue(situations, event.nextSituation ?? "identified")}{event.previousScore !== null && event.nextScore !== null ? ` · ${event.previousScore} → ${event.nextScore}` : ""}</p>{event.notes && <p className="mt-1 text-xs leading-5 text-[#47636a]">{event.notes}</p>}</div>)}{!events.filter(event => riskById.get(event.occupationalRiskId)?.companyId === currentCompanyId).length && <p className="rounded-2xl border border-dashed border-[#d5e3e6] bg-[#f8fbfe] p-6 text-center text-sm text-[#668087]">O histórico começa ao cadastrar ou atualizar um risco.</p>}</div></article></section>

    <section className="rounded-3xl border border-[#dcebe8] bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Inventário em acompanhamento</p><h4 className="mt-1 text-lg font-bold text-[#102b32]">Riscos, controles e evidências</h4></div><div className="flex flex-wrap gap-2"><select value={departmentFilter} onChange={event => setDepartmentFilter(Number(event.target.value))} className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm"><option value={0}>Todos os setores</option>{companyDepartments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}</select><select value={situationFilter} onChange={event => setSituationFilter(event.target.value)} className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm"><option value="all">Todas as situações</option>{situations.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></div>
      <div className="mt-5 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-[#e6f0ee] text-[10px] font-bold uppercase tracking-[.1em] text-[#668087]"><tr><th className="px-3 py-3">Risco / setor</th><th className="px-3 py-3">Nível</th><th className="px-3 py-3">Situação</th><th className="px-3 py-3">Evidências</th>{canManage && <th className="px-3 py-3 text-right">Ação</th>}</tr></thead><tbody>{filteredRisks.map(risk => { const effectiveScore = risk.residualScore ?? risk.inherentScore; const tone = riskTone(effectiveScore); const linkedActions = actionCountByRisk.get(risk.id) ?? 0; const openActions = openActionCountByRisk.get(risk.id) ?? 0; const riskDepartment = departments.find(item => item.id === risk.departmentId)?.name ?? "Sem setor definido"; return <><tr key={risk.id} className="border-b border-[#eef4f2] align-top"><td className="px-3 py-4"><strong className="block text-sm text-[#102b32]">{risk.title}</strong><p className="mt-1 text-xs text-[#668087]">{labelByValue(riskGroups, risk.riskGroup)} · {riskDepartment}{risk.exposedWorkersCount ? ` · ${risk.exposedWorkersCount} pessoa(s) exposta(s)` : ""}</p>{risk.controls && <p className="mt-2 max-w-md text-xs leading-5 text-[#47636a]">{risk.controls}</p>}</td><td className="px-3 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${tone.badge}`}>{effectiveScore} · {tone.label}</span><p className="mt-2 text-xs text-[#668087]">Inicial: {risk.inherentScore}{risk.residualScore !== null ? ` · Residual: ${risk.residualScore}` : ""}</p></td><td className="px-3 py-4"><span className="font-semibold text-[#315158]">{labelByValue(situations, risk.situation)}</span><p className="mt-2 text-xs text-[#668087]">Inspeção: {risk.lastInspectionId ? inspections.find(item => item.id === risk.lastInspectionId)?.title ?? "vinculada" : "não vinculada"}</p></td><td className="px-3 py-4"><p className="text-xs text-[#47636a]">{linkedActions} ação(ões) vinculada(s)</p>{openActions > 0 && <p className="mt-1 text-xs font-semibold text-[#bd643d]">{openActions} em aberto</p>}{risk.controlVerifiedAt && <p className="mt-1 text-xs font-semibold text-[#0c7474]">Controle verificado em {dateLabel(risk.controlVerifiedAt)}</p>}</td>{canManage && <td className="px-3 py-4 text-right"><Button type="button" variant="outline" onClick={() => beginEditing(risk.id)} className="h-8 rounded-lg border-[#cfe3de] text-xs text-[#0c7474]">Atualizar</Button></td>}</tr>{editingRiskId === risk.id && <tr key={`${risk.id}-edit`}><td colSpan={canManage ? 5 : 4} className="px-3 pb-5"><div className="rounded-2xl border border-[#b9e3d7] bg-[#f7fcfa] p-4"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><select value={nextSituation} onChange={event => setNextSituation(event.target.value as typeof nextSituation)} className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm">{situations.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select value={residualProbability} onChange={event => setResidualProbability(Number(event.target.value))} className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm">{[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>Probabilidade residual {value}</option>)}</select><select value={residualSeverity} onChange={event => setResidualSeverity(Number(event.target.value))} className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm">{[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>Severidade residual {value}</option>)}</select><select value={lastInspectionId} onChange={event => setLastInspectionId(Number(event.target.value))} className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm"><option value={0}>Inspeção de validação (opcional)</option>{companyInspections.filter(item => !risk.departmentId || !item.departmentId || item.departmentId === risk.departmentId).map(item => <option key={item.id} value={item.id}>{item.title} · {item.status === "completed" ? "concluída" : "planejada"}</option>)}</select><Textarea value={updateNotes} onChange={event => setUpdateNotes(event.target.value)} className="min-h-20 md:col-span-2 xl:col-span-4" placeholder="Evidência da mudança: controle implantado, medição, verificação em campo ou motivo da eliminação." /></div><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-xs font-semibold text-[#315158]">Nível residual informado: <b>{residualProbability * residualSeverity}</b> · {riskTone(residualProbability * residualSeverity).label}</span><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setEditingRiskId(0)} className="rounded-xl">Cancelar</Button><Button type="button" disabled={updateRisk.isPending} onClick={() => updateRisk.mutate({ workspaceId, riskId: risk.id, situation: nextSituation, residualProbability, residualSeverity, lastInspectionId: lastInspectionId || null, notes: updateNotes.trim() || null })} className="rounded-xl bg-[#0c7474] text-white">Salvar evolução</Button></div></div></div></td></tr>}</>; })}{!filteredRisks.length && <tr><td colSpan={canManage ? 5 : 4} className="px-3 py-10 text-center text-sm text-[#668087]">Nenhum risco encontrado neste recorte. Use “Adicionar risco” para iniciar o inventário.</td></tr>}</tbody></table></div>
    </section>
  </section>;
}

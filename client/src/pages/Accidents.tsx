import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ModuleHeader, ModulePage } from "@/components/ModulePageLayout";
import AnatomicalBodyMap, { AccidentBodyMapSummary, type AnatomicalInjuryDraft, type InjurySeverity } from "@/components/AnatomicalBodyMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { workspaceIdFromSearch } from "@shared/workspaceContext";
import { useSearch } from "wouter";
import { AlertTriangle, ClipboardCheck, FileWarning, ShieldCheck, Stethoscope } from "lucide-react";
import { toast } from "sonner";

const severityLabels: Record<InjurySeverity, string> = { minor: "Leve", moderate: "Moderada", serious: "Grave", critical: "Crítica" };
const natureLabels = { typical: "Típico", commuting: "Trajeto", occupational_disease: "Doença ocupacional", other: "Outro" } as const;
const regionLabel = (region: string) => ({ head: "Cabeça", face: "Face / olhos", neck: "Pescoço", chest: "Tórax", abdomen: "Abdômen", back: "Costas", pelvis: "Pelve", hand_left: "Mão esquerda", hand_right: "Mão direita", finger_left: "Dedos esquerdos", finger_right: "Dedos direitos", knee_left: "Joelho esquerdo", knee_right: "Joelho direito", foot_left: "Pé esquerdo", foot_right: "Pé direito", other: "Outra região" }[region] ?? region.replaceAll("_", " "));

export default function Accidents() {
  const search = useSearch();
  const workspaceId = workspaceIdFromSearch(search) ?? 0;
  const utils = trpc.useUtils();
  const workspace = trpc.portal.workspace.useQuery({ workspaceId }, { enabled: workspaceId > 0, retry: false });
  const organization = trpc.portal.organization.useQuery({ workspaceId }, { enabled: workspaceId > 0 });
  const planning = trpc.portal.planning.useQuery({ workspaceId }, { enabled: workspaceId > 0 });
  const risks = trpc.portal.occupationalRisks.useQuery({ workspaceId }, { enabled: workspaceId > 0 });
  const accidents = trpc.portal.accidents.useQuery({ workspaceId }, { enabled: workspaceId > 0 });
  const [companyId, setCompanyId] = useState(0);
  const [departmentId, setDepartmentId] = useState(0);
  const [employeeId, setEmployeeId] = useState(0);
  const [riskId, setRiskId] = useState(0);
  const [inspectionId, setInspectionId] = useState(0);
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [summary, setSummary] = useState("");
  const [accidentNature, setAccidentNature] = useState<keyof typeof natureLabels>("typical");
  const [accidentType, setAccidentType] = useState("");
  const [injuryAgent, setInjuryAgent] = useState("");
  const [esocialAgentCode, setEsocialAgentCode] = useState("");
  const [characterization, setCharacterization] = useState("");
  const [medicalTreatment, setMedicalTreatment] = useState("");
  const [daysAway, setDaysAway] = useState(0);
  const [catNumber, setCatNumber] = useState("");
  const [severity, setSeverity] = useState<InjurySeverity>("minor");
  const [immediateActions, setImmediateActions] = useState("");
  const [immediateCause, setImmediateCause] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [injuries, setInjuries] = useState<AnatomicalInjuryDraft[]>([]);

  const companies = workspace.data?.companies ?? [];
  const currentCompanyId = companyId || companies[0]?.id || 0;
  const departments = (organization.data?.departments ?? []).filter(item => item.companyId === currentCompanyId && item.active);
  const employees = (organization.data?.employees ?? []).filter(item => item.companyId === currentCompanyId && item.status === "active" && (!departmentId || item.departmentId === departmentId));
  const companyRisks = (risks.data?.risks ?? []).filter(item => item.companyId === currentCompanyId);
  const companyInspections = (planning.data?.inspections ?? []).filter(item => item.companyId === currentCompanyId);
  const orderedAccidents = useMemo(() => (accidents.data?.accidents ?? []).filter(item => item.detail.companyId === currentCompanyId).sort((a, b) => new Date(b.occurrence.occurredAt).getTime() - new Date(a.occurrence.occurredAt).getTime()), [accidents.data?.accidents, currentCompanyId]);
  const registeredInjuries = useMemo(() => orderedAccidents.flatMap(record => record.injuries), [orderedAccidents]);
  const canSubmit = Boolean(currentCompanyId && summary.trim().length >= 10 && injuries.length);

  const createAccident = trpc.portal.createAccident.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.portal.accidents.invalidate({ workspaceId }), utils.portal.operations.invalidate({ workspaceId })]);
      setSummary(""); setAccidentType(""); setInjuryAgent(""); setEsocialAgentCode(""); setCharacterization(""); setMedicalTreatment(""); setDaysAway(0); setCatNumber(""); setImmediateActions(""); setImmediateCause(""); setRootCause(""); setInjuries([]); setRiskId(0); setInspectionId(0); setDepartmentId(0); setEmployeeId(0); setSeverity("minor"); setOccurredAt(new Date().toISOString().slice(0, 16));
      toast.success("Acidente e lesões registrados com sucesso.");
    },
    onError: error => toast.error(error.message || "Não foi possível registrar o acidente."),
  });

  const save = () => createAccident.mutate({
    workspaceId, companyId: currentCompanyId, departmentId: departmentId || null, employeeId: employeeId || null, occupationalRiskId: riskId || null, inspectionId: inspectionId || null,
    occurredAt: new Date(occurredAt), summary: summary.trim(), accidentNature, accidentType: accidentType.trim() || null, injuryAgent: injuryAgent.trim() || null,
    esocialAgentCode: esocialAgentCode.trim() || null, characterization: characterization.trim() || null, medicalTreatment: medicalTreatment.trim() || null,
    daysAway, catNumber: catNumber.trim() || null, severity, immediateActions: immediateActions.trim() || null, immediateCause: immediateCause.trim() || null, rootCause: rootCause.trim() || null,
    injuries: injuries.map(item => ({ ...item, lesionType: item.lesionType.trim(), notes: item.notes?.trim() || null })),
  });

  return <DashboardLayout><ModulePage><ModuleHeader eyebrow="Saúde e segurança" title="Acidentes e lesões" description="Registre acidentes com lesões anatômicas, vincule riscos e inspeções e mantenha a evidência preventiva centralizada." actions={<span className="inline-flex items-center gap-2 rounded-full bg-[#fff3e8] px-3 py-1.5 text-xs font-bold text-[#a85a16]"><Stethoscope className="h-4 w-4" />Registro protegido</span>} />
    <div className="mb-6 flex flex-wrap gap-2">{companies.map(company => <button key={company.id} type="button" onClick={() => { setCompanyId(company.id); setDepartmentId(0); setEmployeeId(0); setRiskId(0); setInspectionId(0); }} className={`rounded-full border px-3 py-1.5 text-xs font-bold ${currentCompanyId === company.id ? "border-[#0c7474] bg-[#e8f6f1] text-[#0c7474]" : "border-[#d9e6e3] bg-white text-[#55716e]"}`}>{company.name}</button>)}</div>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"><section className="space-y-5"><section className="rounded-3xl border border-[#dcebe8] bg-white p-5 shadow-sm"><div className="flex items-start gap-3"><div className="rounded-2xl bg-[#fff3e8] p-2.5 text-[#d67845]"><FileWarning className="h-5 w-5" /></div><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#a85a16]">Novo registro</p><h2 className="mt-1 text-lg font-bold text-[#102b32]">Dados do acidente</h2><p className="mt-1 text-sm text-[#668087]">Registre somente os dados necessários para investigação e prevenção. Informações individuais ficam protegidas no ambiente.</p></div></div><div className="mt-5 grid gap-3 md:grid-cols-2"><Input value={summary} onChange={event => setSummary(event.target.value)} className="md:col-span-2" placeholder="Resumo do acidente e da situação ocorrida" /><Input value={occurredAt} onChange={event => setOccurredAt(event.target.value)} type="datetime-local" /><select value={accidentNature} onChange={event => setAccidentNature(event.target.value as keyof typeof natureLabels)} className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm">{Object.entries(natureLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select value={departmentId} onChange={event => { setDepartmentId(Number(event.target.value)); setEmployeeId(0); }} className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm"><option value={0}>Setor (opcional)</option>{departments.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select value={employeeId} onChange={event => setEmployeeId(Number(event.target.value))} className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm"><option value={0}>Colaborador (opcional)</option>{employees.map(item => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select><Input value={accidentType} onChange={event => setAccidentType(event.target.value)} placeholder="Tipo de acidente (opcional)" /><Input value={injuryAgent} onChange={event => setInjuryAgent(event.target.value)} placeholder="Agente causador / lesão (opcional)" /><select value={severity} onChange={event => setSeverity(event.target.value as InjurySeverity)} className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm">{(Object.keys(severityLabels) as InjurySeverity[]).map(value => <option key={value} value={value}>Gravidade: {severityLabels[value]}</option>)}</select><Input value={String(daysAway)} onChange={event => setDaysAway(Math.max(0, Number(event.target.value) || 0))} type="number" min="0" placeholder="Dias de afastamento" /></div><details className="mt-4 rounded-2xl border border-[#e2efec] bg-[#f7fcfa] p-4"><summary className="cursor-pointer text-sm font-bold text-[#315158]">Detalhes de investigação e prevenção</summary><div className="mt-4 grid gap-3 md:grid-cols-2"><select value={riskId} onChange={event => setRiskId(Number(event.target.value))} className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm"><option value={0}>Risco do PGR relacionado (opcional)</option>{companyRisks.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select><select value={inspectionId} onChange={event => setInspectionId(Number(event.target.value))} className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm"><option value={0}>Inspeção relacionada (opcional)</option>{companyInspections.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select><Input value={esocialAgentCode} onChange={event => setEsocialAgentCode(event.target.value)} placeholder="Código eSocial do agente (opcional)" /><Input value={characterization} onChange={event => setCharacterization(event.target.value)} placeholder="Caracterização (opcional)" /><Input value={medicalTreatment} onChange={event => setMedicalTreatment(event.target.value)} placeholder="Tratamento médico (opcional)" /><Input value={catNumber} onChange={event => setCatNumber(event.target.value)} placeholder="Número da CAT (opcional)" /><Textarea value={immediateActions} onChange={event => setImmediateActions(event.target.value)} className="min-h-20 md:col-span-2" placeholder="Ações imediatas adotadas" /><Textarea value={immediateCause} onChange={event => setImmediateCause(event.target.value)} className="min-h-20" placeholder="Causa imediata" /><Textarea value={rootCause} onChange={event => setRootCause(event.target.value)} className="min-h-20" placeholder="Causa raiz inicial" /></div></details></section>
      <AnatomicalBodyMap injuries={injuries} onChange={setInjuries} disabled={createAccident.isPending} />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#c8e5dc] bg-[#f7fcfa] p-4"><div className="flex items-center gap-2 text-sm text-[#315158]"><ShieldCheck className="h-5 w-5 text-[#0c8c89]" /><span><b>{injuries.length}</b> lesão(ões) anatômica(s) pronta(s) para salvar.</span></div><Button type="button" disabled={!canSubmit || createAccident.isPending} onClick={save} className="rounded-xl bg-[#0c7474] text-white">{createAccident.isPending ? "Salvando..." : "Salvar acidente e lesões"}</Button></div></section>
      <aside className="space-y-4"><AccidentBodyMapSummary injuries={registeredInjuries} /><section className="rounded-3xl border border-[#f1d5c9] bg-[#fff9f5] p-5 shadow-sm"><AlertTriangle className="h-5 w-5 text-[#d67845]" /><h3 className="mt-3 font-bold text-[#102b32]">Boas práticas de registro</h3><p className="mt-2 text-sm leading-6 text-[#668087]">Informe os fatos, as medidas imediatas e os vínculos preventivos. A análise médica detalhada não deve ser registrada neste painel.</p></section><section className="rounded-3xl border border-[#dcebe8] bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-[#3173a8]" /><h3 className="font-bold text-[#102b32]">Registros recentes</h3></div><div className="mt-4 space-y-3">{orderedAccidents.length ? orderedAccidents.slice(0, 7).map(record => <article key={record.detail.id} className="rounded-2xl border border-[#e2efec] p-3"><div className="flex items-start justify-between gap-2"><b className="text-sm text-[#17383a]">{record.occurrence.summary}</b><span className="shrink-0 rounded-full bg-[#fff0d9] px-2 py-1 text-[10px] font-bold text-[#a85a16]">{severityLabels[record.detail.severity]}</span></div><p className="mt-1 text-xs text-[#668087]">{new Date(record.occurrence.occurredAt).toLocaleDateString("pt-BR")} · {record.injuries.map(injury => regionLabel(injury.bodyRegion)).join(", ")}</p></article>) : <p className="rounded-2xl border border-dashed border-[#cfe3de] bg-[#f7fcfa] p-4 text-sm text-[#668087]">Ainda não há acidentes registrados para esta empresa.</p>}</div></section></aside></div>
  </ModulePage></DashboardLayout>;
}

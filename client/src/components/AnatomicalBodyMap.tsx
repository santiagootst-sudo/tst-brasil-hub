import React, { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

export const bodyRegions = ["head", "face", "neck", "shoulder_left", "shoulder_right", "chest", "abdomen", "back", "pelvis", "arm_left", "arm_right", "forearm_left", "forearm_right", "hand_left", "hand_right", "finger_left", "finger_right", "thigh_left", "thigh_right", "knee_left", "knee_right", "leg_left", "leg_right", "ankle_left", "ankle_right", "foot_left", "foot_right", "other"] as const;
export type BodyRegion = typeof bodyRegions[number];
export type InjurySeverity = "minor" | "moderate" | "serious" | "critical";
export type BodySide = "left" | "right" | "center" | "not_applicable";

export type AnatomicalInjuryDraft = {
  bodyRegion: BodyRegion;
  bodySide: BodySide;
  lesionType: string;
  severity: InjurySeverity;
  notes?: string | null;
};

type Props = {
  injuries: AnatomicalInjuryDraft[];
  onChange: (injuries: AnatomicalInjuryDraft[]) => void;
  disabled?: boolean;
};

const labels: Record<BodyRegion, string> = {
  head: "Cabeça", face: "Face / olhos", neck: "Pescoço", shoulder_left: "Ombro esquerdo", shoulder_right: "Ombro direito", chest: "Tórax", abdomen: "Abdômen", back: "Costas", pelvis: "Pelve", arm_left: "Braço esquerdo", arm_right: "Braço direito", forearm_left: "Antebraço esquerdo", forearm_right: "Antebraço direito", hand_left: "Mão esquerda", hand_right: "Mão direita", finger_left: "Dedos esquerdos", finger_right: "Dedos direitos", thigh_left: "Coxa esquerda", thigh_right: "Coxa direita", knee_left: "Joelho esquerdo", knee_right: "Joelho direito", leg_left: "Perna esquerda", leg_right: "Perna direita", ankle_left: "Tornozelo esquerdo", ankle_right: "Tornozelo direito", foot_left: "Pé esquerdo", foot_right: "Pé direito", other: "Outra região",
};

const sideByRegion: Partial<Record<BodyRegion, BodySide>> = {
  shoulder_left: "left", arm_left: "left", forearm_left: "left", hand_left: "left", finger_left: "left", thigh_left: "left", knee_left: "left", leg_left: "left", ankle_left: "left", foot_left: "left",
  shoulder_right: "right", arm_right: "right", forearm_right: "right", hand_right: "right", finger_right: "right", thigh_right: "right", knee_right: "right", leg_right: "right", ankle_right: "right", foot_right: "right",
  head: "center", face: "center", neck: "center", chest: "center", abdomen: "center", back: "center", pelvis: "center",
};

const severityLabels: Record<InjurySeverity, string> = { minor: "Leve", moderate: "Moderada", serious: "Grave", critical: "Crítica" };
const severityColor: Record<InjurySeverity, string> = { minor: "#eab85f", moderate: "#e4863a", serious: "#d95f3c", critical: "#9d2f32" };

const countMarkerPositions: Record<"front" | "back", Partial<Record<BodyRegion, { x: number; y: number }>>> = {
  front: { head: { x: 125, y: 28 }, face: { x: 125, y: 67 }, neck: { x: 125, y: 91 }, shoulder_left: { x: 86, y: 114 }, shoulder_right: { x: 164, y: 114 }, chest: { x: 125, y: 128 }, abdomen: { x: 125, y: 171 }, pelvis: { x: 125, y: 206 }, arm_left: { x: 65, y: 160 }, arm_right: { x: 185, y: 160 }, forearm_left: { x: 51, y: 224 }, forearm_right: { x: 199, y: 224 }, hand_left: { x: 47, y: 265 }, hand_right: { x: 203, y: 265 }, finger_left: { x: 40, y: 290 }, finger_right: { x: 210, y: 290 }, thigh_left: { x: 103, y: 260 }, thigh_right: { x: 147, y: 260 }, knee_left: { x: 103, y: 308 }, knee_right: { x: 147, y: 308 }, leg_left: { x: 99, y: 357 }, leg_right: { x: 151, y: 357 }, ankle_left: { x: 99, y: 395 }, ankle_right: { x: 151, y: 395 }, foot_left: { x: 89, y: 412 }, foot_right: { x: 161, y: 412 } },
  back: { head: { x: 125, y: 42 }, neck: { x: 125, y: 91 }, shoulder_left: { x: 86, y: 114 }, shoulder_right: { x: 164, y: 114 }, back: { x: 125, y: 153 }, pelvis: { x: 125, y: 206 }, arm_left: { x: 65, y: 160 }, arm_right: { x: 185, y: 160 }, forearm_left: { x: 51, y: 224 }, forearm_right: { x: 199, y: 224 }, hand_left: { x: 47, y: 265 }, hand_right: { x: 203, y: 265 }, finger_left: { x: 40, y: 290 }, finger_right: { x: 210, y: 290 }, thigh_left: { x: 103, y: 260 }, thigh_right: { x: 147, y: 260 }, knee_left: { x: 103, y: 308 }, knee_right: { x: 147, y: 308 }, leg_left: { x: 99, y: 357 }, leg_right: { x: 151, y: 357 }, ankle_left: { x: 99, y: 395 }, ankle_right: { x: 151, y: 395 }, foot_left: { x: 89, y: 412 }, foot_right: { x: 161, y: 412 } },
};

function RegionShape({ region, children, active, onSelect }: { region: BodyRegion; children: React.ReactNode; active?: AnatomicalInjuryDraft; onSelect: (region: BodyRegion) => void }) {
  const fill = active ? severityColor[active.severity] : "#dce9e5";
  const label = `${labels[region]}${active ? ` · lesão ${severityLabels[active.severity].toLowerCase()}` : " · selecionar região"}`;
  return <g role="button" tabIndex={0} aria-label={label} onClick={() => onSelect(region)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(region); } }} className="cursor-pointer outline-none"><title>{label}</title><g fill={fill} stroke={active ? "#702e28" : "#98b4ad"} strokeWidth={active ? 2.2 : 1.2} className="transition-colors duration-200">{children}</g></g>;
}

function Figure({ back, injuries, onSelect, counts }: { back: boolean; injuries: Map<BodyRegion, AnatomicalInjuryDraft>; onSelect: (region: BodyRegion) => void; counts?: Partial<Record<BodyRegion, number>> }) {
  const selected = (region: BodyRegion) => injuries.get(region);
  return <svg viewBox="0 0 250 456" className="mx-auto h-[430px] max-w-full" aria-label={back ? "Mapa corporal posterior" : "Mapa corporal frontal"}>
    <path d="M56 404 Q125 434 194 404" fill="none" stroke="#e4efec" strokeWidth="24" strokeLinecap="round" />
    <RegionShape region="head" active={selected("head")} onSelect={onSelect}><ellipse cx="125" cy="47" rx="31" ry="35" /></RegionShape>
    {!back && <RegionShape region="face" active={selected("face")} onSelect={onSelect}><path d="M101 52 Q125 74 149 52 L145 73 Q125 88 105 73Z" /></RegionShape>}
    <RegionShape region="neck" active={selected("neck")} onSelect={onSelect}><path d="M112 78 L138 78 L141 101 L109 101Z" /></RegionShape>
    <RegionShape region="shoulder_left" active={selected("shoulder_left")} onSelect={onSelect}><path d="M109 99 Q86 100 74 116 L91 136 L111 124Z" /></RegionShape>
    <RegionShape region="shoulder_right" active={selected("shoulder_right")} onSelect={onSelect}><path d="M141 99 Q164 100 176 116 L159 136 L139 124Z" /></RegionShape>
    {back ? <RegionShape region="back" active={selected("back")} onSelect={onSelect}><path d="M104 101 Q125 111 146 101 L165 183 Q151 211 125 217 Q99 211 85 183Z" /></RegionShape> : <><RegionShape region="chest" active={selected("chest")} onSelect={onSelect}><path d="M104 102 Q125 114 146 102 L159 150 L91 150Z" /></RegionShape><RegionShape region="abdomen" active={selected("abdomen")} onSelect={onSelect}><path d="M91 150 L159 150 L164 184 Q146 207 125 208 Q104 207 86 184Z" /></RegionShape></>}
    <RegionShape region="pelvis" active={selected("pelvis")} onSelect={onSelect}><path d="M87 182 Q125 206 163 182 L158 221 L92 221Z" /></RegionShape>
    <RegionShape region="arm_left" active={selected("arm_left")} onSelect={onSelect}><path d="M78 118 L94 132 L75 198 L55 191Z" /></RegionShape>
    <RegionShape region="arm_right" active={selected("arm_right")} onSelect={onSelect}><path d="M172 118 L156 132 L175 198 L195 191Z" /></RegionShape>
    <RegionShape region="forearm_left" active={selected("forearm_left")} onSelect={onSelect}><path d="M55 191 L75 198 L59 255 L42 249Z" /></RegionShape>
    <RegionShape region="forearm_right" active={selected("forearm_right")} onSelect={onSelect}><path d="M195 191 L175 198 L191 255 L208 249Z" /></RegionShape>
    <RegionShape region="hand_left" active={selected("hand_left")} onSelect={onSelect}><ellipse cx="48" cy="267" rx="13" ry="17" /></RegionShape>
    <RegionShape region="hand_right" active={selected("hand_right")} onSelect={onSelect}><ellipse cx="202" cy="267" rx="13" ry="17" /></RegionShape>
    <RegionShape region="finger_left" active={selected("finger_left")} onSelect={onSelect}><path d="M35 277 L53 278 L49 300 L34 297Z" /></RegionShape>
    <RegionShape region="finger_right" active={selected("finger_right")} onSelect={onSelect}><path d="M215 277 L197 278 L201 300 L216 297Z" /></RegionShape>
    <RegionShape region="thigh_left" active={selected("thigh_left")} onSelect={onSelect}><path d="M94 218 L123 221 L119 301 L89 298Z" /></RegionShape>
    <RegionShape region="thigh_right" active={selected("thigh_right")} onSelect={onSelect}><path d="M156 218 L127 221 L131 301 L161 298Z" /></RegionShape>
    <RegionShape region="knee_left" active={selected("knee_left")} onSelect={onSelect}><ellipse cx="104" cy="308" rx="15" ry="15" /></RegionShape>
    <RegionShape region="knee_right" active={selected("knee_right")} onSelect={onSelect}><ellipse cx="146" cy="308" rx="15" ry="15" /></RegionShape>
    <RegionShape region="leg_left" active={selected("leg_left")} onSelect={onSelect}><path d="M92 321 L116 321 L111 389 L87 389Z" /></RegionShape>
    <RegionShape region="leg_right" active={selected("leg_right")} onSelect={onSelect}><path d="M158 321 L134 321 L139 389 L163 389Z" /></RegionShape>
    <RegionShape region="ankle_left" active={selected("ankle_left")} onSelect={onSelect}><rect x="88" y="388" width="23" height="14" rx="6" /></RegionShape>
    <RegionShape region="ankle_right" active={selected("ankle_right")} onSelect={onSelect}><rect x="139" y="388" width="23" height="14" rx="6" /></RegionShape>
    <RegionShape region="foot_left" active={selected("foot_left")} onSelect={onSelect}><path d="M87 400 L112 400 L112 418 L72 418 Q74 404 87 400Z" /></RegionShape>
    <RegionShape region="foot_right" active={selected("foot_right")} onSelect={onSelect}><path d="M163 400 L138 400 L138 418 L178 418 Q176 404 163 400Z" /></RegionShape>
    {counts && Object.entries(counts).flatMap(([rawRegion, count]) => {
      const region = rawRegion as BodyRegion;
      const position = countMarkerPositions[back ? "back" : "front"][region];
      return count && position ? [<g key={`count-${region}`} pointerEvents="none"><circle cx={position.x} cy={position.y} r="10" fill="#0c7474" stroke="white" strokeWidth="2" /><text x={position.x} y={position.y + 4} textAnchor="middle" fill="white" fontSize="11" fontWeight="700">{count > 99 ? "99+" : count}</text></g>] : [];
    })}
  </svg>;
}

export function AccidentBodyMapSummary({ injuries }: { injuries: Array<Pick<AnatomicalInjuryDraft, "bodyRegion">> }) {
  const [view, setView] = useState<"front" | "back">("front");
  const counts = useMemo(() => injuries.reduce<Partial<Record<BodyRegion, number>>>((accumulator, injury) => ({ ...accumulator, [injury.bodyRegion]: (accumulator[injury.bodyRegion] ?? 0) + 1 }), {}), [injuries]);
  const total = injuries.length;
  const visibleRegions = Object.entries(counts).filter(([, count]) => count).length;

  return <section className="rounded-3xl border border-[#dcebe8] bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Mapa de acidentes</p><h3 className="mt-1 font-bold text-[#102b32]">Lesões classificadas por região</h3><p className="mt-1 text-sm leading-6 text-[#668087]">Os números indicam quantas lesões registradas atingiram cada região anatômica.</p></div><div className="inline-flex rounded-xl border border-[#cfe3de] bg-[#f7fcfa] p-1 text-xs font-bold"><button type="button" onClick={() => setView("front")} className={`rounded-lg px-3 py-1.5 ${view === "front" ? "bg-[#0c7474] text-white" : "text-[#55716e]"}`}>Frente</button><button type="button" onClick={() => setView("back")} className={`rounded-lg px-3 py-1.5 ${view === "back" ? "bg-[#0c7474] text-white" : "text-[#55716e]"}`}>Costas</button></div></div><div className="mt-4 rounded-2xl border border-[#e2efec] bg-[#f7fcfa] p-2"><div className="pointer-events-none"><Figure back={view === "back"} injuries={new Map()} onSelect={() => undefined} counts={counts} /></div><p className="px-2 pb-2 text-center text-xs text-[#668087]"><span className="font-bold text-[#0c7474]">{total}</span> lesão(ões) em <span className="font-bold text-[#0c7474]">{visibleRegions}</span> região(ões) classificada(s).</p></div></section>;
}

export default function AnatomicalBodyMap({ injuries, onChange, disabled = false }: Props) {
  const [view, setView] = useState<"front" | "back">("front");
  const selectedByRegion = useMemo(() => new Map(injuries.map(injury => [injury.bodyRegion, injury])), [injuries]);
  const toggleRegion = (bodyRegion: BodyRegion) => {
    if (disabled) return;
    const found = selectedByRegion.get(bodyRegion);
    if (found) onChange(injuries.filter(injury => injury.bodyRegion !== bodyRegion));
    else onChange([...injuries, { bodyRegion, bodySide: sideByRegion[bodyRegion] ?? "not_applicable", lesionType: "Lesão a detalhar", severity: "minor", notes: null }]);
  };
  const updateInjury = (bodyRegion: BodyRegion, patch: Partial<AnatomicalInjuryDraft>) => onChange(injuries.map(injury => injury.bodyRegion === bodyRegion ? { ...injury, ...patch } : injury));

  return <section className="rounded-3xl border border-[#dcebe8] bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Mapa corporal</p><h3 className="mt-1 text-lg font-bold text-[#102b32]">Selecione as regiões lesionadas</h3><p className="mt-1 max-w-xl text-sm leading-6 text-[#668087]">Clique em uma região da silhueta para incluir ou remover uma lesão. Depois, informe a gravidade e a natureza da lesão.</p></div><div className="inline-flex rounded-xl border border-[#cfe3de] bg-[#f7fcfa] p-1 text-xs font-bold"><button type="button" onClick={() => setView("front")} className={`rounded-lg px-3 py-1.5 ${view === "front" ? "bg-[#0c7474] text-white" : "text-[#55716e]"}`}>Frente</button><button type="button" onClick={() => setView("back")} className={`rounded-lg px-3 py-1.5 ${view === "back" ? "bg-[#0c7474] text-white" : "text-[#55716e]"}`}>Costas</button></div></div><div className="mt-4 grid gap-4 lg:grid-cols-[250px_1fr]"><div className="rounded-2xl border border-[#e2efec] bg-[#f7fcfa] p-2"><Figure back={view === "back"} injuries={selectedByRegion} onSelect={toggleRegion} /><p className="px-2 pb-2 text-center text-xs text-[#668087]">As áreas em cor indicam lesões selecionadas. <span className="font-bold text-[#0c7474]">{injuries.length} região(ões)</span>.</p></div><div className="space-y-3">{injuries.length ? injuries.map(injury => <article key={injury.bodyRegion} className="rounded-2xl border border-[#e0ece9] bg-[#fbfefd] p-3"><div className="flex items-center justify-between gap-2"><b className="text-sm text-[#17383a]">{labels[injury.bodyRegion]}</b><button type="button" aria-label={`Remover ${labels[injury.bodyRegion]}`} onClick={() => toggleRegion(injury.bodyRegion)} className="rounded-lg p-1.5 text-[#a94628] hover:bg-[#fff1ed]"><Trash2 className="h-4 w-4" /></button></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><input value={injury.lesionType} onChange={event => updateInjury(injury.bodyRegion, { lesionType: event.target.value })} disabled={disabled} className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm" placeholder="Tipo de lesão" /><select value={injury.severity} onChange={event => updateInjury(injury.bodyRegion, { severity: event.target.value as InjurySeverity })} disabled={disabled} className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm">{(Object.keys(severityLabels) as InjurySeverity[]).map(value => <option key={value} value={value}>{severityLabels[value]}</option>)}</select><input value={injury.notes ?? ""} onChange={event => updateInjury(injury.bodyRegion, { notes: event.target.value || null })} disabled={disabled} className="h-10 rounded-xl border border-[#cfe3de] bg-white px-3 text-sm sm:col-span-2" placeholder="Observação opcional da lesão" /></div></article>) : <div className="rounded-2xl border border-dashed border-[#cfe3de] bg-[#f7fcfa] p-6 text-center text-sm text-[#668087]">Nenhuma região selecionada. Use a silhueta ao lado para iniciar o registro.</div>}<div className="flex flex-wrap gap-2 border-t border-[#e7efed] pt-3">{(["head", "face", "neck", "chest", "abdomen", "back", "pelvis", "other"] as BodyRegion[]).filter(region => !selectedByRegion.has(region)).map(region => <button key={region} type="button" disabled={disabled} onClick={() => toggleRegion(region)} className="inline-flex items-center gap-1 rounded-full border border-[#cfe3de] bg-white px-3 py-1.5 text-xs font-semibold text-[#315158] hover:bg-[#f1faf7]"><Plus className="h-3.5 w-3.5" />{labels[region]}</button>)}</div></div></div></section>;
}

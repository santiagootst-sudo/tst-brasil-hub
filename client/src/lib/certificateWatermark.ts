import type { CertificateNr } from "./certificateCatalog";

export type CertificateWatermarkTheme = {
  nr: CertificateNr;
  label: string;
  eyebrow: string;
  description: string;
  color: string;
  kind: "cipa" | "electricity" | "noise" | "fire" | "confined" | "height";
};

export const certificateWatermarkThemes: Record<CertificateNr, CertificateWatermarkTheme> = {
  "NR-05": {
    nr: "NR-05",
    label: "CIPA e prevenção",
    eyebrow: "Participação · prevenção · cuidado",
    description: "Composição inspirada em pessoas, diálogo e prevenção coletiva.",
    color: "#8c6f3d",
    kind: "cipa",
  },
  "NR-10": {
    nr: "NR-10",
    label: "Eletricidade segura",
    eyebrow: "Energia · controle · proteção",
    description: "Traços de circuito e pulso elétrico para cursos de instalações elétricas.",
    color: "#0c8c89",
    kind: "electricity",
  },
  "NR-15": {
    nr: "NR-15",
    label: "Ruído ocupacional",
    eyebrow: "Exposição · medição · controle",
    description: "Ondas concêntricas discretas representam medição e conservação auditiva.",
    color: "#2b9a70",
    kind: "noise",
  },
  "NR-20": {
    nr: "NR-20",
    label: "Inflamáveis",
    eyebrow: "Inflamáveis · emergência · controle",
    description: "Linhas orgânicas lembram chama e contenção, sem competir com o conteúdo.",
    color: "#d78343",
    kind: "fire",
  },
  "NR-33": {
    nr: "NR-33",
    label: "Espaço confinado",
    eyebrow: "Atmosfera · acesso · resgate",
    description: "Geometria de acesso e monitoramento atmosférico para espaços confinados.",
    color: "#c85e55",
    kind: "confined",
  },
  "NR-35": {
    nr: "NR-35",
    label: "Trabalho em altura",
    eyebrow: "Altura · ancoragem · resgate",
    description: "Linhas de ancoragem e horizonte elevado para capacitações em altura.",
    color: "#3b72a4",
    kind: "height",
  },
};

export function getCertificateWatermarkTheme(nr: CertificateNr) {
  return certificateWatermarkThemes[nr];
}

function escapeXml(value: string) {
  return value.replace(/[&<>\"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;", "'": "&apos;" })[character] ?? character);
}

export function getCertificateWatermarkSvgDataUrl(nr: CertificateNr, color: string, opacity = 0.16) {
  const safeColor = escapeXml(color);
  const safeOpacity = Math.max(0.04, Math.min(opacity, 0.36));
  const artwork = {
    cipa: `<g fill="none" stroke="${safeColor}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><circle cx="355" cy="210" r="62"/><circle cx="545" cy="210" r="62"/><path d="M245 500c18-105 83-155 165-155s147 50 165 155"/><path d="M325 370c-48 19-85 57-101 130M575 370c48 19 85 57 101 130"/><path d="M450 145v198M386 244h128"/></g>`,
    electricity: `<g fill="none" stroke="${safeColor}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M520 76 350 318h108l-56 248 170-284H466z"/><path d="M118 158h100l36 42h86M118 482h105l38-45h88"/><circle cx="94" cy="158" r="20"/><circle cx="94" cy="482" r="20"/><circle cx="284" cy="200" r="12"/><circle cx="284" cy="437" r="12"/></g>`,
    noise: `<g fill="none" stroke="${safeColor}" stroke-width="7" stroke-linecap="round"><path d="M150 340c58-110 102 110 160 0s102 110 160 0 102 110 160 0 102 110 160 0"/><path d="M185 450c45-70 80 70 125 0s80 70 125 0 80 70 125 0 80 70 125 0"/><circle cx="450" cy="340" r="172" stroke-dasharray="2 28"/></g>`,
    fire: `<g fill="none" stroke="${safeColor}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M450 560c-120 0-171-82-139-164 20-51 73-75 74-165 73 51 114 105 93 165 36-21 54-67 43-112 91 73 117 178 67 231-31 33-79 45-138 45Z"/><path d="M450 499c-47 0-67-31-55-65 8-22 30-33 31-72 31 24 47 46 39 73 16-10 22-26 21-43 35 30 44 67 24 91-14 12-34 16-60 16Z"/></g>`,
    confined: `<g fill="none" stroke="${safeColor}" stroke-width="7" stroke-linecap="round"><ellipse cx="450" cy="320" rx="282" ry="202"/><ellipse cx="450" cy="320" rx="190" ry="135"/><ellipse cx="450" cy="320" rx="98" ry="68"/><path d="M450 118v-54M450 576v-54M168 320h-56M788 320h-56"/><circle cx="450" cy="320" r="22"/></g>`,
    height: `<g fill="none" stroke="${safeColor}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M128 525h644M194 525 365 225l74 116 75-153 157 337"/><path d="M584 130c-73 20-116 76-116 147 0 78 54 129 127 129"/><circle cx="468" cy="277" r="17"/><path d="M468 294v106M468 334l-58 55M468 334l70 28"/></g>`,
  }[getCertificateWatermarkTheme(nr).kind];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 640"><rect width="900" height="640" fill="none"/><g opacity="${safeOpacity}">${artwork}</g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

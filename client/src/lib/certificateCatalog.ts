export type CertificateNr = "NR-10" | "NR-15" | "NR-20" | "NR-33" | "NR-35";

export type CertificateCourse = {
  name: string;
  workload: string;
};

export type CertificateNrDefinition = {
  title: string;
  colors: [string, string];
  courses: CertificateCourse[];
  content: string[];
  defaultValidityMonths: "12" | "24";
};

export const certificateCatalog: Record<CertificateNr, CertificateNrDefinition> = {
  "NR-10": {
    title: "Segurança em Instalações e Serviços com Eletricidade",
    colors: ["#1d9b98", "#08706f"],
    courses: [
      { name: "Básico — Segurança em Instalações Elétricas", workload: "40h" },
      { name: "Complementar — Sistema Elétrico de Potência (SEP)", workload: "40h" },
    ],
    content: [
      "Introdução à segurança com eletricidade",
      "Riscos em instalações elétricas: choque, arcos e queimaduras",
      "Técnicas de análise de risco",
      "Medidas de controle: desenergização, aterramento e equipotencialização",
      "Normas técnicas NBR-5410 e NBR 14039",
      "Equipamentos de proteção coletiva e individual",
      "Procedimentos de trabalho em instalações desenergizadas e energizadas",
      "Primeiros socorros e resgate em acidentes elétricos",
    ],
    defaultValidityMonths: "24",
  },
  "NR-15": {
    title: "Atividades e Operações Insalubres — Ruído Ocupacional",
    colors: ["#2b9a70", "#167252"],
    courses: [
      { name: "Ruído contínuo ou intermitente", workload: "Conforme NR-15" },
      { name: "Ruído de impacto", workload: "Conforme NR-15" },
    ],
    content: [
      "Conceitos de ruído contínuo, intermitente e de impacto",
      "Limites de tolerância para ruído contínuo",
      "Cálculo da exposição diária",
      "Medição com decibelímetro e critérios de avaliação",
      "Avaliação de ruído de impacto",
      "Equipamentos de proteção auditiva",
      "Programa de conservação auditiva",
    ],
    defaultValidityMonths: "24",
  },
  "NR-20": {
    title: "Segurança com Inflamáveis e Líquidos Combustíveis",
    colors: ["#d78343", "#a9552c"],
    courses: [
      { name: "Iniciação sobre inflamáveis e combustíveis", workload: "3h" },
      { name: "Básico", workload: "4h a 8h" },
      { name: "Intermediário", workload: "12h a 16h" },
      { name: "Avançado I", workload: "20h" },
      { name: "Avançado II", workload: "32h" },
      { name: "Específico", workload: "14h a 16h" },
    ],
    content: [
      "Características, propriedades e riscos dos inflamáveis",
      "Controles coletivos e individuais para trabalhos com inflamáveis",
      "Controle de fontes de ignição",
      "Proteção contra incêndio com inflamáveis",
      "Procedimentos em situações de emergência",
      "Análise preliminar de perigos e riscos",
      "Permissão para trabalho com inflamáveis",
      "Sistemas de prevenção e controle de vazamentos",
    ],
    defaultValidityMonths: "24",
  },
  "NR-33": {
    title: "Segurança e Saúde nos Trabalhos em Espaços Confinados",
    colors: ["#c85e55", "#913b3a"],
    courses: [
      { name: "Supervisor de entrada", workload: "40h" },
      { name: "Vigia / trabalhador autorizado", workload: "16h" },
      { name: "Equipe de resgate — nível 1", workload: "24h" },
      { name: "Equipe de resgate — nível 2", workload: "32h" },
    ],
    content: [
      "Definição e caracterização de espaços confinados",
      "Identificação, avaliação e controle de riscos",
      "Funcionamento de equipamentos de detecção de gases",
      "Procedimentos e utilização da Permissão de Entrada e Trabalho",
      "Controle de energias perigosas",
      "Ventilação, purga e inertização",
      "Noções de resgate e primeiros socorros",
      "Equipamentos de proteção respiratória",
    ],
    defaultValidityMonths: "12",
  },
  "NR-35": {
    title: "Trabalho em Altura",
    colors: ["#3b72a4", "#23537d"],
    courses: [
      { name: "Trabalho em altura", workload: "8h" },
      { name: "Acesso por cordas", workload: "Conforme Anexo I" },
      { name: "Sistemas de ancoragem", workload: "Conforme Anexo II" },
    ],
    content: [
      "Normas e regulamentos aplicáveis ao trabalho em altura",
      "Análise de risco e condições impeditivas",
      "Riscos potenciais e medidas de prevenção",
      "Sistemas, equipamentos e procedimentos de proteção coletiva",
      "Equipamentos de proteção individual: seleção, inspeção e conservação",
      "Acidentes típicos em trabalhos em altura",
      "Condutas em situações de emergência e noções de resgate",
      "Primeiros socorros e técnicas de salvamento",
    ],
    defaultValidityMonths: "24",
  },
};

export const certificateNrs = Object.keys(certificateCatalog) as CertificateNr[];

export function certificateDescription(nr: CertificateNr, workload: string) {
  if (nr === "NR-10") return `Segurança em instalações elétricas com carga horária de ${workload}`;
  if (nr === "NR-15") return `Capacitação em avaliação e controle de ruído ocupacional — ${workload}`;
  if (nr === "NR-20") return `Capacitação em segurança com inflamáveis — ${workload}`;
  if (nr === "NR-33") return `Capacitação para trabalhos em espaços confinados — ${workload}`;
  return `Capacitação em trabalho em altura com carga horária de ${workload}`;
}

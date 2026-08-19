export type CertificateNr = "NR-01" | "NR-05" | "NR-06" | "NR-10" | "NR-15" | "NR-17" | "NR-18" | "NR-20" | "NR-23" | "NR-33" | "NR-35";

export type CertificateWatermarkKey = CertificateNr | "NR-18-EQUIPMENT";

export type CertificateCourse = {
  name: string;
  workload: string;
  content?: string[];
  practicalContent?: string[];
  watermarkKey?: CertificateWatermarkKey;
};

export type CertificateNrDefinition = {
  title: string;
  colors: [string, string];
  courses: CertificateCourse[];
  content: string[];
  practicalContent?: string[];
  defaultValidityMonths: "12" | "24";
};

export const certificateCatalog: Record<CertificateNr, CertificateNrDefinition> = {
  "NR-01": {
    title: "Disposições Gerais e Gerenciamento de Riscos Ocupacionais",
    colors: ["#1b7a6e", "#10524b"],
    courses: [
      { name: "Integração de SST e GRO/PGR", workload: "4h" },
      { name: "GRO e PGR para lideranças", workload: "8h" },
    ],
    content: [
      "Campo de aplicação, direitos e deveres em segurança e saúde no trabalho",
      "Conceitos de perigo, risco ocupacional, medidas de prevenção e hierarquia de controles",
      "Gerenciamento de Riscos Ocupacionais: identificação de perigos, avaliação e controle",
      "PGR, inventário de riscos e plano de ação",
      "Participação dos trabalhadores, comunicação de riscos e consulta",
      "Procedimentos de trabalho, capacitação e registros de SST",
      "Direito de recusa diante de risco grave e iminente",
      "Prevenção de assédio e violência no trabalho quando aplicável à organização",
    ],
    practicalContent: ["Leitura orientada de um inventário de riscos", "Construção de ação preventiva a partir de um cenário de trabalho"],
    defaultValidityMonths: "24",
  },
  "NR-05": {
    title: "Comissão Interna de Prevenção de Acidentes e de Assédio — CIPA",
    colors: ["#8c6f3d", "#b68b4a"],
    courses: [
      { name: "Treinamento CIPA — Grau de risco 1", workload: "8h" },
      { name: "Treinamento CIPA — Grau de risco 2", workload: "12h" },
      { name: "Treinamento CIPA — Grau de risco 3", workload: "16h" },
      { name: "Treinamento CIPA — Grau de risco 4", workload: "20h" },
    ],
    content: [
      "Objetivos, campo de aplicação e fundamentos da NR-05",
      "Estudo do ambiente, das condições de trabalho e dos riscos do processo produtivo",
      "Atribuições da CIPA, dos representantes e da organização",
      "Identificação de perigos, avaliação de riscos e medidas de prevenção",
      "Noções sobre acidentes e doenças relacionadas ao trabalho",
      "Metodologia de investigação e análise de acidentes e doenças",
      "Princípios gerais de higiene do trabalho e prevenção de riscos",
      "Legislação trabalhista e previdenciária relacionada à segurança e saúde no trabalho",
      "Inclusão de pessoas com deficiência e reabilitados nos processos de trabalho",
      "Processo eleitoral, reuniões, atas, mandato e documentação da CIPA",
      "Prevenção e combate ao assédio sexual e a outras formas de violência no trabalho",
      "Organização da CIPA, SIPAT e integração com SESMT e trabalhadores",
    ],
    practicalContent: ["Levantamento orientado dos riscos do ambiente de trabalho", "Dinâmica de reunião, registro em ata e encaminhamento de medidas preventivas"],
    defaultValidityMonths: "24",
  },
  "NR-06": {
    title: "Equipamento de Proteção Individual — EPI",
    colors: ["#346e87", "#234d65"],
    courses: [
      { name: "Seleção, uso, guarda e conservação de EPI", workload: "4h" },
      { name: "Gestão de EPI, CA e ficha de entrega", workload: "6h" },
    ],
    content: [
      "Conceito, finalidade e limites de proteção do EPI",
      "Responsabilidades da organização e do trabalhador",
      "Critérios de seleção conforme riscos e atividade",
      "Certificado de Aprovação, compatibilidade e validade",
      "Ajuste, uso correto, higienização, guarda e conservação",
      "Inspeção, substituição, descarte e comunicação de dano ou extravio",
      "Integração entre EPI, EPC, procedimentos e treinamentos",
      "Registro de entrega, orientação e evidências de uso",
    ],
    practicalContent: ["Inspeção orientada e ajuste de EPIs compatíveis com a atividade", "Preenchimento de ficha de entrega e análise de CA"],
    defaultValidityMonths: "24",
  },
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
    practicalContent: ["Simulação de desenergização e aterramento", "Práticas de primeiros socorros e resgate"],
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
    practicalContent: ["Medições práticas com decibelímetro", "Avaliação de cenários de exposição"],
    defaultValidityMonths: "24",
  },
  "NR-17": {
    title: "Ergonomia",
    colors: ["#6f5c9c", "#49396d"],
    courses: [
      { name: "Ergonomia e organização do trabalho", workload: "4h" },
      { name: "Ergonomia para trabalho com computadores", workload: "4h" },
      { name: "Movimentação manual de cargas", workload: "6h" },
    ],
    content: [
      "Fundamentos de ergonomia e adaptação das condições de trabalho",
      "Organização do trabalho, exigências cognitivas e pausas",
      "Posturas, mobiliário, equipamentos e ambiente de trabalho",
      "Riscos ergonômicos e prevenção de desconfortos e agravos relacionados ao trabalho",
      "Orientações para trabalho com telas e estações computadorizadas",
      "Princípios para levantamento, transporte e descarga manual de materiais",
      "Comunicação de desconfortos e participação dos trabalhadores nas melhorias",
    ],
    practicalContent: ["Ajuste orientado de posto de trabalho", "Análise de tarefa e proposta de adequação ergonômica"],
    defaultValidityMonths: "24",
  },
  "NR-18": {
    title: "Segurança e Saúde no Trabalho na Indústria da Construção",
    colors: ["#b36a3a", "#80411f"],
    courses: [
      { name: "Integração de segurança na construção", workload: "6h" },
      {
        name: "Operação segura de empilhadeira — contexto NR-18",
        workload: "16h",
        watermarkKey: "NR-18-EQUIPMENT",
        content: [
          "Requisitos de autorização, aptidão, responsabilidades e limites da operação",
          "Identificação dos componentes, capacidade nominal e leitura da placa de carga",
          "Inspeção pré-operacional, checklist diário e comunicação de anomalias",
          "Estabilidade, centro de carga, inclinação, empilhamento e descarregamento",
          "Circulação segura, pedestres, vias, cruzamentos, rampas e sinalização",
          "Abastecimento ou recarga, estacionamento e encerramento da operação",
          "Riscos da operação em canteiro e integração com o plano de movimentação de materiais",
          "Procedimentos de emergência e reporte de incidentes",
        ],
        practicalContent: ["Inspeção pré-operacional da empilhadeira", "Circuito prático supervisionado de movimentação, empilhamento e estacionamento seguro"],
      },
      {
        name: "Operação de grua — contexto NR-18",
        workload: "16h",
        watermarkKey: "NR-18-EQUIPMENT",
        content: [
          "Planejamento da operação e responsabilidades da equipe de içamento",
          "Componentes da grua, limites operacionais e leitura de tabelas de carga",
          "Inspeções, manutenção, documentação e comunicação de condições inseguras",
          "Amarração, acessórios de içamento e verificação de capacidade",
          "Sinalização, comunicação entre operador e sinaleiro/amarrador",
          "Isolamento de área, condições meteorológicas e controle de cargas suspensas",
          "Procedimentos para montagem, operação, parada e situações de emergência",
        ],
        practicalContent: ["Inspeção orientada dos dispositivos e acessórios de içamento", "Simulação supervisionada de comunicação, isolamento e movimentação de carga"],
      },
      {
        name: "Operação de guindaste móvel / Munck — contexto NR-18",
        workload: "16h",
        watermarkKey: "NR-18-EQUIPMENT",
        content: [
          "Planejamento de içamento, avaliação do terreno e estabilização do equipamento",
          "Capacidade de carga, raio de operação e limitações operacionais",
          "Inspeção pré-operacional, patolamento e verificação de acessórios",
          "Amarração de cargas, sinais padronizados e comunicação com a equipe",
          "Isolamento, circulação de pessoas e proibição de movimentação sobre áreas ocupadas",
          "Riscos de tombamento, contato elétrico, vento e cargas instáveis",
          "Parada segura e resposta a anormalidades e emergências",
        ],
        practicalContent: ["Checklist de estabilização e acessórios", "Exercício supervisionado de planejamento de içamento e sinalização"],
      },
      {
        name: "Sinaleiro / amarrador de cargas — contexto NR-18",
        workload: "8h",
        watermarkKey: "NR-18-EQUIPMENT",
        content: [
          "Função, responsabilidades e comunicação na operação de içamento",
          "Identificação de acessórios, capacidade, inspeção e descarte",
          "Técnicas de amarração compatíveis com a carga e o equipamento",
          "Sinais padronizados, comunicação por rádio e coordenação com o operador",
          "Isolamento da área, posicionamento seguro e controle de cargas suspensas",
          "Reconhecimento de condições impeditivas e conduta em emergência",
        ],
        practicalContent: ["Inspeção de cintas, cabos e acessórios", "Treino supervisionado de sinais e amarração compatível com o plano de içamento"],
      },
    ],
    content: [
      "PGR do canteiro, comunicação de riscos e responsabilidades",
      "Organização, sinalização, circulação e áreas de vivência",
      "Medidas de prevenção coletiva, proteção individual e inspeções",
      "Escavações, andaimes, plataformas e proteções contra quedas conforme a atividade",
      "Movimentação de materiais, equipamentos e isolamento de áreas",
      "Procedimentos de emergência, primeiros socorros e reporte de condições inseguras",
    ],
    practicalContent: ["Reconhecimento de riscos em cenário de canteiro", "Inspeção orientada de proteções coletivas e área de trabalho"],
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
    practicalContent: ["Uso de sistemas de segurança contra incêndio", "Simulação de controle de vazamentos"],
    defaultValidityMonths: "24",
  },
  "NR-23": {
    title: "Proteção Contra Incêndios",
    colors: ["#b94b45", "#812f2f"],
    courses: [
      { name: "Prevenção e combate a princípio de incêndio", workload: "4h" },
      { name: "Abandono de área e resposta inicial a emergências", workload: "4h" },
    ],
    content: [
      "Objetivos da proteção contra incêndio no local de trabalho",
      "Classes de incêndio e agentes extintores compatíveis",
      "Reconhecimento, inspeção e uso seguro de equipamentos de combate",
      "Rotas de fuga, saídas, sinalização, alarme e ponto de encontro",
      "Procedimentos de abandono de área e comunicação de emergência",
      "Limites de atuação, preservação da vida e acionamento de socorro especializado",
      "Noções de prevenção de fontes de ignição e organização do local de trabalho",
    ],
    practicalContent: ["Reconhecimento de rota de fuga e equipamentos do ambiente", "Simulação orientada de abandono e comunicação de emergência"],
    defaultValidityMonths: "12",
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
    practicalContent: ["Simulação de entrada em espaço confinado", "Uso de equipamentos de detecção de gases e resgate"],
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
    practicalContent: ["Procedimentos para realização de trabalhos em altura", "Simulação de uso dos EPIs e EPCs"],
    defaultValidityMonths: "24",
  },
};

export const certificateNrs = Object.keys(certificateCatalog) as CertificateNr[];

export function getCertificateCourse(nr: CertificateNr, courseName: string) {
  const definition = certificateCatalog[nr];
  return definition.courses.find(course => course.name === courseName) ?? definition.courses[0];
}

export function getSuggestedProgramContent(nr: CertificateNr, courseName: string) {
  const course = getCertificateCourse(nr, courseName);
  return course.content ?? certificateCatalog[nr].content;
}

export function getSuggestedPracticalContent(nr: CertificateNr, courseName: string) {
  const course = getCertificateCourse(nr, courseName);
  return course.practicalContent ?? certificateCatalog[nr].practicalContent ?? [];
}

export function getCertificateWatermarkKey(nr: CertificateNr, courseName: string): CertificateWatermarkKey {
  return getCertificateCourse(nr, courseName).watermarkKey ?? nr;
}

export function certificateDescription(nr: CertificateNr, workload: string) {
  if (nr === "NR-01") return `Capacitação em disposições gerais e gerenciamento de riscos ocupacionais — ${workload}`;
  if (nr === "NR-05") return `Capacitação para integrantes da CIPA e representante da NR-05 — ${workload}`;
  if (nr === "NR-06") return `Capacitação em seleção, uso e gestão de equipamentos de proteção individual — ${workload}`;
  if (nr === "NR-10") return `Segurança em instalações elétricas com carga horária de ${workload}`;
  if (nr === "NR-15") return `Capacitação em avaliação e controle de ruído ocupacional — ${workload}`;
  if (nr === "NR-17") return `Capacitação em ergonomia e organização segura do trabalho — ${workload}`;
  if (nr === "NR-18") return `Capacitação em segurança e saúde na indústria da construção — ${workload}`;
  if (nr === "NR-20") return `Capacitação em segurança com inflamáveis — ${workload}`;
  if (nr === "NR-23") return `Capacitação em proteção contra incêndios e resposta inicial a emergências — ${workload}`;
  if (nr === "NR-33") return `Capacitação para trabalhos em espaços confinados — ${workload}`;
  return `Capacitação em trabalho em altura com carga horária de ${workload}`;
}

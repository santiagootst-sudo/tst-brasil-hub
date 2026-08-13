export type CipaFormData = {
  empresa: string;
  cnpj: string;
  grauRisco: number;
  empregados: number;
  endereco: string;
  sindicato: string;
  cidade: string;
  dataInicioInscricao: string;
  dataVotacao: string;
  localVotacao: string;
  dataPosse: string;
  dataCurso1: string;
  dataCurso2: string;
  dataCurso3: string;
  presidenteCE: string;
  secretarioCE: string;
  escrutinadorCE: string;
  representanteLegal: string;
  titularesEmpregador: number;
  suplentesEmpregador: number;
  titularesEmpregados: number;
  suplentesEmpregados: number;
};

export type CipaComposition = {
  titularesEmpregador: number;
  suplentesEmpregador: number;
  titularesEmpregados: number;
  suplentesEmpregados: number;
  obrigatoria: boolean;
  mensagem: string;
};

export type CipaDocument = {
  id: string;
  title: string;
  category: "processo-eleitoral" | "capacitacao" | "gestao";
  description: string;
  content: string;
};

export const emptyCipaForm: CipaFormData = {
  empresa: "",
  cnpj: "",
  grauRisco: 1,
  empregados: 0,
  endereco: "",
  sindicato: "",
  cidade: "",
  dataInicioInscricao: "",
  dataVotacao: "",
  localVotacao: "",
  dataPosse: "",
  dataCurso1: "",
  dataCurso2: "",
  dataCurso3: "",
  presidenteCE: "",
  secretarioCE: "",
  escrutinadorCE: "",
  representanteLegal: "",
  titularesEmpregador: 0,
  suplentesEmpregador: 0,
  titularesEmpregados: 0,
  suplentesEmpregados: 0,
};

function compositionForBand(gr: number, employees: number): Omit<CipaComposition, "obrigatoria" | "mensagem"> {
  if (employees <= 50) return { titularesEmpregador: 1, suplentesEmpregador: 0, titularesEmpregados: 1, suplentesEmpregados: 0 };
  if (employees <= 100) return { titularesEmpregador: 1, suplentesEmpregador: 1, titularesEmpregados: 1, suplentesEmpregados: 1 };
  if (employees <= 250) return { titularesEmpregador: 2, suplentesEmpregador: 1, titularesEmpregados: 2, suplentesEmpregados: 1 };
  if (employees <= 500) return { titularesEmpregador: 2, suplentesEmpregador: 2, titularesEmpregados: 2, suplentesEmpregados: 2 };
  if (gr <= 2) return { titularesEmpregador: 3, suplentesEmpregador: 2, titularesEmpregados: 3, suplentesEmpregados: 2 };
  if (employees <= 1000) return { titularesEmpregador: 3, suplentesEmpregador: 2, titularesEmpregados: 3, suplentesEmpregados: 2 };
  if (employees <= 2000) return { titularesEmpregador: 4, suplentesEmpregador: 3, titularesEmpregados: 4, suplentesEmpregados: 3 };
  return { titularesEmpregador: 5, suplentesEmpregador: 4, titularesEmpregados: 5, suplentesEmpregados: 4 };
}

export function suggestCipaComposition(grauRisco: number, empregados: number): CipaComposition {
  const gr = Math.min(4, Math.max(1, Number(grauRisco) || 1));
  const employees = Math.max(0, Number(empregados) || 0);
  if (employees < 20) {
    return {
      titularesEmpregador: 0,
      suplentesEmpregador: 0,
      titularesEmpregados: 0,
      suplentesEmpregados: 0,
      obrigatoria: false,
      mensagem: "Com menos de 20 empregados, revise o enquadramento aplicável da NR-05 e avalie a designação de responsável pelo cumprimento dos objetivos da CIPA.",
    };
  }
  const composition = compositionForBand(gr, employees);
  return {
    ...composition,
    obrigatoria: true,
    mensagem: `Sugestão inicial para grau de risco ${gr} e ${employees} empregados. Confirme o Quadro I da NR-05 e o enquadramento oficial antes de emitir os documentos.`,
  };
}

export function formatDate(value: string) {
  if (!value) return "____/____/________";
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("pt-BR");
}

function memberLines(count: number, label: string) {
  if (!count) return "Nenhum membro informado nesta categoria.";
  return Array.from({ length: count }, (_, index) => `${index + 1}. ____________________________________ — ${label}`).join("\n");
}

export function buildCipaDocuments(data: CipaFormData): CipaDocument[] {
  const today = new Date().toLocaleDateString("pt-BR");
  const company = data.empresa || "Empresa não informada";
  const city = data.cidade || "Cidade/UF";
  const docs: CipaDocument[] = [
    {
      id: "memorando",
      title: "Memorando de abertura do processo",
      category: "processo-eleitoral",
      description: "Comunicação interna para autorização do processo eleitoral da CIPA.",
      content: `MEMORANDO INTERNO\n\nDe: Técnico de Segurança do Trabalho\nPara: Diretoria / RH — ${company}\nData: ${today}\n\nAssunto: Abertura do processo de constituição da CIPA\n\nEm atendimento à NR-05, solicito autorização para iniciar o processo eleitoral da Comissão Interna de Prevenção de Acidentes e de Assédio (CIPA) da empresa ${company}, CNPJ ${data.cnpj || "não informado"}.\n\nO estabelecimento possui ${data.empregados || 0} empregado(s) e grau de risco ${data.grauRisco}. A composição informada no assistente é de ${data.titularesEmpregador + data.suplentesEmpregador + data.titularesEmpregados + data.suplentesEmpregados} membro(s), entre titulares e suplentes.\n\nApós validação do enquadramento no Quadro I da NR-05, deverá ser constituída a Comissão Eleitoral e publicado o edital de convocação.\n\nAtenciosamente,\n\n${data.representanteLegal || "Representante legal"}\n${city}`,
    },
    {
      id: "ata-comissao-eleitoral",
      title: "Ata de constituição da Comissão Eleitoral",
      category: "processo-eleitoral",
      description: "Registro da constituição da comissão responsável pelo processo eleitoral.",
      content: `ATA DE CONSTITUIÇÃO DA COMISSÃO ELEITORAL DA CIPA\n\n${company} — CNPJ ${data.cnpj || "não informado"}\n\nAos ${today}, reuniram-se os abaixo assinados para constituir a Comissão Eleitoral responsável por conduzir o processo de eleição da CIPA, em conformidade com a NR-05.\n\nMembros designados:\n1. ${data.presidenteCE || "Não informado"} — Presidente da Comissão Eleitoral\n2. ${data.secretarioCE || "Não informado"} — Secretário(a) da Comissão Eleitoral\n3. ${data.escrutinadorCE || "Não informado"} — Escrutinador(a)\n\nCompete à comissão elaborar e divulgar o edital, receber inscrições, divulgar candidatos aptos, conduzir a votação, apurar os votos e lavrar a ata de eleição.\n\n${city}, ${today}.\n\n__________________________________\n${data.presidenteCE || "Presidente da Comissão Eleitoral"}\n\n__________________________________\n${data.secretarioCE || "Secretário(a) da Comissão Eleitoral"}`,
    },
    {
      id: "edital-convocacao",
      title: "Edital de convocação para eleição",
      category: "processo-eleitoral",
      description: "Edital com período de inscrição, votação, local e responsáveis.",
      content: `EDITAL DE CONVOCAÇÃO PARA ELEIÇÃO DA CIPA\n\n${company}\n\nA Comissão Eleitoral convoca todos os empregados do estabelecimento a participarem do processo eleitoral de constituição da CIPA, em conformidade com a NR-05.\n\n1. Período de inscrição: ${formatDate(data.dataInicioInscricao)} até ${formatDate(data.dataVotacao)}\nResponsáveis: ${data.presidenteCE || "Comissão Eleitoral"} e ${data.secretarioCE || "Comissão Eleitoral"}\n\n2. Data da votação: ${formatDate(data.dataVotacao)}\nHorário: das 08:00 às 17:00\nLocal: ${data.localVotacao || "Local a definir"}\n\n3. Apuração: logo após o encerramento da votação, no mesmo local.\n\nPodem se candidatar os empregados que atendam aos requisitos da NR-05.\n\n${city}, ${today}.\n\nComissão Eleitoral da CIPA\n\n__________________________________\n${data.presidenteCE || "Presidente da Comissão Eleitoral"}`,
    },
    {
      id: "ficha-inscricao",
      title: "Ficha de inscrição de candidato",
      category: "processo-eleitoral",
      description: "Ficha individual para inscrição dos candidatos à representação dos empregados.",
      content: `FICHA DE INSCRIÇÃO — ELEIÇÃO CIPA\n\n${company}\n\nNome completo: _______________________________________________\n\nFunção registrada: ____________________________________________\n\nSetor: _______________________________________________________\n\nData de admissão: ____/____/________\n\nData da inscrição: ____/____/________\n\nDeclaro estar ciente dos requisitos da NR-05 para candidatura à CIPA.\n\nAssinatura do candidato: ______________________________________\n\nRecebido por: ________________________________________________\n\n${city}, ${today}.`,
    },
    {
      id: "lista-presenca",
      title: "Lista de presença da votação",
      category: "processo-eleitoral",
      description: "Controle de comparecimento dos empregados aptos a votar.",
      content: `LISTA DE PRESENÇA — VOTAÇÃO CIPA\n\n${company}\nData: ${formatDate(data.dataVotacao)}\nHorário: 08:00 às 17:00\nLocal: ${data.localVotacao || "Local a definir"}\n\nObjetivo: votação para escolha dos representantes dos empregados na CIPA.\n\nNº | Nome do empregado | Assinatura\n----+-------------------+------------------\n${Array.from({ length: Math.min(Math.max(data.empregados, 1), 20) }, (_, index) => `${String(index + 1).padStart(2, " ")} | __________________ | _______________`).join("\n")}\n\nTotal de empregados aptos a votar: ${data.empregados || 0}`,
    },
    {
      id: "convocacao-curso",
      title: "Convocação para capacitação da CIPA",
      category: "capacitacao",
      description: "Convocação dos membros para o treinamento obrigatório da CIPA.",
      content: `CONVOCAÇÃO PARA CAPACITAÇÃO DA CIPA\n\n${company}\n\nConvocamos os membros da CIPA para a capacitação prevista na NR-05, nos seguintes dias:\n\nDia 1: ${formatDate(data.dataCurso1)} — 08:00 às 17:00\nDia 2: ${formatDate(data.dataCurso2)} — 08:00 às 17:00\nDia 3: ${formatDate(data.dataCurso3)} — 08:00 às 12:00\n\nConteúdo programático: estudo do ambiente e das condições de trabalho; riscos do processo produtivo; acidentes e doenças relacionadas ao trabalho; investigação de acidentes; higiene do trabalho e prevenção; legislação aplicável; inclusão e prevenção do assédio e da violência no trabalho; organização e atribuições da CIPA.\n\nMembros convocados:\n${memberLines(data.titularesEmpregador, "Titular — empregador")}\n${memberLines(data.titularesEmpregados, "Titular — empregados")}\n${memberLines(data.suplentesEmpregador, "Suplente — empregador")}\n${memberLines(data.suplentesEmpregados, "Suplente — empregados")}\n\n${city}, ${today}.\n\n__________________________________\n${data.representanteLegal || "Representante legal"}`,
    },
    {
      id: "ata-posse",
      title: "Ata de instalação e posse",
      category: "gestao",
      description: "Registro da instalação da comissão e da posse dos membros.",
      content: `ATA DE INSTALAÇÃO E POSSE DA CIPA\n\n${company} — CNPJ ${data.cnpj || "não informado"}\n\nAos ${formatDate(data.dataPosse)}, reuniram-se os membros eleitos e designados para instalação e posse da CIPA, conforme a NR-05.\n\nRepresentantes do empregador — titulares:\n${memberLines(data.titularesEmpregador, "Titular — empregador")}\n\nRepresentantes do empregador — suplentes:\n${memberLines(data.suplentesEmpregador, "Suplente — empregador")}\n\nRepresentantes dos empregados — titulares:\n${memberLines(data.titularesEmpregados, "Titular — empregados")}\n\nRepresentantes dos empregados — suplentes:\n${memberLines(data.suplentesEmpregados, "Suplente — empregados")}\n\nAs reuniões ordinárias serão realizadas mensalmente, conforme calendário definido pela comissão. O mandato terá duração de 01 (um) ano, salvo disposição normativa aplicável.\n\n${city}, ${formatDate(data.dataPosse)}.\n\n__________________________________\nPresidente da CIPA\n\n__________________________________\nVice-Presidente da CIPA\n\n__________________________________\nSecretário(a) da CIPA`,
    },
    {
      id: "plano-trabalho",
      title: "Plano de trabalho da CIPA",
      category: "gestao",
      description: "Plano inicial de ações preventivas para organizar a gestão anual.",
      content: `PLANO DE TRABALHO DA CIPA\n\n${company}\n\n1. Planejar a SIPAT — promover ações educativas e preventivas — responsável: CIPA.\n2. Realizar inspeções de segurança — identificar riscos e oportunidades de melhoria — responsável: CIPA / SESMT.\n3. Acompanhar ações preventivas — monitorar prazos e evidências — responsável: CIPA.\n4. Apoiar a integração de novos empregados — reforçar procedimentos de segurança — responsável: SESMT / CIPA.\n5. Desenvolver campanhas de prevenção — ampliar a percepção de riscos — responsável: CIPA.\n\nAs ações devem ser detalhadas, aprovadas em reunião e acompanhadas com evidências e responsáveis definidos.\n\n${city}, ${today}.\n\n__________________________________\nPresidente da CIPA\n\n__________________________________\nSecretário(a) da CIPA`,
    },
  ];
  return docs;
}

export function validateCipaForm(data: CipaFormData) {
  const errors: string[] = [];
  if (!data.empresa.trim()) errors.push("Informe o nome da empresa.");
  if (!data.cidade.trim()) errors.push("Informe a cidade/UF para assinatura dos documentos.");
  if (!data.dataInicioInscricao || !data.dataVotacao) errors.push("Informe as datas de inscrição e votação.");
  return errors;
}

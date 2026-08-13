export type CipaEmployee = {
  id: string;
  name: string;
  cpf: string;
  registration: string;
  role: string;
  department: string;
  email: string;
  eligibleToVote: boolean;
  candidate: boolean;
};

const normalizeKey = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]/g, "");

const normalizeBoolean = (value: string) => ["sim", "s", "yes", "y", "true", "1", "candidato", "apto"].includes(normalizeKey(value));

function parseLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  cells.push(current.trim());
  return cells;
}

function guessDelimiter(header: string) {
  const candidates = [";", "\t", ","];
  return candidates.sort((a, b) => parseLine(header, b).length - parseLine(header, a).length)[0];
}

function valueByAliases(row: Record<string, string>, aliases: string[]) {
  const aliasSet = new Set(aliases.map(normalizeKey));
  const entry = Object.entries(row).find(([key]) => aliasSet.has(normalizeKey(key)));
  return entry?.[1]?.trim() ?? "";
}

export function parseCipaEmployeeFile(content: string): CipaEmployee[] {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error("A planilha precisa conter uma linha de cabeçalho e pelo menos um funcionário.");
  const delimiter = guessDelimiter(lines[0]);
  const headers = parseLine(lines[0], delimiter);
  if (!headers.some(header => ["nome", "nomecompleto", "funcionario", "colaborador"].includes(normalizeKey(header)))) {
    throw new Error("Não encontrei a coluna Nome. Use o modelo de planilha disponível no Assistant CIPA.");
  }
  const employees = lines.slice(1).map((line, index) => {
    const values = parseLine(line, delimiter);
    const row = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex] ?? ""]));
    const name = valueByAliases(row, ["nome", "nome completo", "funcionario", "colaborador"]);
    return {
      id: `${index + 1}-${normalizeKey(name) || "funcionario"}`,
      name,
      cpf: valueByAliases(row, ["cpf", "documento"]),
      registration: valueByAliases(row, ["matricula", "registro", "id"]),
      role: valueByAliases(row, ["cargo", "funcao", "função"]),
      department: valueByAliases(row, ["setor", "departamento", "area", "área"]),
      email: valueByAliases(row, ["email", "e-mail"]),
      eligibleToVote: !valueByAliases(row, ["apto votar", "apto", "elegivel", "elegível"]) || normalizeBoolean(valueByAliases(row, ["apto votar", "apto", "elegivel", "elegível"])),
      candidate: normalizeBoolean(valueByAliases(row, ["candidato", "candidatura", "inscrito"])),
    } satisfies CipaEmployee;
  }).filter(employee => employee.name);
  if (!employees.length) throw new Error("Nenhum funcionário válido foi encontrado na planilha.");
  return employees;
}

export function buildEmployeeElectionDocuments(employees: CipaEmployee[]) {
  const eligible = employees.filter(employee => employee.eligibleToVote);
  const candidates = employees.filter(employee => employee.candidate);
  const formatRows = (list: CipaEmployee[]) => list.length ? list.map((employee, index) => `${index + 1}. ${employee.name} · ${employee.registration || "Matrícula não informada"} · ${employee.department || "Setor não informado"} · Assinatura: ______________________________`).join("\\n") : "Nenhum registro marcado.";
  return [
    {
      id: "lista-votacao-importada",
      title: "Lista de votação — funcionários importados",
      category: "processo-eleitoral" as const,
      description: "Relação de funcionários marcados como aptos a votar na planilha importada.",
      content: `LISTA DE VOTAÇÃO — ELEIÇÃO CIPA\\n\\nTotal de funcionários importados: ${employees.length}\\nTotal marcado como apto a votar: ${eligible.length}\\n\\n${formatRows(eligible)}\\n\\nResponsável pela conferência: ______________________________\\nData: ____/____/________`,
    },
    {
      id: "lista-candidatos-importada",
      title: "Lista de candidatos — funcionários importados",
      category: "processo-eleitoral" as const,
      description: "Relação inicial de candidatos marcados na planilha e disponível para conferência.",
      content: `LISTA DE CANDIDATOS — ELEIÇÃO CIPA\\n\\nTotal marcado como candidato: ${candidates.length}\\n\\n${formatRows(candidates)}\\n\\nComissão Eleitoral: _________________________________________\\nData: ____/____/________`,
    },
  ];
}

export function employeesToCsvTemplate() {
  return [
    "Nome;CPF;Matrícula;Cargo;Setor;E-mail;Apto votar;Candidato",
    "Maria da Silva;000.000.000-00;MAT-001;Analista;Operação;maria@empresa.com;Sim;Não",
    "João de Souza;111.111.111-11;MAT-002;Técnico;Manutenção;joao@empresa.com;Sim;Sim",
  ].join("\n");
}

export function createMonthlyMeetings(startDate: string, count = 12) {
  const parsed = new Date(`${startDate}T09:00:00`);
  if (Number.isNaN(parsed.getTime())) return [];
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(parsed);
    date.setMonth(parsed.getMonth() + index);
    return {
      id: `cipa-reuniao-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      date: date.toISOString().slice(0, 10),
      time: "09:00",
      title: "Reunião ordinária da CIPA",
      status: "agendada" as const,
      notes: "Pauta a definir pela comissão.",
    };
  });
}

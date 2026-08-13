import { describe, expect, it } from "vitest";
import { buildEmployeeElectionDocuments, createMonthlyMeetings, parseCipaEmployeeFile } from "../client/src/lib/cipaImport";

describe("Assistant CIPA — calendário e importação", () => {
  it("lê CSV separado por ponto e vírgula e normaliza funcionários", () => {
    const employees = parseCipaEmployeeFile([
      "Nome;Matrícula;Cargo;Setor;Apto votar;Candidato",
      "Maria da Silva;MAT-001;Analista;Operação;Sim;Não",
      "João de Souza;MAT-002;Técnico;Manutenção;Não;Sim",
    ].join("\n"));
    expect(employees).toHaveLength(2);
    expect(employees[0]).toMatchObject({ name: "Maria da Silva", registration: "MAT-001", eligibleToVote: true, candidate: false });
    expect(employees[1]).toMatchObject({ name: "João de Souza", eligibleToVote: false, candidate: true });
  });

  it("gera doze reuniões mensais sem duplicar o mês inicial", () => {
    const meetings = createMonthlyMeetings("2026-09-15");
    expect(meetings).toHaveLength(12);
    expect(meetings[0].date).toBe("2026-09-15");
    expect(meetings[11].date).toBe("2027-08-15");
  });

  it("gera listas documentais de votação e candidatos a partir dos registros importados", () => {
    const employees = parseCipaEmployeeFile([
      "Nome;Apto votar;Candidato",
      "Maria da Silva;Sim;Não",
      "João de Souza;Sim;Sim",
    ].join("\n"));
    const documents = buildEmployeeElectionDocuments(employees);
    expect(documents).toHaveLength(2);
    expect(documents[0].content).toContain("Total marcado como apto a votar: 2");
    expect(documents[1].content).toContain("João de Souza");
  });
});

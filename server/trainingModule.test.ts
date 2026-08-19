import { describe, expect, it } from "vitest";
import { buildTrainingAttendancePdf } from "../client/src/lib/pdfReports";
import { createTrainingInput, trainingSchema } from "@shared/contracts/portal";

describe("módulo ampliado de Treinamentos", () => {
  it("aceita instrutor, local, múltiplas datas e participantes no contrato de criação", () => {
    const input = createTrainingInput.parse({
      workspaceId: 7,
      title: "NR-06 — Equipamento de Proteção Individual",
      instructorName: "Técnica de Segurança Responsável",
      location: "Sala de treinamento — Unidade Centro",
      scheduledAt: "2026-09-10T12:00:00.000Z",
      scheduledDates: ["2026-09-10T12:00:00.000Z", "2026-09-11T12:00:00.000Z"],
      participantIds: [11, 12, 13],
      participantCount: 3,
    });
    expect(input.scheduledDates).toHaveLength(2);
    expect(input.participantIds).toEqual([11, 12, 13]);
    expect(input.instructorName).toContain("Técnica");
  });

  it("rejeita identificadores de participantes incompatíveis com o contrato", () => {
    expect(() => createTrainingInput.parse({ workspaceId: 7, title: "NR-06", participantIds: [11, 0] })).toThrow();
    expect(() => createTrainingInput.parse({ workspaceId: 7, title: "NR-06", scheduledDates: Array.from({ length: 31 }, () => new Date()) })).toThrow();
  });

  it("retorna o treinamento com participantes nomeados para o cartão e a ata", () => {
    const training = trainingSchema.parse({
      id: 25,
      workspaceId: 7,
      companyId: 4,
      title: "NR-35 — Trabalho em altura",
      status: "planned",
      scheduledAt: new Date("2026-09-10T12:00:00.000Z"),
      scheduledDates: [new Date("2026-09-10T12:00:00.000Z"), new Date("2026-09-11T12:00:00.000Z")],
      instructorName: "Instrutor credenciado",
      location: "Área de vivência",
      participantCount: 2,
      participants: [{ employeeId: 11, fullName: "Ana da Silva", companyId: 4 }, { employeeId: 12, fullName: "Bruno Souza", companyId: 4 }],
      createdByUserId: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(training.participants.map(participant => participant.fullName)).toEqual(["Ana da Silva", "Bruno Souza"]);
    expect(training.scheduledDates).toHaveLength(2);
  });

  it("monta ata em PDF com lista nominada e abre nova página para listas extensas", () => {
    const names = Array.from({ length: 30 }, (_, index) => ({ fullName: `Participante ${index + 1}` }));
    const pdf = buildTrainingAttendancePdf({
      workspaceName: "Unidade Centro",
      companyName: "Empresa Alfa",
      title: "Treinamento de Integração",
      instructorName: "Responsável técnico",
      location: "Auditório",
      scheduledDates: [new Date("2026-09-10T12:00:00.000Z"), new Date("2026-09-11T12:00:00.000Z")],
      participantCount: names.length,
      participants: names,
    });
    expect(pdf.output("arraybuffer").byteLength).toBeGreaterThan(2_000);
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(2);
  });
});

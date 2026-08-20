import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  cipaCommissionCreatedSchema,
  createCipaCommissionInput,
  createCipaDocumentInput,
  createCipaMeetingInput,
  createCipaMemberInput,
  updateCipaMeetingInput,
  updateCipaMemberElectionInput,
} from "../shared/contracts/portal";

describe("módulo CIPA persistente", () => {
  it("valida uma gestão com empresa, cronograma e grau de risco", () => {
    const result = createCipaCommissionInput.parse({
      workspaceId: 7,
      companyId: 12,
      riskLevel: 3,
      employeeCount: 85,
      termLabel: "2026/2027",
      enrollmentStartsAt: "2026-09-01",
      electionAt: "2026-09-20",
      possessionAt: "2026-10-01",
    });
    expect(result.companyId).toBe(12);
    expect(result.riskLevel).toBe(3);
    expect(result.electionAt).toBeInstanceOf(Date);
  });

  it("recusa grau de risco inválido e mantém a empresa obrigatória", () => {
    expect(() => createCipaCommissionInput.parse({ workspaceId: 7, companyId: 12, riskLevel: 5, employeeCount: 10, termLabel: "2026/2027" })).toThrow();
    expect(() => createCipaCommissionInput.parse({ workspaceId: 7, riskLevel: 3, employeeCount: 10, termLabel: "2026/2027" })).toThrow();
  });

  it("vincula candidatos, resultado consolidado e documentos à mesma gestão", () => {
    expect(createCipaMemberInput.parse({ workspaceId: 7, commissionId: 30, termId: 31, employeeId: 42, role: "candidate" }).condition).toBe("not_applicable");
    expect(updateCipaMemberElectionInput.parse({ workspaceId: 7, memberId: 81, voteCount: 34, status: "elected", condition: "titular" }).voteCount).toBe(34);
    expect(createCipaDocumentInput.parse({ workspaceId: 7, commissionId: 30, termId: 31, type: "notice", title: "Edital de convocação", content: "Conteúdo da convocação CIPA devidamente revisado." }).type).toBe("notice");
  });

  it("vincula reuniões persistentes ao mandato e valida a situação da agenda", () => {
    const created = createCipaMeetingInput.parse({ workspaceId: 7, commissionId: 30, termId: 31, title: "Reunião ordinária de setembro", scheduledAt: "2026-09-15T14:00:00.000Z", status: "scheduled" });
    expect(created.meetingType).toBe("ordinary");
    expect(created.scheduledAt).toBeInstanceOf(Date);
    expect(updateCipaMeetingInput.parse({ workspaceId: 7, meetingId: 44, title: "Reunião extraordinária", meetingType: "extraordinary", scheduledAt: "2026-09-17T15:00:00.000Z", status: "completed" }).status).toBe("completed");
    expect(() => createCipaMeetingInput.parse({ workspaceId: 7, commissionId: 30, termId: 31, title: "R", scheduledAt: "ontem" })).toThrow();
  });

  it("mantém as proteções de isolamento CLT, empresa e logo no código do módulo", () => {
    const router = readFileSync(new URL("./routers/cipaRouter.ts", import.meta.url), "utf8");
    const schema = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8");
    const page = readFileSync(new URL("../client/src/pages/CipaAssistant.tsx", import.meta.url), "utf8");
    expect(router).toContain('workspace?.kind === "clt"');
    expect(router).toContain("employee.companyId !== commission.companyId");
    expect(schema).toContain("cipa_commissions_workspace_company_unique");
    expect(router).toContain("companyLogoUrl: company.logoUrl");
    expect(page).toContain("downloadCipaPdf");
    expect(page).toContain("companyLogoUrl");
    expect(page).toContain("Dossiê persistente");
    expect(router).toContain("createCipaMeeting");
  });

  it("mantém os blocos formais dos modelos enviados nas atas, edital, fichas e cédulas", () => {
    const page = readFileSync(new URL("../client/src/pages/CipaAssistant.tsx", import.meta.url), "utf8");
    expect(page).toContain("ATA DE ELEIÇÃO");
    expect(page).toContain("CANDIDATOS VOTADOS NÃO ELEITOS");
    expect(page).toContain("ATA DE POSSE");
    expect(page).toContain("REPRESENTANTES DA ORGANIZAÇÃO — DESIGNADOS");
    expect(page).toContain("COMUNICAÇÃO AO SINDICATO");
    expect(page).toContain("FICHA DE INSCRIÇÃO — ELEIÇÃO DA CIPA");
    expect(page).toContain("Voto secreto. Não assine nem identifique esta cédula.");
    expect(page).toContain("drawSignatureRow");
    expect(page).toContain("drawTable");
    expect(page).not.toContain("TST Brasil Hub · Assistant CIPA");
  });

  it("mantém a resposta tipada de criação com comissão e mandato", () => {
    const now = new Date("2026-08-18T12:00:00.000Z");
    const result = cipaCommissionCreatedSchema.parse({
      commission: { id: 1, workspaceId: 7, companyId: 12, status: "planning", riskLevel: 3, employeeCount: 85, city: null, workplace: null, unionName: null, createdByUserId: 2, createdAt: now, updatedAt: now },
      term: { id: 2, commissionId: 1, workspaceId: 7, label: "2026/2027", enrollmentStartsAt: null, electionAt: null, possessionAt: null, endsAt: null, status: "planning", createdAt: now, updatedAt: now },
    });
    expect(result.term.commissionId).toBe(result.commission.id);
  });
});

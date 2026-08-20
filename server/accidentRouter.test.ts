import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  createAccidentRecordForWorkspace: vi.fn(),
  getCompanyForWorkspace: vi.fn(),
  getDepartmentForWorkspace: vi.fn(),
  getEmployeeForWorkspace: vi.fn(),
  getInspectionForWorkspace: vi.fn(),
  getOccupationalRiskForWorkspace: vi.fn(),
  getWorkspaceForUser: vi.fn(),
  listAccidentRecordsForWorkspace: vi.fn(),
}));

import * as db from "./db";
import { accidentRouter } from "./routers/accidentRouter";

const date = new Date("2026-08-20T10:00:00.000Z");
const workspace = (role: "owner" | "manager" | "member") => ({ id: 14, name: "CLT", kind: "clt" as const, role });
const occurrence = { id: 71, workspaceId: 14, companyId: 3, departmentId: 7, employeeId: 12, type: "accident" as const, occurredAt: date, summary: "Corte na mão durante ajuste de equipamento.", status: "open" as const, createdByUserId: 5, createdAt: date, updatedAt: date };
const detail = { id: 81, occurrenceId: 71, workspaceId: 14, companyId: 3, departmentId: 7, employeeId: 12, occupationalRiskId: 31, inspectionId: null, accidentNature: "typical" as const, accidentType: "Corte", injuryAgent: "Lâmina", esocialAgentCode: null, characterization: null, medicalTreatment: "Ambulatorial", daysAway: 0, catNumber: null, severity: "minor" as const, immediateActions: "Isolar equipamento.", immediateCause: null, rootCause: null, createdByUserId: 5, createdAt: date, updatedAt: date };
const injury = { id: 91, accidentDetailId: 81, occurrenceId: 71, workspaceId: 14, bodyRegion: "hand_left" as const, bodySide: "left" as const, lesionType: "Corte superficial", severity: "minor" as const, notes: null, sortOrder: 0, createdAt: date, updatedAt: date };

function context(): TrpcContext {
  return { user: { id: 5, openId: "accident-user", email: "tst@example.com", name: "TST", loginMethod: "manus", role: "user", createdAt: date, updatedAt: date, lastSignedIn: date }, req: { protocol: "https", headers: {}, get: () => "localhost" } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
}

describe("accidentRouter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("permite leitura de acidentes para membro vinculado ao ambiente", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("member"));
    db.listAccidentRecordsForWorkspace.mockResolvedValue({ accidents: [{ occurrence, detail, injuries: [injury] }] });
    await expect(accidentRouter.createCaller(context()).accidents({ workspaceId: 14 })).resolves.toMatchObject({ accidents: [{ detail: { id: 81 }, injuries: [{ bodyRegion: "hand_left" }] }] });
  });

  it("bloqueia membro sem gestão de registrar acidente", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("member"));
    await expect(accidentRouter.createCaller(context()).createAccident({ workspaceId: 14, companyId: 3, occurredAt: date, summary: "Corte na mão durante ajuste de equipamento.", injuries: [{ bodyRegion: "hand_left", bodySide: "left", lesionType: "Corte superficial", severity: "minor" }] })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("cria ocorrência, detalhe e lesão após validar os vínculos", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("owner"));
    db.getCompanyForWorkspace.mockResolvedValue({ id: 3, workspaceId: 14, name: "Empresa A" });
    db.getDepartmentForWorkspace.mockResolvedValue({ id: 7, workspaceId: 14, companyId: 3, name: "Produção" });
    db.getEmployeeForWorkspace.mockResolvedValue({ id: 12, workspaceId: 14, companyId: 3, fullName: "Ana" });
    db.getOccupationalRiskForWorkspace.mockResolvedValue({ id: 31, workspaceId: 14, companyId: 3, title: "Risco de corte" });
    db.createAccidentRecordForWorkspace.mockResolvedValue({ occurrence, detail, injuries: [injury] });

    await expect(accidentRouter.createCaller(context()).createAccident({ workspaceId: 14, companyId: 3, departmentId: 7, employeeId: 12, occupationalRiskId: 31, occurredAt: date, summary: "Corte na mão durante ajuste de equipamento.", accidentNature: "typical", daysAway: 0, severity: "minor", injuries: [{ bodyRegion: "hand_left", bodySide: "left", lesionType: "Corte superficial", severity: "minor" }] })).resolves.toMatchObject({ occurrence: { id: 71, type: "accident" }, detail: { id: 81, occupationalRiskId: 31 }, injuries: [{ bodyRegion: "hand_left" }] });

    expect(db.createAccidentRecordForWorkspace).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 14, companyId: 3, createdByUserId: 5, injuries: [expect.objectContaining({ bodyRegion: "hand_left" })] }));
  });
});

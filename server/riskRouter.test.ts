import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  createOccupationalRiskForWorkspace: vi.fn(),
  getCompanyForWorkspace: vi.fn(),
  getDepartmentForWorkspace: vi.fn(),
  getInspectionForWorkspace: vi.fn(),
  getJobRoleForWorkspace: vi.fn(),
  getOccupationalRiskForWorkspace: vi.fn(),
  getWorkspaceForUser: vi.fn(),
  listOccupationalRisksForWorkspace: vi.fn(),
  listPgrProjectsForWorkspace: vi.fn(),
  updateOccupationalRiskForWorkspace: vi.fn(),
}));

import * as db from "./db";
import { riskRouter } from "./routers/riskRouter";

const date = new Date("2026-08-20T00:00:00.000Z");
const workspace = (role: "owner" | "manager" | "member") => ({ id: 14, name: "CLT", kind: "clt" as const, role });
const risk = {
  id: 31,
  workspaceId: 14,
  companyId: 3,
  pgrProjectId: null,
  departmentId: 7,
  jobRoleId: null,
  title: "Ruído de máquinas",
  description: "Exposição contínua na produção.",
  riskGroup: "physical" as const,
  source: "pgr" as const,
  inherentProbability: 4,
  inherentSeverity: 4,
  inherentScore: 16,
  residualProbability: null,
  residualSeverity: null,
  residualScore: null,
  situation: "identified" as const,
  controls: null,
  exposedWorkersCount: 12,
  identifiedAt: date,
  controlVerifiedAt: null,
  eliminatedAt: null,
  lastInspectionId: null,
  createdByUserId: 5,
  createdAt: date,
  updatedAt: date,
};

function context(): TrpcContext {
  return { user: { id: 5, openId: "risk-user", email: "tst@example.com", name: "TST", loginMethod: "manus", role: "user", createdAt: date, updatedAt: date, lastSignedIn: date }, req: { protocol: "https", headers: {}, get: () => "localhost" } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
}

describe("riskRouter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("permite leitura do inventário para membro vinculado", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("member"));
    db.listOccupationalRisksForWorkspace.mockResolvedValue({ risks: [risk], events: [] });
    await expect(riskRouter.createCaller(context()).occupationalRisks({ workspaceId: 14 })).resolves.toMatchObject({ risks: [{ id: 31, inherentScore: 16 }], events: [] });
  });

  it("bloqueia membro de incluir risco no PGR", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("member"));
    await expect(riskRouter.createCaller(context()).createOccupationalRisk({ workspaceId: 14, companyId: 3, title: "Ruído de máquinas", riskGroup: "physical", source: "pgr", inherentProbability: 4, inherentSeverity: 4, exposedWorkersCount: 12 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("cria risco para empresa e setor validados", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("owner"));
    db.getCompanyForWorkspace.mockResolvedValue({ id: 3, workspaceId: 14, name: "Empresa A" });
    db.getDepartmentForWorkspace.mockResolvedValue({ id: 7, workspaceId: 14, companyId: 3, name: "Produção" });
    db.createOccupationalRiskForWorkspace.mockResolvedValue(risk);
    await expect(riskRouter.createCaller(context()).createOccupationalRisk({ workspaceId: 14, companyId: 3, departmentId: 7, title: "Ruído de máquinas", riskGroup: "physical", source: "pgr", inherentProbability: 4, inherentSeverity: 4, exposedWorkersCount: 12 })).resolves.toMatchObject({ id: 31, inherentScore: 16 });
    expect(db.createOccupationalRiskForWorkspace).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 14, companyId: 3, createdByUserId: 5 }));
  });

  it("registra evolução somente para risco do ambiente", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("manager"));
    db.getOccupationalRiskForWorkspace.mockResolvedValue(risk);
    db.updateOccupationalRiskForWorkspace.mockResolvedValue({ ...risk, situation: "controlled", residualProbability: 2, residualSeverity: 2, residualScore: 4, controlVerifiedAt: date, updatedAt: date });
    await expect(riskRouter.createCaller(context()).updateOccupationalRisk({ workspaceId: 14, riskId: 31, situation: "controlled", residualProbability: 2, residualSeverity: 2, notes: "Medição em campo confirmou o controle." })).resolves.toMatchObject({ id: 31, situation: "controlled", residualScore: 4 });
    expect(db.updateOccupationalRiskForWorkspace).toHaveBeenCalledWith(expect.objectContaining({ riskId: 31, workspaceId: 14, updatedByUserId: 5 }));
  });
});

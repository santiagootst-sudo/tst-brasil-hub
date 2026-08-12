import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const db = vi.hoisted(() => ({
  createEpiItemForWorkspace: vi.fn(),
  createEpiRequirementForWorkspace: vi.fn(),
  createSstOccurrenceForWorkspace: vi.fn(),
  getCompanyForWorkspace: vi.fn(),
  getDepartmentForWorkspace: vi.fn(),
  getEmployeeForWorkspace: vi.fn(),
  getEpiItemForWorkspace: vi.fn(),
  getJobRoleForWorkspace: vi.fn(),
  getWorkspaceForUser: vi.fn(),
  listEpiItemsForWorkspace: vi.fn(),
  listEpiRequirementsForWorkspace: vi.fn(),
  listSstOccurrencesForWorkspace: vi.fn(),
}));

vi.mock("./db", () => db);

import { operationsRouter } from "./routers/operationsRouter";

const date = new Date("2026-08-12T00:00:00.000Z");
const workspace = (role: "owner" | "manager" | "member") => ({ id: 9, name: "Operação", kind: "clt" as const, role });

function context(): TrpcContext {
  return {
    user: { id: 7, openId: "operations-user", email: "tst@example.com", name: "TST", loginMethod: "manus", role: "user", createdAt: date, updatedAt: date, lastSignedIn: date },
    req: { protocol: "https", headers: {}, get: () => "localhost" } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("operationsRouter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("permite a leitura operacional para membro do ambiente", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("member"));
    db.listEpiItemsForWorkspace.mockResolvedValue([]);
    db.listEpiRequirementsForWorkspace.mockResolvedValue([]);
    db.listSstOccurrencesForWorkspace.mockResolvedValue([]);
    await expect(operationsRouter.createCaller(context()).operations({ workspaceId: 9 })).resolves.toEqual({ epiItems: [], epiRequirements: [], occurrences: [] });
  });

  it("bloqueia membro de registrar item de EPI", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("member"));
    await expect(operationsRouter.createCaller(context()).createEpiItem({ workspaceId: 9, companyId: 4, name: "Capacete", stockQuantity: 0, minimumStock: 0 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("impede requisito quando item e função pertencem a empresas diferentes", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("owner"));
    db.getCompanyForWorkspace.mockResolvedValue({ id: 4, workspaceId: 9, name: "Empresa A" });
    db.getJobRoleForWorkspace.mockResolvedValue({ id: 8, workspaceId: 9, companyId: 4, name: "Soldador" });
    db.getEpiItemForWorkspace.mockResolvedValue({ id: 11, workspaceId: 9, companyId: 99, name: "Luva" });
    await expect(operationsRouter.createCaller(context()).createEpiRequirement({ workspaceId: 9, companyId: 4, jobRoleId: 8, epiItemId: 11 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("cria ocorrência objetiva para empresa e pessoa validadas", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("owner"));
    db.getCompanyForWorkspace.mockResolvedValue({ id: 4, workspaceId: 9, name: "Empresa A" });
    db.getEmployeeForWorkspace.mockResolvedValue({ id: 12, workspaceId: 9, companyId: 4, fullName: "Pessoa Real" });
    db.createSstOccurrenceForWorkspace.mockResolvedValue({ id: 21, workspaceId: 9, companyId: 4, departmentId: null, employeeId: 12, type: "near_miss", occurredAt: date, summary: "Quase acidente registrado sem dado médico.", status: "open", createdByUserId: 7 });
    await expect(operationsRouter.createCaller(context()).createSstOccurrence({ workspaceId: 9, companyId: 4, employeeId: 12, type: "near_miss", occurredAt: date, summary: "Quase acidente registrado sem dado médico." })).resolves.toMatchObject({ id: 21, status: "open" });
    expect(db.createSstOccurrenceForWorkspace).toHaveBeenCalledWith(expect.objectContaining({ createdByUserId: 7, employeeId: 12 }));
  });
});

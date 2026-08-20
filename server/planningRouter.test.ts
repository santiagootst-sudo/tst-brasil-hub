import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const db = vi.hoisted(() => ({
  createActionItemForWorkspace: vi.fn(),
  createInspectionForWorkspace: vi.fn(),
  createInspectionTemplateForWorkspace: vi.fn(),
  getCompanyForWorkspace: vi.fn(),
  getDepartmentForWorkspace: vi.fn(),
  getEmployeeForWorkspace: vi.fn(),
  getInspectionForWorkspace: vi.fn(),
  getInspectionTemplateForWorkspace: vi.fn(),
  getWorkspaceForUser: vi.fn(),
  listActionItemsForWorkspace: vi.fn(),
  listInspectionsForWorkspace: vi.fn(),
  listInspectionTemplatesForWorkspace: vi.fn(),
}));

vi.mock("./db", () => db);

import { planningRouter } from "./routers/planningRouter";

const date = new Date("2026-08-12T00:00:00.000Z");
const workspace = (role: "owner" | "manager" | "member") => ({ id: 14, name: "Planejamento", kind: "clt" as const, role });
function context(): TrpcContext {
  return { user: { id: 5, openId: "planning-user", email: "tst@example.com", name: "TST", loginMethod: "manus", role: "user", createdAt: date, updatedAt: date, lastSignedIn: date }, req: { protocol: "https", headers: {}, get: () => "localhost" } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
}

describe("planningRouter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("permite a leitura de planejamento para membro vinculado", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("member"));
    db.listInspectionsForWorkspace.mockResolvedValue([]);
    db.listActionItemsForWorkspace.mockResolvedValue([]);
    db.listInspectionTemplatesForWorkspace.mockResolvedValue([]);
    await expect(planningRouter.createCaller(context()).planning({ workspaceId: 14 })).resolves.toEqual({ inspections: [], actionItems: [], templates: [] });
  });

  it("bloqueia membro de criar modelo de checklist", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("member"));
    await expect(planningRouter.createCaller(context()).createInspectionTemplate({ workspaceId: 14, companyId: 3, name: "Checklist", riskType: "Químico", routineType: "Mensal", items: [{ title: "EPI disponível", required: true, sortOrder: 0 }] })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("cria modelo de checklist com itens para empresa validada", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("owner"));
    db.getCompanyForWorkspace.mockResolvedValue({ id: 3, workspaceId: 14, name: "Empresa A" });
    db.createInspectionTemplateForWorkspace.mockResolvedValue({ id: 40, workspaceId: 14, companyId: 3, departmentId: null, name: "Checklist mensal", riskType: "Químico", routineType: "Mensal", description: null, active: true, createdByUserId: 5, createdAt: date, updatedAt: date, items: [{ id: 41, workspaceId: 14, templateId: 40, title: "EPI disponível", guidance: null, required: true, sortOrder: 0, createdAt: date, updatedAt: date }] });
    await expect(planningRouter.createCaller(context()).createInspectionTemplate({ workspaceId: 14, companyId: 3, name: "Checklist mensal", riskType: "Químico", routineType: "Mensal", items: [{ title: "EPI disponível", required: true, sortOrder: 0 }] })).resolves.toMatchObject({ id: 40, items: [{ title: "EPI disponível" }] });
    expect(db.createInspectionTemplateForWorkspace).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 14, companyId: 3, createdByUserId: 5 }));
  });

  it("bloqueia membro de criar inspeção", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("member"));
    await expect(planningRouter.createCaller(context()).createInspection({ workspaceId: 14, companyId: 3, title: "Inspeção de área" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("impede ação vinculada a inspeção de outra empresa", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("owner"));
    db.getCompanyForWorkspace.mockResolvedValue({ id: 3, workspaceId: 14, name: "Empresa A" });
    db.getInspectionForWorkspace.mockResolvedValue({ id: 10, workspaceId: 14, companyId: 99, title: "Outra empresa" });
    await expect(planningRouter.createCaller(context()).createActionItem({ workspaceId: 14, companyId: 3, inspectionId: 10, title: "Ação preventiva" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("cria ação preventiva para empresa e responsável validados", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("owner"));
    db.getCompanyForWorkspace.mockResolvedValue({ id: 3, workspaceId: 14, name: "Empresa A" });
    db.getEmployeeForWorkspace.mockResolvedValue({ id: 8, workspaceId: 14, companyId: 3, fullName: "Responsável Real" });
    db.createActionItemForWorkspace.mockResolvedValue({ id: 22, workspaceId: 14, companyId: 3, inspectionId: null, occupationalRiskId: null, departmentId: null, responsibleEmployeeId: 8, title: "Ação preventiva", description: null, dueAt: null, status: "open", createdByUserId: 5 });
    await expect(planningRouter.createCaller(context()).createActionItem({ workspaceId: 14, companyId: 3, responsibleEmployeeId: 8, title: "Ação preventiva" })).resolves.toMatchObject({ id: 22, status: "open" });
    expect(db.createActionItemForWorkspace).toHaveBeenCalledWith(expect.objectContaining({ createdByUserId: 5, responsibleEmployeeId: 8 }));
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const db = vi.hoisted(() => ({
  createDepartmentForWorkspace: vi.fn(),
  createEmployeeForWorkspace: vi.fn(),
  createJobRoleForWorkspace: vi.fn(),
  getCompanyForWorkspace: vi.fn(),
  getDepartmentForWorkspace: vi.fn(),
  getJobRoleForWorkspace: vi.fn(),
  getWorkspaceForUser: vi.fn(),
  listDepartmentsForWorkspace: vi.fn(),
  listEmployeesForWorkspace: vi.fn(),
  listJobRolesForWorkspace: vi.fn(),
}));

vi.mock("./db", () => db);

import { organizationRouter } from "./routers/organizationRouter";

const date = new Date("2026-08-12T00:00:00.000Z");
const workspace = (role: "owner" | "manager" | "member") => ({ id: 9, name: "Operação SST", kind: "clt" as const, role });

function context(): TrpcContext {
  return {
    user: { id: 7, openId: "organization-user", email: "tst@example.com", name: "TST", loginMethod: "manus", role: "user", createdAt: date, updatedAt: date, lastSignedIn: date },
    req: { protocol: "https", headers: {}, get: () => "localhost" } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("organizationRouter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("permite que membro consulte a estrutura do ambiente vinculado", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("member"));
    db.listDepartmentsForWorkspace.mockResolvedValue([]);
    db.listJobRolesForWorkspace.mockResolvedValue([]);
    db.listEmployeesForWorkspace.mockResolvedValue([]);

    await expect(organizationRouter.createCaller(context()).organization({ workspaceId: 9 })).resolves.toEqual({ departments: [], jobRoles: [], employees: [] });
  });

  it("bloqueia membro de alterar a estrutura", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("member"));
    await expect(organizationRouter.createCaller(context()).createDepartment({ workspaceId: 9, companyId: 4, name: "Produção" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("impede vincular função a setor de outra empresa", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("owner"));
    db.getCompanyForWorkspace.mockResolvedValue({ id: 4, workspaceId: 9, name: "Empresa A" });
    db.getDepartmentForWorkspace.mockResolvedValue({ id: 8, workspaceId: 9, companyId: 99, name: "Engenharia" });

    await expect(organizationRouter.createCaller(context()).createJobRole({ workspaceId: 9, companyId: 4, departmentId: 8, name: "Técnico" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("cria pessoa com setor e função validados no mesmo ambiente", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("owner"));
    db.getCompanyForWorkspace.mockResolvedValue({ id: 4, workspaceId: 9, name: "Empresa A" });
    db.getDepartmentForWorkspace.mockResolvedValue({ id: 8, workspaceId: 9, companyId: 4, name: "Produção" });
    db.getJobRoleForWorkspace.mockResolvedValue({ id: 11, workspaceId: 9, companyId: 4, name: "Técnico" });
    db.createEmployeeForWorkspace.mockResolvedValue({ id: 15, workspaceId: 9, companyId: 4, departmentId: 8, jobRoleId: 11, fullName: "Pessoa Real", email: null, hiredAt: null, status: "active" });

    await expect(organizationRouter.createCaller(context()).createEmployee({ workspaceId: 9, companyId: 4, departmentId: 8, jobRoleId: 11, fullName: "Pessoa Real", hiredAt: null })).resolves.toMatchObject({ id: 15, status: "active" });
    expect(db.createEmployeeForWorkspace).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 9, companyId: 4, jobRoleId: 11 }));
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const db = vi.hoisted(() => ({
  createPgrGheGroupForProject: vi.fn(),
  getPgrProjectForWorkspace: vi.fn(),
  getSubscriptionForUser: vi.fn(),
  getUserById: vi.fn(),
  getWorkspaceForUser: vi.fn(),
  importPgrGheGroupsForProject: vi.fn(),
  listPgrGheGroupsForProject: vi.fn(),
}));

vi.mock("./db", () => db);
vi.mock("./pgrIframeTicket", () => ({ createPgrIframeTicket: vi.fn() }));
vi.mock("./storage", () => ({ storagePut: vi.fn() }));
vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));

import * as portalDb from "./db";
import { pgrRouter } from "./routers/pgrRouter";

const now = new Date("2026-08-26T00:00:00.000Z");
const project = { id: 30001, workspaceId: 30001, companyId: 30001, name: "PGR de teste", legacyStorageKey: "pgr-test" };
const ghe = { id: 91, pgrProjectId: 30001, name: "GHE Operacional / Produção", description: "Atividades produtivas.", suggestedHazards: ["Ruído"], suggestedMeasures: ["EPI"], employeeCount: 0, source: "imported" as const, createdAt: now, updatedAt: now };

function context(userRole: "user" | "admin" = "user"): TrpcContext {
  return {
    user: { id: 7, openId: "pgr-router-user", email: "teste@example.com", name: "Usuário de teste", loginMethod: "direct", role: userRole, accessStatus: "active", accessExpiresAt: null, createdAt: now, updatedAt: now, lastSignedIn: now },
    req: { protocol: "https", headers: {}, get: () => "localhost" } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

function workspace(role: "owner" | "manager" | "member") {
  return { id: 30001, name: "Autônomo de teste", kind: "autonomo" as const, ownerUserId: 7, role, createdAt: now, updatedAt: now };
}

function authorizeDefaults(role: "owner" | "manager" | "member") {
  portalDb.getWorkspaceForUser.mockResolvedValue(workspace(role));
  portalDb.getSubscriptionForUser.mockResolvedValue({ status: "active" });
  portalDb.getPgrProjectForWorkspace.mockResolvedValue(project);
  portalDb.getUserById.mockResolvedValue(context().user);
}

describe("pgrRouter GHE procedures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("permite que um member liste os GHEs do projeto", async () => {
    authorizeDefaults("member");
    portalDb.listPgrGheGroupsForProject.mockResolvedValue([ghe]);

    await expect(pgrRouter.createCaller(context()).listGhes({ workspaceId: 30001, projectId: 30001 })).resolves.toEqual([ghe]);
    expect(portalDb.listPgrGheGroupsForProject).toHaveBeenCalledWith(30001, 30001);
  });

  it.each(["owner", "manager"] as const)("permite que %s crie um GHE com source ai", async role => {
    authorizeDefaults(role);
    portalDb.createPgrGheGroupForProject.mockResolvedValue({ record: { ...ghe, source: "ai" }, created: true });

    await expect(pgrRouter.createCaller(context()).createGhe({
      workspaceId: 30001,
      projectId: 30001,
      name: "GHE Operacional / Produção",
      description: "Atividades produtivas.",
      suggestedHazards: ["Ruído"],
      suggestedMeasures: ["EPI"],
      employeeCount: 0,
    })).resolves.toMatchObject({ created: true, ghe: { source: "ai" } });

    expect(portalDb.createPgrGheGroupForProject).toHaveBeenCalledWith(expect.objectContaining({ companyId: 30001, source: "ai", createdByUserId: 7 }));
  });

  it("bloqueia member de criar ou importar GHEs", async () => {
    authorizeDefaults("member");

    await expect(pgrRouter.createCaller(context()).createGhe({ workspaceId: 30001, projectId: 30001, name: "GHE Novo" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(pgrRouter.createCaller(context()).importGhes({ workspaceId: 30001, projectId: 30001, ghes: [{ name: "GHE Local" }] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(portalDb.createPgrGheGroupForProject).not.toHaveBeenCalled();
    expect(portalDb.importPgrGheGroupsForProject).not.toHaveBeenCalled();
  });

  it("bloqueia workspace incorreto e projeto que não pertence ao workspace", async () => {
    portalDb.getWorkspaceForUser.mockResolvedValue(undefined);
    portalDb.getSubscriptionForUser.mockResolvedValue({ status: "active" });
    portalDb.getPgrProjectForWorkspace.mockResolvedValue(project);
    portalDb.getUserById.mockResolvedValue(context().user);
    await expect(pgrRouter.createCaller(context()).listGhes({ workspaceId: 99999, projectId: 30001 })).rejects.toMatchObject({ code: "FORBIDDEN" });

    authorizeDefaults("owner");
    portalDb.getPgrProjectForWorkspace.mockResolvedValue(undefined);
    await expect(pgrRouter.createCaller(context()).listGhes({ workspaceId: 30001, projectId: 99999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("propaga uma importação idempotente como zero novos e um existente", async () => {
    authorizeDefaults("owner");
    portalDb.importPgrGheGroupsForProject.mockResolvedValue({ importedCount: 0, existingCount: 1, totalCount: 1, ghes: [{ ...ghe, source: "imported" }] });

    await expect(pgrRouter.createCaller(context()).importGhes({ workspaceId: 30001, projectId: 30001, ghes: [{ name: " GHE Operacional / Produção " }] })).resolves.toMatchObject({ importedCount: 0, existingCount: 1, totalCount: 1 });
    expect(portalDb.importPgrGheGroupsForProject).toHaveBeenCalledWith(expect.objectContaining({ companyId: 30001, createdByUserId: 7, ghes: [{ name: "GHE Operacional / Produção" }] }));
  });
});

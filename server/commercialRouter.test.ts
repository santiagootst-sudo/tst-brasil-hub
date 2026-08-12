import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const db = vi.hoisted(() => ({
  createClientEngagementForWorkspace: vi.fn(),
  getCompanyForWorkspace: vi.fn(),
  getClientVisitForWorkspace: vi.fn(),
  getWorkspaceForUser: vi.fn(),
  listClientEngagementsForWorkspace: vi.fn(),
  listClientVisitsForWorkspace: vi.fn(),
  updateClientVisitStatusForWorkspace: vi.fn(),
}));

vi.mock("./db", () => db);

import { commercialRouter } from "./routers/commercialRouter";

const date = new Date("2026-08-12T00:00:00.000Z");
function context(): TrpcContext {
  return { user: { id: 8, openId: "commercial-user", email: "tst@example.com", name: "TST", loginMethod: "manus", role: "user", createdAt: date, updatedAt: date, lastSignedIn: date }, req: { protocol: "https", headers: {}, get: () => "localhost" } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
}
const workspace = (kind: "autonomo" | "clt", role: "owner" | "member") => ({ id: 21, name: "Ambiente", kind, role });

describe("commercialRouter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("permite leitura de carteira a membro do ambiente Autônomo", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("autonomo", "member"));
    db.listClientEngagementsForWorkspace.mockResolvedValue([]);
    db.listClientVisitsForWorkspace.mockResolvedValue([]);
    await expect(commercialRouter.createCaller(context()).commercial({ workspaceId: 21 })).resolves.toEqual({ engagements: [], visits: [] });
  });

  it("bloqueia carteira comercial no ambiente CLT", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("clt", "owner"));
    await expect(commercialRouter.createCaller(context()).commercial({ workspaceId: 21 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("bloqueia membro de classificar uma empresa na carteira", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("autonomo", "member"));
    await expect(commercialRouter.createCaller(context()).createClientEngagement({ workspaceId: 21, companyId: 3, status: "active" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("registra empresa real na carteira do ambiente Autônomo", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("autonomo", "owner"));
    db.getCompanyForWorkspace.mockResolvedValue({ id: 3, workspaceId: 21, name: "Empresa Real" });
    db.createClientEngagementForWorkspace.mockResolvedValue({ id: 4, workspaceId: 21, companyId: 3, status: "active", nextFollowUpAt: null, notes: null, createdByUserId: 8 });
    await expect(commercialRouter.createCaller(context()).createClientEngagement({ workspaceId: 21, companyId: 3, status: "active" })).resolves.toMatchObject({ id: 4, status: "active" });
  });

  it("atualiza o status de visita apenas no ambiente Autônomo autorizado", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("autonomo", "owner"));
    db.getClientVisitForWorkspace.mockResolvedValue({ id: 12, workspaceId: 21, companyId: 3, status: "planned" });
    db.updateClientVisitStatusForWorkspace.mockResolvedValue({ id: 12, workspaceId: 21, companyId: 3, scheduledAt: date, objective: "Visita técnica", notes: null, status: "completed", createdByUserId: 8, createdAt: date, updatedAt: date });
    await expect(commercialRouter.createCaller(context()).updateClientVisitStatus({ workspaceId: 21, visitId: 12, status: "completed" })).resolves.toMatchObject({ id: 12, status: "completed" });
  });
});

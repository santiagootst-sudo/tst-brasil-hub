import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const db = vi.hoisted(() => ({
  createCertificateForWorkspace: vi.fn(),
  createCompanyForWorkspace: vi.fn(),
  createPgrProjectForWorkspace: vi.fn(),
  createTrainingForWorkspace: vi.fn(),
  createWorkspaceForUser: vi.fn(),
  getSubscriptionForUser: vi.fn(),
  getWorkspaceForUser: vi.fn(),
  listCertificatesForWorkspace: vi.fn(),
  listCompaniesForWorkspace: vi.fn(),
  listPgrProjectsForWorkspace: vi.fn(),
  listTrainingsForWorkspace: vi.fn(),
  listWorkspacesForUser: vi.fn(),
}));

vi.mock("./db", () => db);

import { appRouter } from "./routers";

function createContext(): TrpcContext {
  return {
    user: {
      id: 12,
      openId: "workspace-test-user",
      email: "test@example.com",
      name: "Workspace Test",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {}, get: () => "localhost" } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("portal protected flows", () => {
  beforeEach(() => vi.clearAllMocks());

  it("permite que qualquer membro consulte certificados do próprio ambiente", async () => {
    db.getWorkspaceForUser.mockResolvedValue({ id: 7, name: "Unidade A", kind: "clt", role: "member" });
    db.listCertificatesForWorkspace.mockResolvedValue([{ id: 1, participantName: "Ana", trainingName: "NR-35" }]);
    const result = await appRouter.createCaller(createContext()).portal.certificates({ workspaceId: 7 });
    expect(result).toHaveLength(1);
    expect(db.listCertificatesForWorkspace).toHaveBeenCalledWith(7);
  });

  it("permite que qualquer membro consulte treinamentos do próprio ambiente", async () => {
    db.getWorkspaceForUser.mockResolvedValue({ id: 7, name: "Unidade A", kind: "clt", role: "member" });
    db.listTrainingsForWorkspace.mockResolvedValue([{ id: 2, title: "Integração" }]);
    const result = await appRouter.createCaller(createContext()).portal.trainings({ workspaceId: 7 });
    expect(result).toHaveLength(1);
    expect(db.listTrainingsForWorkspace).toHaveBeenCalledWith(7);
  });

  it("bloqueia leitura quando o usuário não pertence ao ambiente", async () => {
    db.getWorkspaceForUser.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext());
    await expect(caller.portal.certificates({ workspaceId: 999 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.portal.trainings({ workspaceId: 999 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("bloqueia membro de registrar certificados ou treinamentos", async () => {
    db.getWorkspaceForUser.mockResolvedValue({ id: 7, name: "Unidade A", kind: "clt", role: "member" });
    const caller = appRouter.createCaller(createContext());
    await expect(caller.portal.createCertificate({ workspaceId: 7, participantName: "Ana", trainingName: "NR-35", issuedAt: new Date() })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.portal.createTraining({ workspaceId: 7, title: "Integração", participantCount: 4 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("permite que proprietário registre certificados e treinamentos", async () => {
    db.getWorkspaceForUser.mockResolvedValue({ id: 7, name: "Unidade A", kind: "clt", role: "owner" });
    db.createCertificateForWorkspace.mockResolvedValue({ id: 31 });
    db.createTrainingForWorkspace.mockResolvedValue({ id: 32 });
    const caller = appRouter.createCaller(createContext());
    await caller.portal.createCertificate({ workspaceId: 7, participantName: "Ana", trainingName: "NR-35", issuedAt: new Date("2026-08-11") });
    await caller.portal.createTraining({ workspaceId: 7, title: "Integração", participantCount: 4 });
    expect(db.createCertificateForWorkspace).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 7, createdByUserId: 12 }));
    expect(db.createTrainingForWorkspace).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 7, participantCount: 4, createdByUserId: 12 }));
  });
});

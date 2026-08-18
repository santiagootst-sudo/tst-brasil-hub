import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const db = vi.hoisted(() => ({
  approveAccessRequest: vi.fn(),
  createManualAccess: vi.fn(),
  getUserById: vi.fn(),
  listAccessRequestsForAdmin: vi.fn(),
  listAdminAccessAudits: vi.fn(),
  listUsersForAdmin: vi.fn(),
  resetAccessCredential: vi.fn(),
  updateUserAccess: vi.fn(),
}));

vi.mock("./db", () => db);

import { adminRouter } from "./routers/adminRouter";
import { protectedProcedure, router } from "./_core/trpc";

const protectedProbe = router({ probe: protectedProcedure.query(() => ({ ok: true })) });

const now = new Date("2026-08-12T00:00:00.000Z");
const adminUser = { id: 1, openId: "owner", email: "owner@example.com", name: "Proprietário", loginMethod: "manus", role: "admin" as const, accessStatus: "active" as const, accessExpiresAt: null, createdAt: now, updatedAt: now, lastSignedIn: now };
const regularUser = { id: 7, openId: "user-7", email: "tst@example.com", name: "TST", loginMethod: "manus", role: "user" as const, accessStatus: "active" as const, accessExpiresAt: null, createdAt: now, updatedAt: now, lastSignedIn: now };

function context(user = adminUser): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {}, get: () => "localhost" } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("adminRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => vi.useRealTimers());

  it("lista usuários e auditoria somente para administrador", async () => {
    db.listUsersForAdmin.mockResolvedValue([regularUser]);
    db.listAdminAccessAudits.mockResolvedValue([]);

    await expect(adminRouter.createCaller(context()).users()).resolves.toEqual([regularUser]);
    await expect(adminRouter.createCaller(context()).audits()).resolves.toEqual([]);
  });

  it("gera acesso para uma solicitação pendente somente como administrador", async () => {
    const request = { id: 31, email: "ana@empresa.com", fullName: "Ana Segurança", status: "requested" };
    db.approveAccessRequest.mockResolvedValue({ request, expiresAt: new Date("2026-09-11T00:00:00.000Z") });
    const result = await adminRouter.createCaller(context()).grantAccess({ requestId: 31, durationDays: 30 });
    expect(db.approveAccessRequest).toHaveBeenCalledWith(expect.objectContaining({ requestId: 31, adminUserId: 1, durationDays: 30, temporaryPassword: expect.stringMatching(/^TST-/) }));
    expect(result.request).toEqual(request);
    await expect(adminRouter.createCaller(context(regularUser)).grantAccess({ requestId: 31, durationDays: 30 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("cria acesso diretamente e permite redefinir a credencial de uma conta liberada", async () => {
    const request = { id: 33, fullName: "Bruna SST", email: "bruna@empresa.com", status: "approved" };
    db.createManualAccess.mockResolvedValue({ request, expiresAt: new Date("2026-09-11T00:00:00.000Z") });
    db.resetAccessCredential.mockResolvedValue({ request, expiresAt: new Date("2026-09-11T00:00:00.000Z") });

    await adminRouter.createCaller(context()).createManualAccess({ fullName: "Bruna SST", email: "bruna@empresa.com", durationDays: 30 });
    expect(db.createManualAccess).toHaveBeenCalledWith(expect.objectContaining({ fullName: "Bruna SST", email: "bruna@empresa.com", adminUserId: 1, durationDays: 30, temporaryPassword: expect.stringMatching(/^TST-/) }));

    await adminRouter.createCaller(context()).resetCredential({ email: "bruna@empresa.com", durationDays: 30 });
    expect(db.resetAccessCredential).toHaveBeenCalledWith(expect.objectContaining({ email: "bruna@empresa.com", adminUserId: 1, durationDays: 30, temporaryPassword: expect.stringMatching(/^TST-/) }));
  });

  it("renova acesso e calcula a validade a partir do momento atual", async () => {
    db.getUserById.mockResolvedValue(regularUser);
    db.updateUserAccess.mockResolvedValue({ ...regularUser, accessStatus: "active", accessExpiresAt: new Date("2026-09-11T00:00:00.000Z") });

    await adminRouter.createCaller(context()).renew({ targetUserId: regularUser.id, durationDays: 30 });

    expect(db.updateUserAccess).toHaveBeenCalledWith({ targetUserId: 7, adminUserId: 1, action: "renew", expiresAt: new Date("2026-09-11T00:00:00.000Z") });
  });

  it("desliga um usuário e impede o administrador de desligar a própria conta", async () => {
    db.getUserById.mockResolvedValue(regularUser);
    db.updateUserAccess.mockResolvedValue({ ...regularUser, accessStatus: "suspended" });

    await adminRouter.createCaller(context()).disable({ targetUserId: regularUser.id });
    expect(db.updateUserAccess).toHaveBeenCalledWith({ targetUserId: 7, adminUserId: 1, action: "disable", expiresAt: null });

    db.getUserById.mockResolvedValueOnce(adminUser);
    await expect(adminRouter.createCaller(context()).disable({ targetUserId: adminUser.id })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("bloqueia procedimento protegido para usuário suspenso", async () => {
    const suspendedUser = { ...regularUser, accessStatus: "suspended" as const };
    await expect(protectedProbe.createCaller(context(suspendedUser)).probe()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("bloqueia usuários não administradores e reativa com período definido", async () => {
    await expect(adminRouter.createCaller(context(regularUser)).users()).rejects.toMatchObject({ code: "FORBIDDEN" });

    db.getUserById.mockResolvedValue({ ...regularUser, accessStatus: "suspended" });
    db.updateUserAccess.mockResolvedValue({ ...regularUser, accessStatus: "active", accessExpiresAt: new Date("2026-09-11T00:00:00.000Z") });
    await adminRouter.createCaller(context()).reactivate({ targetUserId: regularUser.id, durationDays: 30 });
    expect(db.updateUserAccess).toHaveBeenCalledWith({ targetUserId: 7, adminUserId: 1, action: "reactivate", expiresAt: new Date("2026-09-11T00:00:00.000Z") });
  });
});

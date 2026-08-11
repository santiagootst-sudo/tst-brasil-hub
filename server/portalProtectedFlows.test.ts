import { beforeEach, describe, expect, it, vi } from "vitest";
import { certificateCreatedSchema, certificateSchema, companyCreatedSchema, materialSchema, pgrProjectCreatedSchema, subscriptionSchema, supportTicketCreatedSchema, supportTicketSchema, trainingCreatedSchema, trainingSchema } from "@shared/contracts/portal";
import type { TrpcContext } from "./_core/context";

const db = vi.hoisted(() => ({
  createCertificateForWorkspace: vi.fn(),
  createCompanyForWorkspace: vi.fn(),
  createMaterialForWorkspace: vi.fn(),
  createPgrProjectForWorkspace: vi.fn(),
  createSupportTicketForWorkspace: vi.fn(),
  createTrainingForWorkspace: vi.fn(),
  createWorkspaceForUser: vi.fn(),
  getSubscriptionForUser: vi.fn(),
  getWorkspaceForUser: vi.fn(),
  listCertificatesForWorkspace: vi.fn(),
  listCompaniesForWorkspace: vi.fn(),
  listMaterialsForWorkspace: vi.fn(),
  listPgrProjectsForWorkspace: vi.fn(),
  listSupportTicketsForWorkspace: vi.fn(),
  listTrainingsForWorkspace: vi.fn(),
  listWorkspacesForUser: vi.fn(),
}));

vi.mock("./db", () => db);

import { appRouter } from "./routers";

const fixtureDate = new Date("2026-08-11T12:00:00.000Z");
const certificateFixture = () => certificateSchema.parse({ id: 1, workspaceId: 7, companyId: null, participantName: "Ana", trainingName: "NR-35", issuedAt: fixtureDate, expiresAt: null, createdByUserId: 12, createdAt: fixtureDate, updatedAt: fixtureDate });
const trainingFixture = () => trainingSchema.parse({ id: 2, workspaceId: 7, companyId: null, title: "Integração", status: "planned", scheduledAt: null, participantCount: 0, createdByUserId: 12, createdAt: fixtureDate, updatedAt: fixtureDate });
const materialFixture = () => materialSchema.parse({ id: 3, workspaceId: 7, title: "Checklist de EPI", category: "checklist", description: null, referenceUrl: null, createdByUserId: 12, createdAt: fixtureDate, updatedAt: fixtureDate });
const supportTicketFixture = () => supportTicketSchema.parse({ id: 4, workspaceId: 7, subject: "Dúvida sobre PGR", message: "Preciso de orientação sobre o ambiente de trabalho.", status: "open", createdByUserId: 12, createdAt: fixtureDate, updatedAt: fixtureDate });
const subscriptionFixture = (status: "active" | "past_due") => subscriptionSchema.parse({ id: 1, userId: 12, stripeCustomerId: null, stripeSubscriptionId: null, stripePriceId: null, planCode: "autonomo", status, currentPeriodEnd: null, cancelAtPeriodEnd: false, updatedAt: fixtureDate });

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
    db.listCertificatesForWorkspace.mockResolvedValue([certificateFixture()]);
    const result = await appRouter.createCaller(createContext()).portal.certificates({ workspaceId: 7 });
    expect(result).toHaveLength(1);
    expect(db.listCertificatesForWorkspace).toHaveBeenCalledWith(7);
  });

  it("permite que qualquer membro consulte treinamentos do próprio ambiente", async () => {
    db.getWorkspaceForUser.mockResolvedValue({ id: 7, name: "Unidade A", kind: "clt", role: "member" });
    db.listTrainingsForWorkspace.mockResolvedValue([trainingFixture()]);
    const result = await appRouter.createCaller(createContext()).portal.trainings({ workspaceId: 7 });
    expect(result).toHaveLength(1);
    expect(db.listTrainingsForWorkspace).toHaveBeenCalledWith(7);
  });

  it("permite que qualquer membro consulte materiais e chamados do próprio ambiente", async () => {
    db.getWorkspaceForUser.mockResolvedValue({ id: 7, name: "Unidade A", kind: "clt", role: "member" });
    db.listMaterialsForWorkspace.mockResolvedValue([materialFixture()]);
    db.listSupportTicketsForWorkspace.mockResolvedValue([supportTicketFixture()]);
    const caller = appRouter.createCaller(createContext());
    await expect(caller.portal.materials({ workspaceId: 7 })).resolves.toHaveLength(1);
    await expect(caller.portal.supportTickets({ workspaceId: 7 })).resolves.toHaveLength(1);
    expect(db.listMaterialsForWorkspace).toHaveBeenCalledWith(7);
    expect(db.listSupportTicketsForWorkspace).toHaveBeenCalledWith(7);
  });

  it("bloqueia leitura quando o usuário não pertence ao ambiente", async () => {
    db.getWorkspaceForUser.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext());
    await expect(caller.portal.certificates({ workspaceId: 999 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.portal.trainings({ workspaceId: 999 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.portal.materials({ workspaceId: 999 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.portal.supportTickets({ workspaceId: 999 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("bloqueia membro de registrar certificados ou treinamentos", async () => {
    db.getWorkspaceForUser.mockResolvedValue({ id: 7, name: "Unidade A", kind: "clt", role: "member" });
    const caller = appRouter.createCaller(createContext());
    await expect(caller.portal.createCompany({ workspaceId: 7, name: "Unidade A" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.portal.createPgrProject({ workspaceId: 7, name: "PGR Unidade A" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.portal.createCertificate({ workspaceId: 7, participantName: "Ana", trainingName: "NR-35", issuedAt: new Date() })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.portal.createTraining({ workspaceId: 7, title: "Integração", participantCount: 4 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.portal.createMaterial({ workspaceId: 7, title: "Checklist de EPI", category: "checklist" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("permite que proprietário registre certificados e treinamentos", async () => {
    db.getWorkspaceForUser.mockResolvedValue({ id: 7, name: "Unidade A", kind: "clt", role: "owner" });
    db.createCertificateForWorkspace.mockResolvedValue(certificateCreatedSchema.parse({ id: 31, workspaceId: 7, participantName: "Ana", trainingName: "NR-35", issuedAt: fixtureDate, createdByUserId: 12 }));
    db.createTrainingForWorkspace.mockResolvedValue(trainingCreatedSchema.parse({ id: 32, workspaceId: 7, title: "Integração", participantCount: 4, createdByUserId: 12 }));
    const caller = appRouter.createCaller(createContext());
    await caller.portal.createCertificate({ workspaceId: 7, participantName: "Ana", trainingName: "NR-35", issuedAt: new Date("2026-08-11") });
    await caller.portal.createTraining({ workspaceId: 7, title: "Integração", participantCount: 4 });
    expect(db.createCertificateForWorkspace).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 7, createdByUserId: 12 }));
    expect(db.createTrainingForWorkspace).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 7, participantCount: 4, createdByUserId: 12 }));
  });

  it("permite que proprietário crie empresa e projeto PGR no próprio ambiente", async () => {
    db.getWorkspaceForUser.mockResolvedValue({ id: 7, name: "Unidade A", kind: "clt", role: "owner" });
    db.createCompanyForWorkspace.mockResolvedValue(companyCreatedSchema.parse({ id: 51, workspaceId: 7, name: "Unidade A" }));
    db.createPgrProjectForWorkspace.mockResolvedValue(pgrProjectCreatedSchema.parse({ id: 52, workspaceId: 7, name: "PGR Unidade A", legacyStorageKey: "workspace-7-pgr-contract" }));
    const caller = appRouter.createCaller(createContext());
    await caller.portal.createCompany({ workspaceId: 7, name: "Unidade A" });
    await caller.portal.createPgrProject({ workspaceId: 7, name: "PGR Unidade A" });
    expect(db.createCompanyForWorkspace).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 7, name: "Unidade A" }));
    expect(db.createPgrProjectForWorkspace).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 7, name: "PGR Unidade A", legacyStorageKey: expect.stringContaining("workspace-7-pgr-") }));
  });

  it("permite que qualquer membro abra chamado, mas mantém o cadastro de materiais para gestores", async () => {
    db.getWorkspaceForUser.mockResolvedValue({ id: 7, name: "Unidade A", kind: "clt", role: "member" });
    db.createSupportTicketForWorkspace.mockResolvedValue(supportTicketCreatedSchema.parse({ id: 41, workspaceId: 7, subject: "Acesso ao PGR", message: "Preciso de ajuda para abrir o projeto de PGR.", createdByUserId: 12, status: "open" }));
    const caller = appRouter.createCaller(createContext());
    await caller.portal.createSupportTicket({ workspaceId: 7, subject: "Acesso ao PGR", message: "Preciso de ajuda para abrir o projeto de PGR." });
    expect(db.createSupportTicketForWorkspace).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 7, createdByUserId: 12 }));
  });

  it("calcula o acesso pago a partir do estado da assinatura retornado pelo banco", async () => {
    db.getSubscriptionForUser.mockResolvedValue(subscriptionFixture("active"));
    const active = await appRouter.createCaller(createContext()).billing.status();
    expect(active.hasPaidAccess).toBe(true);
    db.getSubscriptionForUser.mockResolvedValue(subscriptionFixture("past_due"));
    const pastDue = await appRouter.createCaller(createContext()).billing.status();
    expect(pastDue.hasPaidAccess).toBe(false);
  });
});

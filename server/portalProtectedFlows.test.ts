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
  getCompanyForWorkspace: vi.fn(),
  getPgrProjectForWorkspace: vi.fn(),
  getSubscriptionForUser: vi.fn(),
  getWorkspaceForUser: vi.fn(),
  listDevelopmentWorkspacesForUser: vi.fn(),
  listCertificatesForWorkspace: vi.fn(),
  listCompaniesForWorkspace: vi.fn(),
  listMaterialsForWorkspace: vi.fn(),
  listPgrProjectsForWorkspace: vi.fn(),
  listSupportTicketsForWorkspace: vi.fn(),
  listTrainingsForWorkspace: vi.fn(),
  listWorkspacesForUser: vi.fn(),
  updateCompanyLogoForWorkspace: vi.fn(),
}));
const pgrTicket = vi.hoisted(() => ({ createPgrIframeTicket: vi.fn() }));
const storage = vi.hoisted(() => ({ storagePut: vi.fn() }));

vi.mock("./db", () => db);
vi.mock("./pgrIframeTicket", () => pgrTicket);
vi.mock("./storage", () => storage);

import { appRouter } from "./routers";

const fixtureDate = new Date("2026-08-11T12:00:00.000Z");
const certificateFixture = () => certificateSchema.parse({ id: 1, workspaceId: 7, companyId: null, category: "certificate", participantName: "Ana", trainingName: "NR-35", issuedAt: fixtureDate, expiresAt: null, referenceUrl: null, notes: null, createdByUserId: 12, createdAt: fixtureDate, updatedAt: fixtureDate });
const trainingFixture = () => trainingSchema.parse({ id: 2, workspaceId: 7, companyId: null, title: "Integração", status: "planned", scheduledAt: null, participantCount: 0, createdByUserId: 12, createdAt: fixtureDate, updatedAt: fixtureDate });
const materialFixture = () => materialSchema.parse({ id: 3, workspaceId: 7, title: "Checklist de EPI", category: "checklist", description: null, referenceUrl: null, createdByUserId: 12, createdAt: fixtureDate, updatedAt: fixtureDate });
const supportTicketFixture = () => supportTicketSchema.parse({ id: 4, workspaceId: 7, subject: "Dúvida sobre PGR", message: "Preciso de orientação sobre o ambiente de trabalho.", status: "open", createdByUserId: 12, createdAt: fixtureDate, updatedAt: fixtureDate });
const subscriptionFixture = (status: "active" | "past_due") => subscriptionSchema.parse({ id: 1, userId: 12, stripeCustomerId: null, stripeSubscriptionId: null, stripePriceId: null, planCode: "autonomo", status, currentPeriodEnd: null, cancelAtPeriodEnd: false, updatedAt: fixtureDate });

function createContext(userOverrides: Partial<NonNullable<TrpcContext["user"]>> = {}): TrpcContext {
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
      ...userOverrides,
    },
    req: { protocol: "https", headers: {}, get: () => "localhost" } as TrpcContext["req"],
    res: { clearCookie: () => undefined },
  };
}

describe("portal protected flows", () => {
  beforeEach(() => vi.clearAllMocks());

  it("expõe um ambiente Autônomo e um CLT na fase de criação", async () => {
    const workspaces = [
      { id: 7, name: "Carteira SST", kind: "autonomo" as const, role: "owner" as const, updatedAt: fixtureDate },
      { id: 8, name: "Operação interna", kind: "clt" as const, role: "owner" as const, updatedAt: fixtureDate },
    ];
    db.listDevelopmentWorkspacesForUser.mockResolvedValue(workspaces);
    await expect(appRouter.createCaller(createContext()).portal.workspaces()).resolves.toEqual(workspaces);
  });

  it("impede a criação de outro ambiente do mesmo tipo", async () => {
    db.listDevelopmentWorkspacesForUser.mockResolvedValue([{ id: 7, name: "Carteira SST", kind: "autonomo", role: "owner" }]);
    await expect(appRouter.createCaller(createContext()).portal.createWorkspace({ name: "Outra carteira", kind: "autonomo" })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(db.createWorkspaceForUser).not.toHaveBeenCalled();
  });

  it("permite criar o contexto que ainda não existe", async () => {
    db.listDevelopmentWorkspacesForUser.mockResolvedValue([{ id: 7, name: "Carteira SST", kind: "autonomo", role: "owner" }]);
    db.createWorkspaceForUser.mockResolvedValue({ id: 8, name: "Operação interna", kind: "clt", role: "owner" });
    await expect(appRouter.createCaller(createContext()).portal.createWorkspace({ name: "Operação interna", kind: "clt" })).resolves.toMatchObject({ id: 8, kind: "clt" });
  });

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
    db.createCertificateForWorkspace.mockResolvedValue(certificateCreatedSchema.parse({ id: 31, workspaceId: 7, category: "certificate", participantName: "Ana", trainingName: "NR-35", issuedAt: fixtureDate, referenceUrl: null, notes: null, createdByUserId: 12 }));
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

  it("simula a jornada completa empresa, logo, PGR e abertura autorizada", async () => {
    db.getWorkspaceForUser.mockResolvedValue({ id: 7, name: "Unidade A", kind: "autonomo", role: "owner" });
    db.createCompanyForWorkspace.mockResolvedValue(companyCreatedSchema.parse({ id: 51, workspaceId: 7, name: "Empresa Nova" }));
    db.getCompanyForWorkspace.mockResolvedValue({ id: 51, workspaceId: 7, name: "Empresa Nova" });
    storage.storagePut.mockResolvedValue({ key: "company-logos/workspace-7/company-51/logo.png", url: "/manus-storage/company-logo.png" });
    db.updateCompanyLogoForWorkspace.mockResolvedValue({ id: 51, workspaceId: 7, logoKey: "company-logos/workspace-7/company-51/logo.png", logoUrl: "/manus-storage/company-logo.png" });
    db.createPgrProjectForWorkspace.mockResolvedValue(pgrProjectCreatedSchema.parse({ id: 52, workspaceId: 7, companyId: 51, name: "PGR Empresa Nova", legacyStorageKey: "workspace-7-pgr-contract" }));
    db.getSubscriptionForUser.mockResolvedValue(subscriptionFixture("active"));
    db.getPgrProjectForWorkspace.mockResolvedValue({ id: 52, workspaceId: 7, companyId: 51, name: "PGR Empresa Nova" });
    pgrTicket.createPgrIframeTicket.mockResolvedValue("ticket-seguro");

    const caller = appRouter.createCaller(createContext());
    await caller.portal.createCompany({ workspaceId: 7, name: "Empresa Nova" });
    await caller.portal.uploadCompanyLogo({ workspaceId: 7, companyId: 51, dataUrl: "data:image/png;base64,aGVsbG8gd29ybGQgaGVsbG8gd29ybGQgaGVsbG8gd29ybGQ=" });
    await caller.portal.createPgrProject({ workspaceId: 7, companyId: 51, name: "PGR Empresa Nova" });
    await expect(caller.portal.iframeAccess({ workspaceId: 7, projectId: 52 })).resolves.toEqual({ url: "/api/apps/pgr/7?ticket=ticket-seguro" });
    expect(db.createPgrProjectForWorkspace).toHaveBeenCalledWith(expect.objectContaining({ companyId: 51, workspaceId: 7 }));
    expect(db.updateCompanyLogoForWorkspace).toHaveBeenCalledWith(expect.objectContaining({ companyId: 51, workspaceId: 7 }));
  });

  it("emite a autorização do iframe apenas para projeto PGR do ambiente acessível", async () => {
    db.getWorkspaceForUser.mockResolvedValue({ id: 7, name: "Unidade A", kind: "clt", role: "owner" });
    db.getSubscriptionForUser.mockResolvedValue(subscriptionFixture("active"));
    db.getPgrProjectForWorkspace.mockResolvedValue({ id: 3, workspaceId: 7, name: "PGR Unidade A" });
    pgrTicket.createPgrIframeTicket.mockResolvedValue("ticket-seguro");

    await expect(appRouter.createCaller(createContext()).portal.iframeAccess({ workspaceId: 7, projectId: 3 })).resolves.toEqual({ url: "/api/apps/pgr/7?ticket=ticket-seguro" });
    expect(db.getPgrProjectForWorkspace).toHaveBeenCalledWith(3, 7);
    expect(pgrTicket.createPgrIframeTicket).toHaveBeenCalledWith(expect.objectContaining({ userId: 12, workspaceId: 7, projectId: 3 }));
  });

  it("bloqueia a autorização do iframe quando o projeto não pertence ao ambiente", async () => {
    db.getWorkspaceForUser.mockResolvedValue({ id: 7, name: "Unidade A", kind: "clt", role: "owner" });
    db.getSubscriptionForUser.mockResolvedValue(subscriptionFixture("active"));
    db.getPgrProjectForWorkspace.mockResolvedValue(undefined);

    await expect(appRouter.createCaller(createContext()).portal.iframeAccess({ workspaceId: 7, projectId: 999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(pgrTicket.createPgrIframeTicket).not.toHaveBeenCalled();
  });

  it("permite que gestor envie o logo da empresa do próprio ambiente", async () => {
    db.getWorkspaceForUser.mockResolvedValue({ id: 7, name: "Unidade A", kind: "clt", role: "manager" });
    db.getCompanyForWorkspace.mockResolvedValue({ id: 5, workspaceId: 7, name: "Unidade A" });
    storage.storagePut.mockResolvedValue({ key: "company-logos/workspace-7/company-5/logo.png", url: "/manus-storage/company-logo.png" });
    db.updateCompanyLogoForWorkspace.mockResolvedValue({ id: 5, workspaceId: 7, logoKey: "company-logos/workspace-7/company-5/logo.png", logoUrl: "/manus-storage/company-logo.png" });

    await expect(appRouter.createCaller(createContext()).portal.uploadCompanyLogo({ workspaceId: 7, companyId: 5, dataUrl: "data:image/png;base64,aGVsbG8gd29ybGQgaGVsbG8gd29ybGQgaGVsbG8gd29ybGQ=" })).resolves.toEqual({ id: 5, workspaceId: 7, logoKey: "company-logos/workspace-7/company-5/logo.png", logoUrl: "/manus-storage/company-logo.png" });
    expect(db.getCompanyForWorkspace).toHaveBeenCalledWith(5, 7);
    expect(storage.storagePut).toHaveBeenCalledWith(expect.stringContaining("workspace-7/company-5"), expect.any(Buffer), "image/png");
    expect(db.updateCompanyLogoForWorkspace).toHaveBeenCalledWith(expect.objectContaining({ companyId: 5, workspaceId: 7 }));
  });

  it("bloqueia membro de enviar logo de empresa", async () => {
    db.getWorkspaceForUser.mockResolvedValue({ id: 7, name: "Unidade A", kind: "clt", role: "member" });
    await expect(appRouter.createCaller(createContext()).portal.uploadCompanyLogo({ workspaceId: 7, companyId: 5, dataUrl: "data:image/png;base64,aGVsbG8gd29ybGQgaGVsbG8gd29ybGQgaGVsbG8gd29ybGQ=" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(storage.storagePut).not.toHaveBeenCalled();
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

    db.getSubscriptionForUser.mockResolvedValue(undefined);
    const manualAccess = await appRouter.createCaller(createContext({ accessStatus: "active", accessExpiresAt: new Date("2026-09-11T12:00:00.000Z") })).billing.status();
    expect(manualAccess.hasPaidAccess).toBe(true);
  });
});

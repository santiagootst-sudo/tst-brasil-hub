import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const db = vi.hoisted(() => ({
  createAndSendEpiEvidence: vi.fn(),
  createEpiItemForWorkspace: vi.fn(),
  createEpiDeliveryForWorkspace: vi.fn(),
  createEpiRequirementForWorkspace: vi.fn(),
  createSstOccurrenceForWorkspace: vi.fn(),
  getCompanyForWorkspace: vi.fn(),
  getDepartmentForWorkspace: vi.fn(),
  getEmployeeForWorkspace: vi.fn(),
  getEpiDeliveryForWorkspace: vi.fn(),
  getEpiEvidenceDetailForWorkspace: vi.fn(),
  getPublicEpiEvidence: vi.fn(),
  getEpiItemForWorkspace: vi.fn(),
  getJobRoleForWorkspace: vi.fn(),
  getWorkspaceForUser: vi.fn(),
  listEpiEvidenceForWorkspace: vi.fn(),
  listEpiItemsForWorkspace: vi.fn(),
  listEpiDeliveriesForWorkspace: vi.fn(),
  listEpiReturnsForWorkspace: vi.fn(),
  listEpiRequirementsForWorkspace: vi.fn(),
  listSstOccurrencesForWorkspace: vi.fn(),
  signEpiDeliveryForWorkspace: vi.fn(),
  verifyPublicEpiEvidenceOtp: vi.fn(),
  updateEpiItemForWorkspace: vi.fn(),
}));

vi.mock("./db", () => db);

import { operationsRouter } from "./routers/operationsRouter";

const date = new Date("2026-08-12T00:00:00.000Z");
const workspace = (role: "owner" | "manager" | "member") => ({ id: 9, name: "Operação", kind: "clt" as const, role });
const epiItem = {
  id: 11, workspaceId: 9, companyId: 4, name: "Luva", imageUrl: null, responsibleName: null, renewalRequested: false,
  caNumber: "12345", manufacturer: "Fabricante A", lotNumber: "L-2026-01", caExpiresAt: new Date("2027-01-01T00:00:00.000Z"), equipmentExpiresAt: null,
  protectionDescription: "Proteção contra abrasão", limitations: "Não protege contra agentes químicos", careInstructions: "Limpar, guardar seca e substituir se danificada.", manualUrl: null, requiresTraining: false,
  stockQuantity: 5, minimumStock: 2, expiresAt: new Date("2027-01-01T00:00:00.000Z"), active: true, createdAt: date, updatedAt: date,
};
const publicEvidence = {
  verificationCode: "evidence_verification_code_0123456789",
  status: "sent" as const,
  documentHash: "a".repeat(64),
  documentVersion: "nr06-otp-v1",
  otpExpiresAt: date,
  lastViewedAt: null,
  confirmedAt: null,
  document: { companyName: "Empresa A", employeeName: "Pessoa Real", epiName: "Luva", caNumber: "12345", lotNumber: "L-2026-01", manufacturer: "Fabricante A", quantity: 1, deliveredAt: date, conditionAtDelivery: "new", orientationTopics: "Uso e conservação.", deliveredByName: "Responsável SST" },
};

const deliveryInput = {
  workspaceId: 9, companyId: 4, epiItemId: 11, employeeId: 12, quantity: 1, deliveryKind: "initial" as const, deliveryReason: "initial" as const,
  sourceDeliveryId: null, deliveredAt: date, conditionAtDelivery: "new" as const,
  orientationTopics: "Proteção, limitações, uso, ajuste, manutenção, substituição, limpeza, guarda e conservação.", orientationConfirmed: true as const,
  trainingRequired: false, trainingCompletedAt: null, deliveredByName: "Responsável SST", notes: null,
};

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
    db.listEpiDeliveriesForWorkspace.mockResolvedValue([]);
    db.listEpiReturnsForWorkspace.mockResolvedValue([]);
    db.listEpiRequirementsForWorkspace.mockResolvedValue([]);
    db.listSstOccurrencesForWorkspace.mockResolvedValue([]);
    await expect(operationsRouter.createCaller(context()).operations({ workspaceId: 9 })).resolves.toEqual({ epiItems: [], epiRequirements: [], epiDeliveries: [], epiReturns: [], occurrences: [] });
  });

  it("bloqueia membro de registrar item de EPI", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("member"));
    await expect(operationsRouter.createCaller(context()).createEpiItem({ workspaceId: 9, companyId: 4, name: "Capacete", stockQuantity: 0, minimumStock: 0 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("atualiza dados e foto do EPI apenas quando o item pertence à empresa", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("owner"));
    db.getCompanyForWorkspace.mockResolvedValue({ id: 4, workspaceId: 9, name: "Empresa A" });
    db.getEpiItemForWorkspace.mockResolvedValue(epiItem);
    db.updateEpiItemForWorkspace.mockResolvedValue({ ...epiItem, imageUrl: "https://res.cloudinary.com/demo/image/upload/luva.jpg", responsibleName: "Ana Martins", renewalRequested: true, stockQuantity: 8 });
    await expect(operationsRouter.createCaller(context()).updateEpiItem({ workspaceId: 9, companyId: 4, epiItemId: 11, name: "Luva", imageUrl: "https://res.cloudinary.com/demo/image/upload/luva.jpg", responsibleName: "Ana Martins", renewalRequested: true, caNumber: "12345", manufacturer: "Fabricante A", lotNumber: "L-2026-01", caExpiresAt: epiItem.caExpiresAt, protectionDescription: epiItem.protectionDescription, limitations: epiItem.limitations, careInstructions: epiItem.careInstructions, requiresTraining: false, stockQuantity: 8, minimumStock: 2, expiresAt: epiItem.expiresAt })).resolves.toMatchObject({ id: 11, stockQuantity: 8, renewalRequested: true });
    expect(db.updateEpiItemForWorkspace).toHaveBeenCalledWith(expect.objectContaining({ epiItemId: 11, lotNumber: "L-2026-01", protectionDescription: "Proteção contra abrasão" }));
  });

  it("bloqueia entrega quando o estoque disponível não atende à quantidade", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("owner"));
    db.getCompanyForWorkspace.mockResolvedValue({ id: 4, workspaceId: 9, name: "Empresa A" });
    db.getEmployeeForWorkspace.mockResolvedValue({ id: 12, workspaceId: 9, companyId: 4, fullName: "Pessoa Real" });
    db.getEpiItemForWorkspace.mockResolvedValue({ ...epiItem, stockQuantity: 1 });
    await expect(operationsRouter.createCaller(context()).createEpiDelivery({ ...deliveryInput, quantity: 2 })).rejects.toMatchObject({ code: "BAD_REQUEST", message: "O estoque disponível não atende à quantidade informada." });
    expect(db.createEpiDeliveryForWorkspace).not.toHaveBeenCalled();
  });

  it("bloqueia entrega de EPI sem os dados técnicos mínimos da NR-06", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("owner"));
    db.getCompanyForWorkspace.mockResolvedValue({ id: 4, workspaceId: 9, name: "Empresa A" });
    db.getEmployeeForWorkspace.mockResolvedValue({ id: 12, workspaceId: 9, companyId: 4, fullName: "Pessoa Real" });
    db.getEpiItemForWorkspace.mockResolvedValue({ ...epiItem, lotNumber: null, careInstructions: null });
    await expect(operationsRouter.createCaller(context()).createEpiDelivery(deliveryInput)).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringContaining("Complete o cadastro NR-06") });
  });

  it("registra entrega rastreável para trabalhador da mesma empresa", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("owner"));
    db.getCompanyForWorkspace.mockResolvedValue({ id: 4, workspaceId: 9, name: "Empresa A" });
    db.getEmployeeForWorkspace.mockResolvedValue({ id: 12, workspaceId: 9, companyId: 4, fullName: "Pessoa Real" });
    db.getEpiItemForWorkspace.mockResolvedValue(epiItem);
    db.createEpiDeliveryForWorkspace.mockResolvedValue({ id: 31, workspaceId: 9, companyId: 4, epiItemId: 11, employeeId: 12, quantity: 1, deliveryKind: "initial", deliveredAt: date, replacementDueAt: null, notes: null, createdByUserId: 7 });
    await expect(operationsRouter.createCaller(context()).createEpiDelivery(deliveryInput)).resolves.toMatchObject({ id: 31, deliveryKind: "initial" });
    expect(db.createEpiDeliveryForWorkspace).toHaveBeenCalledWith(expect.objectContaining({ createdByUserId: 7, employeeId: 12, epiItemId: 11, trainingRequired: false, orientationConfirmed: true }));
  });

  it("envia a evidência OTP somente para responsável do ambiente", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("owner"));
    db.createAndSendEpiEvidence.mockResolvedValue({ evidence: { id: 4, workspaceId: 9, companyId: 4, deliveryId: 31, employeeId: 12, recipientEmail: "pessoa@empresa.com", status: "sent", verificationCode: publicEvidence.verificationCode, documentHash: "a".repeat(64), documentVersion: "nr06-otp-v1", snapshotJson: "{}", otpExpiresAt: date, otpAttempts: 0, lastSentAt: date, lastViewedAt: null, confirmedAt: null, providerMessageId: "message-id", failureReason: null, createdByUserId: 7, createdAt: date, updatedAt: date }, events: [], verificationUrl: "https://tstbrasilhub.com.br/confirmar-epi/evidence_verification_code_0123456789", qrCodeDataUrl: "data:image/png;base64,abc" });
    await expect(operationsRouter.createCaller(context()).sendEpiEvidence({ workspaceId: 9, deliveryId: 31 })).resolves.toMatchObject({ evidence: { deliveryId: 31, status: "sent" } });
    expect(db.createAndSendEpiEvidence).toHaveBeenCalledWith({ workspaceId: 9, deliveryId: 31, createdByUserId: 7 });
  });

  it("confirma uma ficha pública apenas com o OTP e a ciência explícita", async () => {
    db.verifyPublicEpiEvidenceOtp.mockResolvedValue({ ...publicEvidence, status: "confirmed", confirmedAt: date });
    await expect(operationsRouter.createCaller(context()).confirmEpiEvidence({ verificationCode: publicEvidence.verificationCode, otp: "123456", receiptConfirmed: true })).resolves.toMatchObject({ status: "confirmed", documentHash: "a".repeat(64) });
    expect(db.verifyPublicEpiEvidenceOtp).toHaveBeenCalledWith(expect.objectContaining({ verificationCode: publicEvidence.verificationCode, otp: "123456" }));
  });

  it("exige o vínculo com a ficha anterior quando a entrega é reposição", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("owner"));
    db.getCompanyForWorkspace.mockResolvedValue({ id: 4, workspaceId: 9, name: "Empresa A" });
    db.getEmployeeForWorkspace.mockResolvedValue({ id: 12, workspaceId: 9, companyId: 4, fullName: "Pessoa Real" });
    db.getEpiItemForWorkspace.mockResolvedValue(epiItem);
    await expect(operationsRouter.createCaller(context()).createEpiDelivery({ ...deliveryInput, deliveryKind: "replacement", deliveryReason: "damage" })).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringContaining("entrega original") });
  });

  it("persiste a ciência eletrônica interna do trabalhador na ficha de EPI", async () => {
    const signedDelivery = { id: 31, workspaceId: 9, companyId: 4, epiItemId: 11, employeeId: 12, quantity: 1, deliveryKind: "initial" as const, deliveryReason: "initial" as const, sourceDeliveryId: null, deliveredAt: date, replacementDueAt: null, lotNumber: "L-2026-01", caNumber: "12345", manufacturer: "Fabricante A", protectionDescription: "Proteção contra abrasão", limitations: null, careInstructions: "Limpar e guardar seca.", conditionAtDelivery: "new" as const, orientationTopics: "Proteção, uso, ajuste, limpeza, guarda e conservação.", orientationConfirmedAt: date, trainingRequired: false, trainingCompletedAt: null, deliveredByName: "Responsável SST", receiptAcceptedAt: date, receiptAcceptanceMethod: "internal_confirmation" as const, notes: null, signedByName: "Pessoa Real", digitalSignature: "TST-ACEITE-31-ABC123", returnStatus: "delivered" as const, createdByUserId: 7, createdAt: date, updatedAt: date };
    db.getWorkspaceForUser.mockResolvedValue(workspace("owner"));
    db.getEpiDeliveryForWorkspace.mockResolvedValue({ ...signedDelivery, signedByName: null, digitalSignature: null, receiptAcceptedAt: null });
    db.signEpiDeliveryForWorkspace.mockResolvedValue(signedDelivery);
    await expect(operationsRouter.createCaller(context()).signEpiDelivery({ workspaceId: 9, deliveryId: 31, signedByName: "Pessoa Real", digitalSignature: "TST-ACEITE-31-ABC123", orientationConfirmed: true })).resolves.toMatchObject({ id: 31, signedByName: "Pessoa Real", receiptAcceptanceMethod: "internal_confirmation" });
    expect(db.signEpiDeliveryForWorkspace).toHaveBeenCalledWith(expect.objectContaining({ deliveryId: 31, signedByName: "Pessoa Real", orientationConfirmed: true }));
  });

  it("impede requisito quando item e função pertencem a empresas diferentes", async () => {
    db.getWorkspaceForUser.mockResolvedValue(workspace("owner"));
    db.getCompanyForWorkspace.mockResolvedValue({ id: 4, workspaceId: 9, name: "Empresa A" });
    db.getJobRoleForWorkspace.mockResolvedValue({ id: 8, workspaceId: 9, companyId: 4, name: "Soldador" });
    db.getEpiItemForWorkspace.mockResolvedValue({ ...epiItem, companyId: 99 });
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

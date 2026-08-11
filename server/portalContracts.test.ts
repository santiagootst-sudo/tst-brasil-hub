import { describe, expect, it } from "vitest";
import { billingStatusSchema, certificateCreatedSchema, companyCreatedSchema, materialCreatedSchema, pgrProjectCreatedSchema, subscriptionPlanSchema, supportTicketCreatedSchema, trainingCreatedSchema, workspaceCreatedSchema, workspaceDetailSchema } from "@shared/contracts/portal";

const fixtureDate = new Date("2026-08-11T12:00:00.000Z");

describe("contratos de resposta do Portal TST", () => {
  it("aceita retornos válidos de workspace, PGR e módulos compartilhados", () => {
    expect(workspaceCreatedSchema.parse({ id: 7, name: "Unidade A", kind: "clt", role: "owner" })).toMatchObject({ id: 7 });
    expect(companyCreatedSchema.parse({ id: 8, workspaceId: 7, name: "Unidade A" })).toMatchObject({ workspaceId: 7 });
    expect(pgrProjectCreatedSchema.parse({ id: 9, workspaceId: 7, name: "PGR Unidade A", legacyStorageKey: "workspace-7-pgr-abc" })).toMatchObject({ id: 9 });
    expect(certificateCreatedSchema.parse({ id: 10, workspaceId: 7, participantName: "Ana", trainingName: "NR-35", issuedAt: fixtureDate, createdByUserId: 12 })).toMatchObject({ trainingName: "NR-35" });
    expect(trainingCreatedSchema.parse({ id: 11, workspaceId: 7, title: "Integração", participantCount: 10, createdByUserId: 12 })).toMatchObject({ participantCount: 10 });
    expect(materialCreatedSchema.parse({ id: 12, workspaceId: 7, title: "Checklist de EPI", category: "checklist", createdByUserId: 12 })).toMatchObject({ category: "checklist" });
    expect(supportTicketCreatedSchema.parse({ id: 13, workspaceId: 7, subject: "Dúvida", message: "Preciso de orientação sobre o ambiente.", createdByUserId: 12, status: "open" })).toMatchObject({ status: "open" });
  });

  it("rejeita retorno de PGR sem a chave obrigatória de isolamento", () => {
    expect(() => pgrProjectCreatedSchema.parse({ id: 9, workspaceId: 7, name: "PGR Unidade A" })).toThrow();
  });

  it("valida a composição do painel de ambiente e do estado de cobrança", () => {
    expect(workspaceDetailSchema.parse({ id: 7, name: "Unidade A", kind: "clt", role: "owner", companies: [], pgrProjects: [] })).toMatchObject({ id: 7 });
    expect(subscriptionPlanSchema.parse({ code: "autonomo", name: "TST Autônomo", audience: "Serviços", displayPrice: "R$ 149,90", lookupKey: "portal_tst_autonomo_monthly_brl", featured: true, features: ["PGR"], checkoutReady: true })).toMatchObject({ code: "autonomo" });
    expect(billingStatusSchema.parse({ subscription: null, plan: null, hasPaidAccess: false })).toEqual({ subscription: null, plan: null, hasPaidAccess: false });
  });

  it("rejeita estado de cobrança incompatível", () => {
    expect(() => billingStatusSchema.parse({ subscription: null, plan: null, hasPaidAccess: "sim" })).toThrow();
  });
});

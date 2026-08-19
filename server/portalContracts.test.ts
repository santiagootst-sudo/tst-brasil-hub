import { describe, expect, it } from "vitest";
import { billingStatusSchema, certificateCreatedSchema, companyCreatedSchema, materialCreatedSchema, pgrProjectCreatedSchema, subscriptionPlanSchema, supportTicketCreatedSchema, trainingCreatedSchema, uploadPgrAttachmentInput, workspaceCreatedSchema, workspaceDetailSchema } from "@shared/contracts/portal";

const fixtureDate = new Date("2026-08-11T12:00:00.000Z");

describe("contratos de resposta do Portal TST", () => {
  it("aceita retornos válidos de workspace, PGR e módulos compartilhados", () => {
    expect(workspaceCreatedSchema.parse({ id: 7, name: "Unidade A", kind: "clt", role: "owner" })).toMatchObject({ id: 7 });
    expect(companyCreatedSchema.parse({ id: 8, workspaceId: 7, name: "Unidade A" })).toMatchObject({ workspaceId: 7 });
    expect(pgrProjectCreatedSchema.parse({ id: 9, workspaceId: 7, name: "PGR Unidade A", legacyStorageKey: "workspace-7-pgr-abc" })).toMatchObject({ id: 9 });
    expect(certificateCreatedSchema.parse({ id: 10, workspaceId: 7, category: "certificate", participantName: "Ana", trainingName: "NR-35", issuedAt: fixtureDate, referenceUrl: null, notes: null, createdByUserId: 12 })).toMatchObject({ trainingName: "NR-35" });
    expect(trainingCreatedSchema.parse({ id: 11, workspaceId: 7, title: "Integração", participantCount: 10, createdByUserId: 12 })).toMatchObject({ participantCount: 10 });
    expect(materialCreatedSchema.parse({ id: 12, workspaceId: 7, title: "Checklist de EPI", category: "checklist", createdByUserId: 12 })).toMatchObject({ category: "checklist" });
    expect(supportTicketCreatedSchema.parse({ id: 13, workspaceId: 7, subject: "Dúvida", message: "Preciso de orientação sobre o ambiente.", createdByUserId: 12, status: "open" })).toMatchObject({ status: "open" });
  });

  it("rejeita retorno de PGR sem a chave obrigatória de isolamento", () => {
    expect(() => pgrProjectCreatedSchema.parse({ id: 9, workspaceId: 7, name: "PGR Unidade A" })).toThrow();
  });

  it("valida a composição do painel de ambiente e do estado de cobrança", () => {
    expect(workspaceDetailSchema.parse({ id: 7, name: "Unidade A", kind: "clt", role: "owner", companies: [], pgrProjects: [] })).toMatchObject({ id: 7 });
    expect(subscriptionPlanSchema.parse({ code: "mensal", name: "Plano Mensal", audience: "Serviços", billingCycle: "mensal", displayPrice: "R$ 69,90 no primeiro mês", promotionDisplayPrice: "R$ 69,90 no primeiro mês", recurringDisplayPrice: "R$ 99,90/mês", initialPriceCents: 6990, recurringPriceCents: 9990, lookupKey: "portal_tst_hub_monthly_brl", featured: false, features: ["PGR"], checkoutReady: true })).toMatchObject({ code: "mensal", recurringPriceCents: 9990 });
    expect(subscriptionPlanSchema.parse({ code: "trimestral", name: "Plano Trimestral", audience: "Serviços", billingCycle: "trimestral", displayPrice: "R$ 269,70 a cada 3 meses", promotionDisplayPrice: "R$ 269,70 a cada 3 meses", recurringDisplayPrice: "R$ 269,70 a cada 3 meses", initialPriceCents: 26970, recurringPriceCents: 26970, lookupKey: "portal_tst_hub_quarterly_brl", featured: true, features: ["PGR"], checkoutReady: true })).toMatchObject({ code: "trimestral" });
    expect(subscriptionPlanSchema.parse({ code: "anual", name: "Plano Anual", audience: "Serviços", billingCycle: "anual", displayPrice: "R$ 898,80 por ano", promotionDisplayPrice: "R$ 898,80 por ano", recurringDisplayPrice: "R$ 898,80 por ano", initialPriceCents: 89880, recurringPriceCents: 89880, lookupKey: "portal_tst_hub_annual_brl", featured: false, features: ["PGR"], checkoutReady: true })).toMatchObject({ code: "anual" });
    expect(billingStatusSchema.parse({ subscription: null, plan: null, hasPaidAccess: false })).toEqual({ subscription: null, plan: null, hasPaidAccess: false });
  });

  it("rejeita estado de cobrança incompatível", () => {
    expect(() => billingStatusSchema.parse({ subscription: null, plan: null, hasPaidAccess: "sim" })).toThrow();
  });

  it("aceita um laudo ou certificado remoto vinculado ao projeto PGR sem depender de arquivo base64", () => {
    const attachment = uploadPgrAttachmentInput.parse({
      workspaceId: 7,
      projectId: 9,
      title: "Certificado de calibração do dosímetro",
      category: "certificate",
      remoteUrl: "https://res.cloudinary.com/er2184wh/raw/upload/v1/tst-brasil-hub/calibracao-dosimetro.pdf",
    });
    expect(attachment.remoteUrl).toContain("cloudinary.com");
    expect(attachment.dataUrl).toBeUndefined();
  });
});

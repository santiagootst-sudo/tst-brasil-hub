import { describe, it, expect } from "vitest";
import { portalRouter } from "./routers/portalRouter";

describe("composição de routers do portal", () => {
  it("mantém todos os procedimentos de domínio no namespace plano portal", () => {
    expect(Object.keys(portalRouter._def.record).sort()).toEqual([
      "certificates",
      "commercial",
      "createActionItem",
      "createCertificate",
      "createClientEngagement",
      "createClientVisit",
      "createCompany",
      "createDepartment",
      "createEmployee",
      "createEpiDelivery",
      "createEpiItem",
      "createEpiRequirement",
      "createEpiReturn",
      "createInspection",
      "createInspectionTemplate",
      "createJobRole",
      "createMaterial",
      "createPgrProject",
      "createPsychosocialApplication",
      "createSstOccurrence",
      "createSupportTicket",
      "createTraining",
      "createWorkspace",
      "exportPsychosocialToPgr",
      "iframeAccess",
      "materials",
      "operations",
      "organization",
      "planning",
      "psychosocial",
      "submitPsychosocialResponse",
      "supportTickets",
      "trainings",
      "updateClientVisitStatus",
      "updateCompanyBranding",
      "uploadCompanyLogo",
      "workspace",
      "workspaces",
    ]);
  });
});

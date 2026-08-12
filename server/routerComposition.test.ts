import { describe, expect, it } from "vitest";
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
      "createEpiItem",
      "createEpiRequirement",
      "createInspection",
      "createJobRole",
      "createMaterial",
      "createPgrProject",
      "createSstOccurrence",
      "createSupportTicket",
      "createTraining",
      "createWorkspace",
      "iframeAccess",
      "materials",
      "operations",
      "organization",
      "planning",
      "supportTickets",
      "trainings",
      "updateClientVisitStatus",
      "uploadCompanyLogo",
      "workspace",
      "workspaces",
    ]);
  });
});

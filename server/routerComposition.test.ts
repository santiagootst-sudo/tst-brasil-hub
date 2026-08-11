import { describe, expect, it } from "vitest";
import { portalRouter } from "./routers/portalRouter";

describe("composição de routers do portal", () => {
  it("mantém todos os procedimentos de domínio no namespace plano portal", () => {
    expect(Object.keys(portalRouter._def.record).sort()).toEqual([
      "certificates",
      "createCertificate",
      "createCompany",
      "createMaterial",
      "createPgrProject",
      "createSupportTicket",
      "createTraining",
      "createWorkspace",
      "iframeAccess",
      "materials",
      "supportTickets",
      "trainings",
      "uploadCompanyLogo",
      "workspace",
      "workspaces",
    ]);
  });
});

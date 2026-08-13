import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dashboardLayout = readFileSync(resolve(process.cwd(), "client/src/components/DashboardLayout.tsx"), "utf8");
const workspaceOverview = readFileSync(resolve(process.cwd(), "client/src/pages/WorkspaceOverview.tsx"), "utf8");
const operationsPage = readFileSync(resolve(process.cwd(), "client/src/pages/Operations.tsx"), "utf8");

describe("navegação do Controle de EPIs", () => {
  it("expõe a rota de EPI no menu contextual do ambiente Empresa", () => {
    expect(dashboardLayout).toContain('{ label: "Controle de EPIs", icon: PackageCheck, path: "/app/operacao" }');
    expect(dashboardLayout).toContain("const isClt = currentWorkspace?.kind === \"clt\";");
  });

  it("mantém o atalho de EPI no dashboard Empresa e o contexto da rota", () => {
    expect(workspaceOverview).toContain('title: "Controle de EPIs", text: "Estoque, CA, fichas de entrega e validade"');
    expect(workspaceOverview).toContain('appHref("/app/operacao")');
  });

  it("identifica a página aberta como Centro Operacional de EPIs", () => {
    expect(operationsPage).toContain('<DashboardLayout title="Controle de EPIs">');
    expect(operationsPage).toContain("Centro Operacional de EPIs");
  });

  it("permite abrir diretamente a aba de fichas por funcionário e evita retry em acesso negado", () => {
    expect(operationsPage).toContain('new URLSearchParams(search).get("tab")');
    expect(operationsPage).toContain('requestedTab === "employee_profile"');
    expect(operationsPage).toContain("retry: false");
    expect(operationsPage).toContain("Não foi possível abrir este ambiente.");
  });
});

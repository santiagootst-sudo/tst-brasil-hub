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
    expect(operationsPage).toContain("Controle de EPIs");
  });

  it("permite abrir diretamente a aba de fichas e recupera separadamente falhas de acesso e de carregamento", async () => {
    expect(operationsPage).toContain('new URLSearchParams(search).get("tab")');
    expect(operationsPage).toContain('requestedTab === "employee_profile"');
    expect(operationsPage).toContain('requestedTab === "stock"');
    expect(operationsPage).toContain("retry: false");
    expect(operationsPage).toContain("Este ambiente não está disponível para a sua conta.");
    expect(operationsPage).toContain("Não foi possível carregar os dados de EPIs agora.");
    expect(operationsPage).toContain("Promise.all([workspace.refetch(), organization.refetch(), operations.refetch()])");
    expect(operationsPage).toContain('setLocation("/app")');
  });

  it("aplica filtros de setor e função e mantém a ficha completa fechada até abrir a gaveta", () => {
    expect(operationsPage).toContain("profileDepartmentFilter");
    expect(operationsPage).toContain("profileRoleFilter");
    expect(operationsPage).toContain("employee.departmentId !== profileDepartmentFilter");
    expect(operationsPage).toContain("employee.jobRoleId !== profileRoleFilter");
    expect(operationsPage).toContain("expandedArchiveEmployeeId > 0 && profileEmployees.filter(emp => emp.id === expandedArchiveEmployeeId)");
    expect(operationsPage).toContain('scrollIntoView({ behavior: "smooth", block: "center" })');
    expect(operationsPage).toContain("epi-archive-file");
    expect(operationsPage).toContain("setExpandedArchiveEmployeeId(0)");
  });

  it("oferece fechamento explícito, persiste filtros por empresa e sinaliza a abertura da gaveta", () => {
    expect(operationsPage).toContain('Fechar gaveta');
    expect(operationsPage).toContain('tst-hub:epi-profile-filters:${workspaceId}:${companyId}');
    expect(operationsPage).toContain('window.localStorage.getItem(archiveFiltersKey)');
    expect(operationsPage).toContain('window.localStorage.setItem(archiveFiltersKey, JSON.stringify(filters))');
    expect(operationsPage).toContain('openingArchiveEmployeeId === employee.id');
    expect(operationsPage).toContain('Abrindo arquivo...');
    expect(operationsPage).toContain('aria-busy={openingArchiveEmployeeId === employee.id}');
  });

  it("restaura o cadastro de estoque, a criação de ficha e a exportação com dados persistidos", () => {
    expect(operationsPage).toContain("Cadastrar EPI");
    expect(operationsPage).toContain("createEpiItemMutation");
    expect(operationsPage).toContain("Registrar entrega");
    expect(operationsPage).toContain("createEpiDeliveryMutation");
    expect(operationsPage).toContain("Exportar ficha PDF");
    expect(operationsPage).toContain("epiById.get(delivery.epiItemId)?.caNumber");
  });

  it("recolhe a pasta e a ficha aberta, evita botão duplicado e persiste o aceite", () => {
    expect(operationsPage).toContain('setFolderSearchQuery("")');
    expect(operationsPage).toContain("setOpeningArchiveEmployeeId(0)");
    expect(operationsPage).toContain("collapseAllArchiveFolders");
    expect(operationsPage).not.toContain("!d.isSigned");
    expect(operationsPage.match(/Novo Funcionário/g)).toHaveLength(1);
    expect(operationsPage).toContain("isDeliverySigned");
    expect(operationsPage).toContain("signEpiDeliveryMutation");
    expect(operationsPage).toContain("Registrar ciência na ficha");
  });

  it("oferece edição persistente e foto por item de EPI", () => {
    expect(operationsPage).toContain("openEditEpiForm");
    expect(operationsPage).toContain("updateEpiItemMutation");
    expect(operationsPage).toContain("handleEpiImageUpload");
    expect(operationsPage).toContain("Foto do EPI");
    expect(operationsPage).toContain("item.imageUrl");
    expect(operationsPage).toContain("Salvar alterações");
  });

  it("organiza a conformidade de CA em tabela e Kanban com ação de renovação", () => {
    expect(operationsPage).toContain('setStockView("kanban")');
    expect(operationsPage).toContain("Vencendo em 30 dias");
    expect(operationsPage).toContain("A renovar");
    expect(operationsPage).toContain("classifyEpiCompliance");
    expect(operationsPage).toContain("Encaminhar para renovar");
    expect(operationsPage).toContain("responsibleName");
  });

  it("alterna o arquivo de fichas para cartões de colaboradores com ações contextuais", () => {
    expect(operationsPage).toContain('setArchiveView("employees")');
    expect(operationsPage).toContain("collaboratorCards");
    expect(operationsPage).toContain("handleCollaboratorCardAction");
    expect(operationsPage).toContain("Entregar EPI");
    expect(operationsPage).toContain("Assinar ficha");
    expect(operationsPage).toContain("Ver fichas");
  });
});

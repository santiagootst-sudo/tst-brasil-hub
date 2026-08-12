import { describe, expect, it } from "vitest";
import {
  buildAlertChartData,
  buildAutonomoPortfolioData,
  buildEmpresaPendingData,
  buildEmpresaStructureData,
  buildExecutionChartData,
  safeCompletionRate,
  totalOf,
  type DashboardAnalyticsInput,
} from "../client/src/lib/dashboardMetrics";

const baseInput: DashboardAnalyticsInput = {
  activeClients: 4,
  followUpsIn30Days: 2,
  plannedVisits: 3,
  pgrProjects: 5,
  certificatesToAct: 2,
  expiredCertificates: 1,
  expiringCertificates: 1,
  activeEmployees: 18,
  activeDepartments: 4,
  epiAlerts: 3,
  epiStockCritical: 1,
  epiExpiring: 2,
  openOccurrences: 2,
  inspectionsTotal: 6,
  plannedInspections: 3,
  completedInspections: 3,
  overdueInspections: 1,
  actionItemsTotal: 5,
  openActionItems: 3,
  completedActionItems: 2,
  overdueActionItems: 1,
  plannedTrainings: 2,
};

describe("dashboardMetrics", () => {
  it("monta a execução separando concluídas, pendentes e atrasadas", () => {
    expect(buildExecutionChartData(baseInput)).toEqual([
      { label: "Inspeções", concluídas: 3, pendentes: 2, atrasadas: 1 },
      { label: "Ações", concluídas: 2, pendentes: 2, atrasadas: 1 },
    ]);
  });

  it("não cria pendências negativas quando todos os registros estão atrasados", () => {
    const data = buildExecutionChartData({
      ...baseInput,
      plannedInspections: 1,
      overdueInspections: 3,
      openActionItems: 1,
      overdueActionItems: 2,
    });
    expect(data[0].pendentes).toBe(0);
    expect(data[1].pendentes).toBe(0);
  });

  it("preserva os indicadores reais nas visões de Prestador de Serviço e Empresa", () => {
    expect(buildAutonomoPortfolioData(baseInput).map(item => item.value)).toEqual([4, 5, 3, 2, 2]);
    expect(buildEmpresaStructureData(baseInput).map(item => item.value)).toEqual([18, 4, 2, 3, 2]);
  });

  it("consolida os alertas e permite renderizar o total no donut", () => {
    const alerts = buildAlertChartData(baseInput);
    expect(alerts.map(item => item.value)).toEqual([3, 2, 2, 3]);
    expect(totalOf(alerts)).toBe(10);
  });

  it("organiza a Central de Pendências por severidade sem inventar registros", () => {
    const pending = buildEmpresaPendingData(baseInput);
    expect(pending.map(item => item.value)).toEqual([3, 2, 1, 1, 2, 1, 3, 2]);
    expect(pending.filter(item => item.priority === "critical").map(item => item.label)).toEqual([
      "EPIs em risco",
      "Ocorrências abertas",
      "Ações atrasadas",
      "Documentos vencidos",
    ]);
  });

  it("retorna estado neutro para taxas sem base de comparação", () => {
    expect(safeCompletionRate(0, 0)).toBeNull();
    expect(safeCompletionRate(3, 6)).toBe(50);
  });
});

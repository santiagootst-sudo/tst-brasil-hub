export type DashboardAnalyticsInput = {
  activeClients: number;
  followUpsIn30Days: number;
  plannedVisits: number;
  pgrProjects: number;
  certificatesToAct: number;
  expiredCertificates: number;
  expiringCertificates: number;
  activeEmployees: number;
  activeDepartments: number;
  epiAlerts: number;
  epiStockCritical: number;
  epiExpiring: number;
  openOccurrences: number;
  inspectionsTotal: number;
  plannedInspections: number;
  completedInspections: number;
  overdueInspections: number;
  actionItemsTotal: number;
  openActionItems: number;
  completedActionItems: number;
  overdueActionItems: number;
  plannedTrainings: number;
};

export type DashboardChartDatum = {
  label: string;
  value: number;
  fill: string;
  helper?: string;
};

export type EmpresaPendingDatum = DashboardChartDatum & {
  priority: "critical" | "attention";
};

export type ExecutionChartDatum = {
  label: string;
  concluídas: number;
  pendentes: number;
  atrasadas: number;
};

const palette = {
  teal: "#0c8c89",
  mint: "#39a77e",
  blue: "#3173a8",
  coral: "#d67845",
  navy: "#123f69",
  slate: "#8ea6a5",
};

export function safeCompletionRate(completed: number, total: number) {
  if (total <= 0) return null;
  return Math.round((completed / total) * 100);
}

export function buildExecutionChartData(input: DashboardAnalyticsInput): ExecutionChartDatum[] {
  return [
    {
      label: "Inspeções",
      concluídas: input.completedInspections,
      pendentes: Math.max(input.plannedInspections - input.overdueInspections, 0),
      atrasadas: input.overdueInspections,
    },
    {
      label: "Ações",
      concluídas: input.completedActionItems,
      pendentes: Math.max(input.openActionItems - input.overdueActionItems, 0),
      atrasadas: input.overdueActionItems,
    },
  ];
}

export function buildAutonomoPortfolioData(input: DashboardAnalyticsInput): DashboardChartDatum[] {
  return [
    { label: "Clientes ativos", value: input.activeClients, fill: palette.teal, helper: "Empresas com relacionamento ativo" },
    { label: "Entregas PGR", value: input.pgrProjects, fill: palette.blue, helper: "Projetos vinculados ao ambiente" },
    { label: "Visitas agendadas", value: input.plannedVisits, fill: palette.mint, helper: "Atendimentos planejados" },
    { label: "Retornos", value: input.followUpsIn30Days, fill: palette.navy, helper: "Retornos nos próximos 30 dias" },
    { label: "Docs. a tratar", value: input.certificatesToAct, fill: palette.coral, helper: "Certificados vencidos ou próximos" },
  ];
}

export function buildEmpresaStructureData(input: DashboardAnalyticsInput): DashboardChartDatum[] {
  return [
    { label: "Pessoas ativas", value: input.activeEmployees, fill: palette.blue, helper: "Pessoas ativas cadastradas" },
    { label: "Setores ativos", value: input.activeDepartments, fill: palette.teal, helper: "Setores ativos cadastrados" },
    { label: "Treinamentos", value: input.plannedTrainings, fill: palette.mint, helper: "Treinamentos planejados" },
    { label: "Ações abertas", value: input.openActionItems, fill: palette.coral, helper: "Ações não concluídas" },
    { label: "Ocorrências", value: input.openOccurrences, fill: palette.navy, helper: "Ocorrências ainda abertas" },
  ];
}

export function buildAlertChartData(input: DashboardAnalyticsInput): DashboardChartDatum[] {
  return [
    { label: "EPIs", value: input.epiAlerts, fill: palette.coral, helper: `${input.epiStockCritical} estoque crítico · ${input.epiExpiring} validade` },
    { label: "Ocorrências", value: input.openOccurrences, fill: palette.navy, helper: "Ocorrências abertas" },
    { label: "Documentos", value: input.certificatesToAct, fill: palette.blue, helper: `${input.expiredCertificates} vencido(s) · ${input.expiringCertificates} próximos` },
    { label: "Ações", value: input.openActionItems, fill: palette.teal, helper: `${input.overdueActionItems} com prazo vencido` },
  ];
}

export function buildEmpresaPendingData(input: DashboardAnalyticsInput): EmpresaPendingDatum[] {
  return [
    { label: "EPIs em risco", value: input.epiAlerts, fill: palette.coral, priority: "critical", helper: `${input.epiStockCritical} estoque crítico · ${input.epiExpiring} validade próxima` },
    { label: "Ocorrências abertas", value: input.openOccurrences, fill: palette.navy, priority: "critical", helper: "Registros que ainda exigem acompanhamento" },
    { label: "Ações atrasadas", value: input.overdueActionItems, fill: palette.coral, priority: "critical", helper: "Medidas preventivas fora do prazo" },
    { label: "Documentos vencidos", value: input.expiredCertificates, fill: palette.blue, priority: "critical", helper: "Certificados que precisam de renovação" },
    { label: "Ações em aberto", value: Math.max(input.openActionItems - input.overdueActionItems, 0), fill: palette.teal, priority: "attention", helper: "Medidas preventivas em acompanhamento" },
    { label: "Documentos próximos", value: input.expiringCertificates, fill: palette.blue, priority: "attention", helper: "Vencimentos nos próximos 30 dias" },
    { label: "Inspeções planejadas", value: input.plannedInspections, fill: palette.mint, priority: "attention", helper: "Rotinas já programadas" },
    { label: "Treinamentos planejados", value: input.plannedTrainings, fill: palette.mint, priority: "attention", helper: "Capacitações registradas para execução" },
  ];
}

export function totalOf(data: DashboardChartDatum[]) {
  return data.reduce((total, item) => total + item.value, 0);
}

import { TRPCError } from "@trpc/server";
import { createEpiDeliveryInput, createEpiItemInput, createEpiRequirementInput, createEpiReturnInput, createSstOccurrenceInput, epiDeliveryCreatedSchema, epiDeliverySchema, epiItemCreatedSchema, epiItemSchema, epiRequirementCreatedSchema, epiReturnCreatedSchema, operationalSafetySnapshotSchema, signEpiDeliveryInput, sstOccurrenceCreatedSchema, updateEpiItemInput, workspaceIdInput } from "@shared/contracts/portal";
import * as portalDb from "../db";
import { canManageWorkspace } from "../workspaceAccess";
import { protectedProcedure, router } from "../_core/trpc";

async function requireWorkspaceAccess(userId: number, workspaceId: number) {
  const workspace = await portalDb.getWorkspaceForUser(workspaceId, userId);
  if (!workspace) throw new TRPCError({ code: "FORBIDDEN", message: "Você não possui acesso a este ambiente." });
  return workspace;
}

async function requireManagedWorkspace(userId: number, workspaceId: number) {
  const workspace = await requireWorkspaceAccess(userId, workspaceId);
  if (!canManageWorkspace(workspace.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Seu perfil não pode alterar este ambiente." });
}

export const operationsRouter = router({
  operations: protectedProcedure.input(workspaceIdInput).output(operationalSafetySnapshotSchema).query(async ({ ctx, input }) => {
    await requireWorkspaceAccess(ctx.user.id, input.workspaceId);
    const [epiItems, epiRequirements, epiDeliveries, epiReturns, occurrences] = await Promise.all([
      portalDb.listEpiItemsForWorkspace(input.workspaceId),
      portalDb.listEpiRequirementsForWorkspace(input.workspaceId),
      portalDb.listEpiDeliveriesForWorkspace(input.workspaceId),
      portalDb.listEpiReturnsForWorkspace(input.workspaceId),
      portalDb.listSstOccurrencesForWorkspace(input.workspaceId),
    ]);
    return { epiItems, epiRequirements, epiDeliveries, epiReturns, occurrences };
  }),
  createEpiItem: protectedProcedure.input(createEpiItemInput).output(epiItemCreatedSchema).mutation(async ({ ctx, input }) => {
    await requireManagedWorkspace(ctx.user.id, input.workspaceId);
    const company = await portalDb.getCompanyForWorkspace(input.companyId, input.workspaceId);
    if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada neste ambiente." });
    return portalDb.createEpiItemForWorkspace(input);
  }),
  updateEpiItem: protectedProcedure.input(updateEpiItemInput).output(epiItemSchema).mutation(async ({ ctx, input }) => {
    await requireManagedWorkspace(ctx.user.id, input.workspaceId);
    const [company, epiItem] = await Promise.all([
      portalDb.getCompanyForWorkspace(input.companyId, input.workspaceId),
      portalDb.getEpiItemForWorkspace(input.epiItemId, input.workspaceId),
    ]);
    if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada neste ambiente." });
    if (!epiItem || epiItem.companyId !== input.companyId) throw new TRPCError({ code: "BAD_REQUEST", message: "O EPI informado não pertence à empresa selecionada." });
    return portalDb.updateEpiItemForWorkspace(input);
  }),
  createEpiDelivery: protectedProcedure.input(createEpiDeliveryInput).output(epiDeliveryCreatedSchema).mutation(async ({ ctx, input }) => {
    await requireManagedWorkspace(ctx.user.id, input.workspaceId);
    const [company, employee, epiItem] = await Promise.all([
      portalDb.getCompanyForWorkspace(input.companyId, input.workspaceId),
      portalDb.getEmployeeForWorkspace(input.employeeId, input.workspaceId),
      portalDb.getEpiItemForWorkspace(input.epiItemId, input.workspaceId),
    ]);
    if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada neste ambiente." });
    if (!employee || employee.companyId !== input.companyId) throw new TRPCError({ code: "BAD_REQUEST", message: "A pessoa informada não pertence à empresa selecionada." });
    if (!epiItem || epiItem.companyId !== input.companyId) throw new TRPCError({ code: "BAD_REQUEST", message: "O item de EPI não pertence à empresa selecionada." });
    if (!epiItem.active) throw new TRPCError({ code: "BAD_REQUEST", message: "Este EPI está inativo e não pode ser entregue." });
    if (epiItem.stockQuantity < input.quantity) throw new TRPCError({ code: "BAD_REQUEST", message: "O estoque disponível não atende à quantidade informada." });
    const missingTechnicalData = [["CA", epiItem.caNumber], ["fabricante ou importador", epiItem.manufacturer], ["lote", epiItem.lotNumber], ["proteção oferecida", epiItem.protectionDescription], ["cuidados de uso e conservação", epiItem.careInstructions]].filter(([, value]) => !value?.trim()).map(([label]) => label);
    if (missingTechnicalData.length) throw new TRPCError({ code: "BAD_REQUEST", message: `Complete o cadastro NR-06 deste EPI antes da entrega: ${missingTechnicalData.join(", ")}.` });
    const caExpiry = epiItem.caExpiresAt ?? epiItem.expiresAt;
    if (caExpiry && caExpiry.getTime() < input.deliveredAt.getTime()) throw new TRPCError({ code: "BAD_REQUEST", message: "O CA deste EPI está vencido para a data de entrega informada." });
    if (epiItem.equipmentExpiresAt && epiItem.equipmentExpiresAt.getTime() < input.deliveredAt.getTime()) throw new TRPCError({ code: "BAD_REQUEST", message: "O prazo de validade do equipamento está vencido para a data de entrega informada." });
    if (epiItem.requiresTraining && !input.trainingCompletedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Este EPI exige treinamento específico. Registre a data do treinamento antes de concluir a entrega." });
    if (input.deliveryKind === "replacement" && !input.sourceDeliveryId) throw new TRPCError({ code: "BAD_REQUEST", message: "Informe a entrega original que está sendo substituída para preservar a rastreabilidade." });
    if (input.sourceDeliveryId) {
      const sourceDelivery = await portalDb.getEpiDeliveryForWorkspace(input.sourceDeliveryId, input.workspaceId);
      if (!sourceDelivery || sourceDelivery.employeeId !== input.employeeId || sourceDelivery.epiItemId !== input.epiItemId) throw new TRPCError({ code: "BAD_REQUEST", message: "A entrega de origem não corresponde ao trabalhador e ao EPI informados." });
    }
    return portalDb.createEpiDeliveryForWorkspace({ ...input, trainingRequired: epiItem.requiresTraining, createdByUserId: ctx.user.id });
  }),
  signEpiDelivery: protectedProcedure.input(signEpiDeliveryInput).output(epiDeliverySchema).mutation(async ({ ctx, input }) => {
    await requireManagedWorkspace(ctx.user.id, input.workspaceId);
    const delivery = await portalDb.getEpiDeliveryForWorkspace(input.deliveryId, input.workspaceId);
    if (!delivery) throw new TRPCError({ code: "NOT_FOUND", message: "Ficha de EPI não encontrada neste ambiente." });
    return portalDb.signEpiDeliveryForWorkspace(input);
  }),
  createEpiRequirement: protectedProcedure.input(createEpiRequirementInput).output(epiRequirementCreatedSchema).mutation(async ({ ctx, input }) => {
    await requireManagedWorkspace(ctx.user.id, input.workspaceId);
    const [company, jobRole, epiItem] = await Promise.all([
      portalDb.getCompanyForWorkspace(input.companyId, input.workspaceId),
      portalDb.getJobRoleForWorkspace(input.jobRoleId, input.workspaceId),
      portalDb.getEpiItemForWorkspace(input.epiItemId, input.workspaceId),
    ]);
    if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada neste ambiente." });
    if (!jobRole || jobRole.companyId !== input.companyId) throw new TRPCError({ code: "BAD_REQUEST", message: "A função informada não pertence à empresa selecionada." });
    if (!epiItem || epiItem.companyId !== input.companyId) throw new TRPCError({ code: "BAD_REQUEST", message: "O item de EPI não pertence à empresa selecionada." });
    return portalDb.createEpiRequirementForWorkspace(input);
  }),
  createSstOccurrence: protectedProcedure.input(createSstOccurrenceInput).output(sstOccurrenceCreatedSchema).mutation(async ({ ctx, input }) => {
    await requireManagedWorkspace(ctx.user.id, input.workspaceId);
    const company = await portalDb.getCompanyForWorkspace(input.companyId, input.workspaceId);
    if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada neste ambiente." });
    if (input.departmentId) {
      const department = await portalDb.getDepartmentForWorkspace(input.departmentId, input.workspaceId);
      if (!department || department.companyId !== input.companyId) throw new TRPCError({ code: "BAD_REQUEST", message: "O setor informado não pertence à empresa selecionada." });
    }
    if (input.employeeId) {
      const employee = await portalDb.getEmployeeForWorkspace(input.employeeId, input.workspaceId);
      if (!employee || employee.companyId !== input.companyId) throw new TRPCError({ code: "BAD_REQUEST", message: "A pessoa informada não pertence à empresa selecionada." });
    }
    return portalDb.createSstOccurrenceForWorkspace({ ...input, createdByUserId: ctx.user.id });
  }),
  createEpiReturn: protectedProcedure.input(createEpiReturnInput).output(epiReturnCreatedSchema).mutation(async ({ ctx, input }) => {
    await requireManagedWorkspace(ctx.user.id, input.workspaceId);
    const [company, employee, epiItem] = await Promise.all([
      portalDb.getCompanyForWorkspace(input.companyId, input.workspaceId),
      portalDb.getEmployeeForWorkspace(input.employeeId, input.workspaceId),
      portalDb.getEpiItemForWorkspace(input.epiItemId, input.workspaceId),
    ]);
    if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada neste ambiente." });
    if (!employee || employee.companyId !== input.companyId) throw new TRPCError({ code: "BAD_REQUEST", message: "A pessoa informada não pertence à empresa selecionada." });
    if (!epiItem || epiItem.companyId !== input.companyId) throw new TRPCError({ code: "BAD_REQUEST", message: "O item de EPI não pertence à empresa selecionada." });
    return portalDb.createEpiReturnForWorkspace({ ...input, createdByUserId: ctx.user.id });
  }),
});

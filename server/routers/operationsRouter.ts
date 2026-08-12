import { TRPCError } from "@trpc/server";
import { createEpiDeliveryInput, createEpiItemInput, createEpiRequirementInput, createSstOccurrenceInput, epiDeliveryCreatedSchema, epiItemCreatedSchema, epiRequirementCreatedSchema, operationalSafetySnapshotSchema, sstOccurrenceCreatedSchema, workspaceIdInput } from "@shared/contracts/portal";
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
    const [epiItems, epiRequirements, epiDeliveries, occurrences] = await Promise.all([
      portalDb.listEpiItemsForWorkspace(input.workspaceId),
      portalDb.listEpiRequirementsForWorkspace(input.workspaceId),
      portalDb.listEpiDeliveriesForWorkspace(input.workspaceId),
      portalDb.listSstOccurrencesForWorkspace(input.workspaceId),
    ]);
    return { epiItems, epiRequirements, epiDeliveries, occurrences };
  }),
  createEpiItem: protectedProcedure.input(createEpiItemInput).output(epiItemCreatedSchema).mutation(async ({ ctx, input }) => {
    await requireManagedWorkspace(ctx.user.id, input.workspaceId);
    const company = await portalDb.getCompanyForWorkspace(input.companyId, input.workspaceId);
    if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada neste ambiente." });
    return portalDb.createEpiItemForWorkspace(input);
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
    if (epiItem.stockQuantity < input.quantity) throw new TRPCError({ code: "BAD_REQUEST", message: "O estoque disponível não atende à quantidade informada." });
    return portalDb.createEpiDeliveryForWorkspace({ ...input, createdByUserId: ctx.user.id });
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
});

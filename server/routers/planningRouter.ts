import { TRPCError } from "@trpc/server";
import { actionItemCreatedSchema, createActionItemInput, createInspectionInput, createInspectionTemplateInput, inspectionCreatedSchema, inspectionTemplateCreatedSchema, planningSnapshotSchema, workspaceIdInput } from "@shared/contracts/portal";
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

async function validateCompanyDepartment(workspaceId: number, companyId: number, departmentId?: number | null) {
  const company = await portalDb.getCompanyForWorkspace(companyId, workspaceId);
  if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada neste ambiente." });
  if (departmentId) {
    const department = await portalDb.getDepartmentForWorkspace(departmentId, workspaceId);
    if (!department || department.companyId !== companyId) throw new TRPCError({ code: "BAD_REQUEST", message: "O setor informado não pertence à empresa selecionada." });
  }
}

export const planningRouter = router({
  planning: protectedProcedure.input(workspaceIdInput).output(planningSnapshotSchema).query(async ({ ctx, input }) => {
    await requireWorkspaceAccess(ctx.user.id, input.workspaceId);
    const [inspections, actionItems, templates] = await Promise.all([
      portalDb.listInspectionsForWorkspace(input.workspaceId),
      portalDb.listActionItemsForWorkspace(input.workspaceId),
      portalDb.listInspectionTemplatesForWorkspace(input.workspaceId),
    ]);
    return { inspections, actionItems, templates };
  }),
  createInspectionTemplate: protectedProcedure.input(createInspectionTemplateInput).output(inspectionTemplateCreatedSchema).mutation(async ({ ctx, input }) => {
    await requireManagedWorkspace(ctx.user.id, input.workspaceId);
    await validateCompanyDepartment(input.workspaceId, input.companyId, input.departmentId);
    return portalDb.createInspectionTemplateForWorkspace({ ...input, createdByUserId: ctx.user.id });
  }),
  createInspection: protectedProcedure.input(createInspectionInput).output(inspectionCreatedSchema).mutation(async ({ ctx, input }) => {
    await requireManagedWorkspace(ctx.user.id, input.workspaceId);
    await validateCompanyDepartment(input.workspaceId, input.companyId, input.departmentId);
    if (input.templateId) {
      const template = await portalDb.getInspectionTemplateForWorkspace(input.templateId, input.workspaceId);
      if (!template || template.companyId !== input.companyId || (template.departmentId && template.departmentId !== input.departmentId)) throw new TRPCError({ code: "BAD_REQUEST", message: "O modelo de checklist não pertence à empresa ou setor selecionado." });
    }
    return portalDb.createInspectionForWorkspace({ ...input, createdByUserId: ctx.user.id });
  }),
  createActionItem: protectedProcedure.input(createActionItemInput).output(actionItemCreatedSchema).mutation(async ({ ctx, input }) => {
    await requireManagedWorkspace(ctx.user.id, input.workspaceId);
    await validateCompanyDepartment(input.workspaceId, input.companyId, input.departmentId);
    if (input.inspectionId) {
      const inspection = await portalDb.getInspectionForWorkspace(input.inspectionId, input.workspaceId);
      if (!inspection || inspection.companyId !== input.companyId) throw new TRPCError({ code: "BAD_REQUEST", message: "A inspeção informada não pertence à empresa selecionada." });
    }
    if (input.responsibleEmployeeId) {
      const employee = await portalDb.getEmployeeForWorkspace(input.responsibleEmployeeId, input.workspaceId);
      if (!employee || employee.companyId !== input.companyId) throw new TRPCError({ code: "BAD_REQUEST", message: "A pessoa responsável não pertence à empresa selecionada." });
    }
    return portalDb.createActionItemForWorkspace({ ...input, createdByUserId: ctx.user.id });
  }),
});

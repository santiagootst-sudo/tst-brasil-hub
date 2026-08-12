import { TRPCError } from "@trpc/server";
import { createDepartmentInput, createEmployeeInput, createJobRoleInput, departmentCreatedSchema, employeeCreatedSchema, jobRoleCreatedSchema, organizationSnapshotSchema, workspaceIdInput } from "@shared/contracts/portal";
import * as portalDb from "../db";
import { canManageWorkspace } from "../workspaceAccess";
import { protectedProcedure, router } from "../_core/trpc";

async function requireManagedWorkspace(userId: number, workspaceId: number) {
  const workspace = await portalDb.getWorkspaceForUser(workspaceId, userId);
  if (!canManageWorkspace(workspace?.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Seu perfil não pode alterar este ambiente." });
  return workspace;
}

export const organizationRouter = router({
  organization: protectedProcedure.input(workspaceIdInput).output(organizationSnapshotSchema).query(async ({ ctx, input }) => {
    const workspace = await portalDb.getWorkspaceForUser(input.workspaceId, ctx.user.id);
    if (!workspace) throw new TRPCError({ code: "FORBIDDEN", message: "Você não possui acesso a este ambiente." });
    const [departments, jobRoles, employees] = await Promise.all([
      portalDb.listDepartmentsForWorkspace(input.workspaceId),
      portalDb.listJobRolesForWorkspace(input.workspaceId),
      portalDb.listEmployeesForWorkspace(input.workspaceId),
    ]);
    return { departments, jobRoles, employees };
  }),
  createDepartment: protectedProcedure.input(createDepartmentInput).output(departmentCreatedSchema).mutation(async ({ ctx, input }) => {
    await requireManagedWorkspace(ctx.user.id, input.workspaceId);
    const company = await portalDb.getCompanyForWorkspace(input.companyId, input.workspaceId);
    if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada neste ambiente." });
    return portalDb.createDepartmentForWorkspace(input);
  }),
  createJobRole: protectedProcedure.input(createJobRoleInput).output(jobRoleCreatedSchema).mutation(async ({ ctx, input }) => {
    await requireManagedWorkspace(ctx.user.id, input.workspaceId);
    const company = await portalDb.getCompanyForWorkspace(input.companyId, input.workspaceId);
    if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada neste ambiente." });
    if (input.departmentId) {
      const department = await portalDb.getDepartmentForWorkspace(input.departmentId, input.workspaceId);
      if (!department || department.companyId !== input.companyId) throw new TRPCError({ code: "BAD_REQUEST", message: "O setor informado não pertence à empresa selecionada." });
    }
    return portalDb.createJobRoleForWorkspace(input);
  }),
  createEmployee: protectedProcedure.input(createEmployeeInput).output(employeeCreatedSchema).mutation(async ({ ctx, input }) => {
    await requireManagedWorkspace(ctx.user.id, input.workspaceId);
    const company = await portalDb.getCompanyForWorkspace(input.companyId, input.workspaceId);
    if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada neste ambiente." });
    if (input.departmentId) {
      const department = await portalDb.getDepartmentForWorkspace(input.departmentId, input.workspaceId);
      if (!department || department.companyId !== input.companyId) throw new TRPCError({ code: "BAD_REQUEST", message: "O setor informado não pertence à empresa selecionada." });
    }
    if (input.jobRoleId) {
      const jobRole = await portalDb.getJobRoleForWorkspace(input.jobRoleId, input.workspaceId);
      if (!jobRole || jobRole.companyId !== input.companyId) throw new TRPCError({ code: "BAD_REQUEST", message: "A função informada não pertence à empresa selecionada." });
    }
    return portalDb.createEmployeeForWorkspace(input);
  }),
});

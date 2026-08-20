import { TRPCError } from "@trpc/server";
import { accidentRecordSchema, accidentSnapshotSchema, createAccidentInput, workspaceIdInput } from "@shared/contracts/portal";
import * as portalDb from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { canManageWorkspace } from "../workspaceAccess";

async function requireWorkspaceAccess(userId: number, workspaceId: number) {
  const workspace = await portalDb.getWorkspaceForUser(workspaceId, userId);
  if (!workspace) throw new TRPCError({ code: "FORBIDDEN", message: "Você não possui acesso a este ambiente." });
  return workspace;
}

async function requireManagedWorkspace(userId: number, workspaceId: number) {
  const workspace = await requireWorkspaceAccess(userId, workspaceId);
  if (!canManageWorkspace(workspace.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Seu perfil não pode registrar acidentes neste ambiente." });
}

export const accidentRouter = router({
  accidents: protectedProcedure.input(workspaceIdInput).output(accidentSnapshotSchema).query(async ({ ctx, input }) => {
    await requireWorkspaceAccess(ctx.user.id, input.workspaceId);
    return portalDb.listAccidentRecordsForWorkspace(input.workspaceId);
  }),

  createAccident: protectedProcedure.input(createAccidentInput).output(accidentRecordSchema).mutation(async ({ ctx, input }) => {
    await requireManagedWorkspace(ctx.user.id, input.workspaceId);
    const [company, department, employee, risk, inspection] = await Promise.all([
      portalDb.getCompanyForWorkspace(input.companyId, input.workspaceId),
      input.departmentId ? portalDb.getDepartmentForWorkspace(input.departmentId, input.workspaceId) : Promise.resolve(undefined),
      input.employeeId ? portalDb.getEmployeeForWorkspace(input.employeeId, input.workspaceId) : Promise.resolve(undefined),
      input.occupationalRiskId ? portalDb.getOccupationalRiskForWorkspace(input.occupationalRiskId, input.workspaceId) : Promise.resolve(undefined),
      input.inspectionId ? portalDb.getInspectionForWorkspace(input.inspectionId, input.workspaceId) : Promise.resolve(undefined),
    ]);

    if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada neste ambiente." });
    if (input.departmentId && (!department || department.companyId !== input.companyId)) throw new TRPCError({ code: "BAD_REQUEST", message: "O setor informado não pertence à empresa selecionada." });
    if (input.employeeId && (!employee || employee.companyId !== input.companyId)) throw new TRPCError({ code: "BAD_REQUEST", message: "A pessoa informada não pertence à empresa selecionada." });
    if (input.occupationalRiskId && (!risk || risk.companyId !== input.companyId)) throw new TRPCError({ code: "BAD_REQUEST", message: "O risco do PGR informado não pertence à empresa selecionada." });
    if (input.inspectionId && (!inspection || inspection.companyId !== input.companyId)) throw new TRPCError({ code: "BAD_REQUEST", message: "A inspeção informada não pertence à empresa selecionada." });

    return portalDb.createAccidentRecordForWorkspace({ ...input, createdByUserId: ctx.user.id });
  }),
});

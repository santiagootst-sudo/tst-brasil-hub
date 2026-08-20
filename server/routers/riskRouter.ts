import {
  createOccupationalRiskInput,
  occupationalRiskSchema,
  occupationalRiskSnapshotSchema,
  updateOccupationalRiskInput,
  workspaceIdInput,
} from "@shared/contracts/portal";
import { TRPCError } from "@trpc/server";
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

function riskPersistenceError(operation: "list" | "create" | "update") {
  const action = operation === "list" ? "carregar o inventário de riscos" : operation === "create" ? "registrar o risco ocupacional" : "atualizar a evolução do risco";
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Não foi possível ${action} neste momento. Atualize a página e tente novamente; se persistir, o ambiente precisa concluir a atualização de dados.` });
}

export const riskRouter = router({
  occupationalRisks: protectedProcedure.input(workspaceIdInput).output(occupationalRiskSnapshotSchema).query(async ({ ctx, input }) => {
    await requireWorkspaceAccess(ctx.user.id, input.workspaceId);
    try {
      return await portalDb.listOccupationalRisksForWorkspace(input.workspaceId);
    } catch {
      console.error("[Risks] Falha ao consultar inventário de riscos");
      throw riskPersistenceError("list");
    }
  }),
  createOccupationalRisk: protectedProcedure.input(createOccupationalRiskInput).output(occupationalRiskSchema).mutation(async ({ ctx, input }) => {
    await requireManagedWorkspace(ctx.user.id, input.workspaceId);
    try {
      await validateCompanyDepartment(input.workspaceId, input.companyId, input.departmentId);
      if (input.jobRoleId) {
        const role = await portalDb.getJobRoleForWorkspace(input.jobRoleId, input.workspaceId);
        if (!role || role.companyId !== input.companyId || (input.departmentId && role.departmentId && role.departmentId !== input.departmentId)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "A função informada não pertence à empresa ou setor selecionado." });
        }
      }
      if (input.pgrProjectId) {
        const project = (await portalDb.listPgrProjectsForWorkspace(input.workspaceId)).find(item => item.id === input.pgrProjectId);
        if (!project) throw new TRPCError({ code: "BAD_REQUEST", message: "O projeto PGR informado não pertence a este ambiente." });
      }
      return await portalDb.createOccupationalRiskForWorkspace({ ...input, createdByUserId: ctx.user.id });
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("[Risks] Falha ao registrar risco ocupacional");
      throw riskPersistenceError("create");
    }
  }),
  updateOccupationalRisk: protectedProcedure.input(updateOccupationalRiskInput).output(occupationalRiskSchema).mutation(async ({ ctx, input }) => {
    await requireManagedWorkspace(ctx.user.id, input.workspaceId);
    try {
      const risk = await portalDb.getOccupationalRiskForWorkspace(input.riskId, input.workspaceId);
      if (!risk) throw new TRPCError({ code: "NOT_FOUND", message: "Risco ocupacional não encontrado neste ambiente." });
      if (input.lastInspectionId) {
        const inspection = await portalDb.getInspectionForWorkspace(input.lastInspectionId, input.workspaceId);
        if (!inspection || inspection.companyId !== risk.companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "A inspeção informada não pertence à empresa do risco." });
        }
      }
      return await portalDb.updateOccupationalRiskForWorkspace({ ...input, updatedByUserId: ctx.user.id });
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("[Risks] Falha ao atualizar evolução do risco");
      throw riskPersistenceError("update");
    }
  }),
});

import { TRPCError } from "@trpc/server";
import { clientEngagementCreatedSchema, clientVisitCreatedSchema, clientVisitUpdatedSchema, commercialSnapshotSchema, createClientEngagementInput, createClientVisitInput, updateClientVisitStatusInput, workspaceIdInput } from "@shared/contracts/portal";
import * as portalDb from "../db";
import { canManageWorkspace } from "../workspaceAccess";
import { protectedProcedure, router } from "../_core/trpc";

async function requireAutonomousWorkspace(userId: number, workspaceId: number, mustManage = false) {
  const workspace = await portalDb.getWorkspaceForUser(workspaceId, userId);
  if (!workspace) throw new TRPCError({ code: "FORBIDDEN", message: "Você não possui acesso a este ambiente." });
  if (workspace.kind !== "autonomo") throw new TRPCError({ code: "FORBIDDEN", message: "A carteira comercial está disponível apenas para o ambiente TST Autônomo." });
  if (mustManage && !canManageWorkspace(workspace.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Seu perfil não pode alterar este ambiente." });
  return workspace;
}

export const commercialRouter = router({
  commercial: protectedProcedure.input(workspaceIdInput).output(commercialSnapshotSchema).query(async ({ ctx, input }) => {
    await requireAutonomousWorkspace(ctx.user.id, input.workspaceId);
    const [engagements, visits] = await Promise.all([
      portalDb.listClientEngagementsForWorkspace(input.workspaceId),
      portalDb.listClientVisitsForWorkspace(input.workspaceId),
    ]);
    return { engagements, visits };
  }),
  createClientEngagement: protectedProcedure.input(createClientEngagementInput).output(clientEngagementCreatedSchema).mutation(async ({ ctx, input }) => {
    await requireAutonomousWorkspace(ctx.user.id, input.workspaceId, true);
    const company = await portalDb.getCompanyForWorkspace(input.companyId, input.workspaceId);
    if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada neste ambiente." });
    return portalDb.createClientEngagementForWorkspace({ ...input, createdByUserId: ctx.user.id });
  }),
  createClientVisit: protectedProcedure.input(createClientVisitInput).output(clientVisitCreatedSchema).mutation(async ({ ctx, input }) => {
    await requireAutonomousWorkspace(ctx.user.id, input.workspaceId, true);
    const company = await portalDb.getCompanyForWorkspace(input.companyId, input.workspaceId);
    if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada neste ambiente." });
    return portalDb.createClientVisitForWorkspace({ ...input, createdByUserId: ctx.user.id });
  }),
  updateClientVisitStatus: protectedProcedure.input(updateClientVisitStatusInput).output(clientVisitUpdatedSchema).mutation(async ({ ctx, input }) => {
    await requireAutonomousWorkspace(ctx.user.id, input.workspaceId, true);
    const visit = await portalDb.getClientVisitForWorkspace(input.visitId, input.workspaceId);
    if (!visit) throw new TRPCError({ code: "NOT_FOUND", message: "Visita não encontrada neste ambiente." });
    return portalDb.updateClientVisitStatusForWorkspace(input.visitId, input.workspaceId, input.status);
  }),
});

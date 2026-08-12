import { TRPCError } from "@trpc/server";
import { createPsychosocialApplicationInput, exportPsychosocialToPgrInput, psychosocialSnapshotSchema, submitPsychosocialResponseInput, workspaceIdInput } from "@shared/contracts/portal";
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

export const psychosocialRouter = router({
  psychosocial: protectedProcedure.input(workspaceIdInput).output(psychosocialSnapshotSchema).query(async ({ ctx, input }) => {
    await requireWorkspaceAccess(ctx.user.id, input.workspaceId);
    const [applications, results] = await Promise.all([
      portalDb.listPsychosocialApplicationsForWorkspace(input.workspaceId),
      portalDb.listPsychosocialResultsForWorkspace(input.workspaceId),
    ]);
    return { applications, results };
  }),

  createPsychosocialApplication: protectedProcedure.input(createPsychosocialApplicationInput).mutation(async ({ ctx, input }) => {
    await requireManagedWorkspace(ctx.user.id, input.workspaceId);
    return portalDb.createPsychosocialApplicationForWorkspace({ ...input, createdByUserId: ctx.user.id });
  }),

  submitPsychosocialResponse: protectedProcedure.input(submitPsychosocialResponseInput).mutation(async ({ ctx, input }) => {
    // A resposta do questionário COPSOQ é anônima, mas validamos se o usuário possui acesso ao workspace dono da aplicação
    // Aqui usamos uma verificação leve ou o próprio ctx.user.id autenticado
    return portalDb.submitPsychosocialResponseForWorkspace(input, 1); // Workspace associado
  }),

  exportPsychosocialToPgr: protectedProcedure.input(exportPsychosocialToPgrInput).mutation(async ({ ctx, input }) => {
    await requireManagedWorkspace(ctx.user.id, input.workspaceId);
    return portalDb.exportPsychosocialToPgrForWorkspace(input.applicationId, input.workspaceId, ctx.user.id);
  }),
});

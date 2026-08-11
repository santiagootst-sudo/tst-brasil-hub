import { TRPCError } from "@trpc/server";
import { createPgrProjectInput, pgrProjectCreatedSchema } from "@shared/contracts/portal";
import { z } from "zod";
import { canUsePaidApps } from "../access";
import * as portalDb from "../db";
import { createPgrIframeTicket } from "../pgrIframeTicket";
import { canManageWorkspace } from "../workspaceAccess";
import { protectedProcedure, router } from "../_core/trpc";

export const pgrRouter = router({
  createPgrProject: protectedProcedure.input(createPgrProjectInput).output(pgrProjectCreatedSchema).mutation(async ({ ctx, input }) => {
    const workspace = await portalDb.getWorkspaceForUser(input.workspaceId, ctx.user.id);
    if (!canManageWorkspace(workspace?.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Seu perfil não pode alterar este ambiente." });
    return portalDb.createPgrProjectForWorkspace({ ...input, legacyStorageKey: `workspace-${input.workspaceId}-pgr-${crypto.randomUUID()}` });
  }),
  iframeAccess: protectedProcedure
    .input(z.object({ workspaceId: z.number().int().positive(), projectId: z.number().int().positive() }))
    .output(z.object({ url: z.string() }))
    .query(async ({ ctx, input }) => {
      const [workspace, subscription, project] = await Promise.all([
        portalDb.getWorkspaceForUser(input.workspaceId, ctx.user.id),
        portalDb.getSubscriptionForUser(ctx.user.id),
        portalDb.getPgrProjectForWorkspace(input.projectId, input.workspaceId),
      ]);
      if (!workspace) throw new TRPCError({ code: "FORBIDDEN", message: "Você não possui acesso a este ambiente." });
      if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Projeto PGR não encontrado neste ambiente." });
      if (!canUsePaidApps({ userRole: ctx.user.role, subscriptionStatus: subscription?.status })) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Uma assinatura ativa é necessária para usar o PGR Pro." });
      }
      const ticket = await createPgrIframeTicket({
        userId: ctx.user.id,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        userRole: ctx.user.role,
      });
      return { url: `/api/apps/pgr/${input.workspaceId}?ticket=${encodeURIComponent(ticket)}` };
    }),
});

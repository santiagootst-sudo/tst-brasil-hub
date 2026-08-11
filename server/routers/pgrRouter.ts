import { TRPCError } from "@trpc/server";
import { createPgrProjectInput, pgrProjectCreatedSchema } from "@shared/contracts/portal";
import * as portalDb from "../db";
import { canManageWorkspace } from "../workspaceAccess";
import { protectedProcedure, router } from "../_core/trpc";

export const pgrRouter = router({
  createPgrProject: protectedProcedure.input(createPgrProjectInput).output(pgrProjectCreatedSchema).mutation(async ({ ctx, input }) => {
    const workspace = await portalDb.getWorkspaceForUser(input.workspaceId, ctx.user.id);
    if (!canManageWorkspace(workspace?.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Seu perfil não pode alterar este ambiente." });
    return portalDb.createPgrProjectForWorkspace({ ...input, legacyStorageKey: `workspace-${input.workspaceId}-pgr-${crypto.randomUUID()}` });
  }),
});

import { TRPCError } from "@trpc/server";
import { createMaterialInput, materialCreatedSchema, materialSchema, workspaceIdInput } from "@shared/contracts/portal";
import * as portalDb from "../db";
import { canManageWorkspace } from "../workspaceAccess";
import { protectedProcedure, router } from "../_core/trpc";

export const materialsRouter = router({
  materials: protectedProcedure.input(workspaceIdInput).output(materialSchema.array()).query(async ({ ctx, input }) => {
    const workspace = await portalDb.getWorkspaceForUser(input.workspaceId, ctx.user.id);
    if (!workspace) throw new TRPCError({ code: "FORBIDDEN", message: "Você não possui acesso a este ambiente." });
    return portalDb.listMaterialsForWorkspace(workspace.id);
  }),
  createMaterial: protectedProcedure.input(createMaterialInput).output(materialCreatedSchema).mutation(async ({ ctx, input }) => {
    const workspace = await portalDb.getWorkspaceForUser(input.workspaceId, ctx.user.id);
    if (!canManageWorkspace(workspace?.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Seu perfil não pode cadastrar materiais neste ambiente." });
    return portalDb.createMaterialForWorkspace({ ...input, createdByUserId: ctx.user.id });
  }),
});

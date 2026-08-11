import { TRPCError } from "@trpc/server";
import { companyCreatedSchema, createCompanyInput, workspaceCreatedSchema, workspaceDetailSchema, workspaceIdInput, workspaceInput, workspaceSummarySchema } from "@shared/contracts/portal";
import * as portalDb from "../db";
import { canManageWorkspace } from "../workspaceAccess";
import { protectedProcedure, router } from "../_core/trpc";

export const workspaceRouter = router({
  workspaces: protectedProcedure.output(workspaceSummarySchema.array()).query(({ ctx }) => portalDb.listWorkspacesForUser(ctx.user.id)),
  createWorkspace: protectedProcedure.input(workspaceInput).output(workspaceCreatedSchema).mutation(({ ctx, input }) => portalDb.createWorkspaceForUser({ userId: ctx.user.id, ...input })),
  workspace: protectedProcedure.input(workspaceIdInput).output(workspaceDetailSchema.nullable()).query(async ({ ctx, input }) => {
    const workspace = await portalDb.getWorkspaceForUser(input.workspaceId, ctx.user.id);
    if (!workspace) return null;
    const [companies, pgrProjects] = await Promise.all([portalDb.listCompaniesForWorkspace(workspace.id), portalDb.listPgrProjectsForWorkspace(workspace.id)]);
    return { ...workspace, companies, pgrProjects };
  }),
  createCompany: protectedProcedure.input(createCompanyInput).output(companyCreatedSchema).mutation(async ({ ctx, input }) => {
    const workspace = await portalDb.getWorkspaceForUser(input.workspaceId, ctx.user.id);
    if (!canManageWorkspace(workspace?.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Seu perfil não pode alterar este ambiente." });
    return portalDb.createCompanyForWorkspace(input);
  }),
});

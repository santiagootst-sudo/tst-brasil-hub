import { TRPCError } from "@trpc/server";
import { companyCreatedSchema, companyLogoUpdatedSchema, createCompanyInput, uploadCompanyLogoInput, workspaceCreatedSchema, workspaceDetailSchema, workspaceIdInput, workspaceInput, workspaceSummarySchema } from "@shared/contracts/portal";
import * as portalDb from "../db";
import { storagePut } from "../storage";
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
  uploadCompanyLogo: protectedProcedure.input(uploadCompanyLogoInput).output(companyLogoUpdatedSchema).mutation(async ({ ctx, input }) => {
    const workspace = await portalDb.getWorkspaceForUser(input.workspaceId, ctx.user.id);
    if (!canManageWorkspace(workspace?.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Seu perfil não pode alterar este ambiente." });
    const company = await portalDb.getCompanyForWorkspace(input.companyId, input.workspaceId);
    if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada neste ambiente." });

    const parsed = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=\s]+)$/.exec(input.dataUrl);
    if (!parsed) throw new TRPCError({ code: "BAD_REQUEST", message: "Envie uma imagem PNG, JPEG ou WEBP válida." });
    const contentType = parsed[1];
    const buffer = Buffer.from(parsed[2], "base64");
    if (!buffer.length || buffer.length > 2_500_000) throw new TRPCError({ code: "BAD_REQUEST", message: "O logo deve ter no máximo 2,5 MB." });
    const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    const stored = await storagePut(`company-logos/workspace-${input.workspaceId}/company-${input.companyId}/logo-${Date.now()}.${extension}`, buffer, contentType);
    const updated = await portalDb.updateCompanyLogoForWorkspace({ companyId: input.companyId, workspaceId: input.workspaceId, logoKey: stored.key, logoUrl: stored.url });
    if (!updated?.logoKey || !updated.logoUrl) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível salvar o logo da empresa." });
    return { id: updated.id, workspaceId: updated.workspaceId, logoKey: updated.logoKey, logoUrl: updated.logoUrl };
  }),
});

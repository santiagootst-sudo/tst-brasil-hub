import { TRPCError } from "@trpc/server";
import { certificateCreatedSchema, certificateSchema, createCertificateInput, createTrainingInput, trainingCreatedSchema, trainingSchema, workspaceIdInput } from "@shared/contracts/portal";
import * as portalDb from "../db";
import { canManageWorkspace } from "../workspaceAccess";
import { protectedProcedure, router } from "../_core/trpc";

export const learningRouter = router({
  certificates: protectedProcedure.input(workspaceIdInput).output(certificateSchema.array()).query(async ({ ctx, input }) => {
    const workspace = await portalDb.getWorkspaceForUser(input.workspaceId, ctx.user.id);
    if (!workspace) throw new TRPCError({ code: "FORBIDDEN", message: "Você não possui acesso a este ambiente." });
    return portalDb.listCertificatesForWorkspace(workspace.id);
  }),
  createCertificate: protectedProcedure.input(createCertificateInput).output(certificateCreatedSchema).mutation(async ({ ctx, input }) => {
    const workspace = await portalDb.getWorkspaceForUser(input.workspaceId, ctx.user.id);
    if (!canManageWorkspace(workspace?.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Seu perfil não pode registrar certificados neste ambiente." });
    return portalDb.createCertificateForWorkspace({ ...input, createdByUserId: ctx.user.id });
  }),
  trainings: protectedProcedure.input(workspaceIdInput).output(trainingSchema.array()).query(async ({ ctx, input }) => {
    const workspace = await portalDb.getWorkspaceForUser(input.workspaceId, ctx.user.id);
    if (!workspace) throw new TRPCError({ code: "FORBIDDEN", message: "Você não possui acesso a este ambiente." });
    return portalDb.listTrainingsForWorkspace(workspace.id);
  }),
  createTraining: protectedProcedure.input(createTrainingInput).output(trainingCreatedSchema).mutation(async ({ ctx, input }) => {
    const workspace = await portalDb.getWorkspaceForUser(input.workspaceId, ctx.user.id);
    if (!canManageWorkspace(workspace?.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Seu perfil não pode registrar treinamentos neste ambiente." });
    const participantIds = Array.from(new Set(input.participantIds ?? []));
    if (participantIds.length) {
      const selected = await Promise.all(participantIds.map(employeeId => portalDb.getEmployeeForWorkspace(employeeId, input.workspaceId)));
      if (selected.some(employee => !employee)) throw new TRPCError({ code: "BAD_REQUEST", message: "Um ou mais participantes não pertencem ao ambiente selecionado." });
    }
    return portalDb.createTrainingForWorkspace({ ...input, participantIds, participantCount: participantIds.length || input.participantCount, createdByUserId: ctx.user.id });
  }),
});

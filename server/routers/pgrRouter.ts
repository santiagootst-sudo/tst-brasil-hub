import { TRPCError } from "@trpc/server";
import { createPgrProjectInput, createPgrGheInput, createPgrGheOutput, importPgrGhesInput, importPgrGhesOutput, pgrGheSchema, pgrProjectCreatedSchema, suggestPgrGhesInput, suggestPgrGhesOutput, uploadPgrAttachmentInput, pgrAttachmentSchema } from "@shared/contracts/portal";
import { z } from "zod";
import { canUsePaidApps } from "../access";
import * as portalDb from "../db";
import { createPgrIframeTicket } from "../pgrIframeTicket";
import { canManageWorkspace } from "../workspaceAccess";
import { invokeLLM } from "../_core/llm";
import { storagePut } from "../storage";
import { protectedProcedure, router } from "../_core/trpc";
import type { AuthenticatedUser, TrpcContext } from "../_core/context";

type ProtectedPgrContext = Omit<TrpcContext, "user"> & { user: AuthenticatedUser };

async function authorizePgrProject(ctx: ProtectedPgrContext, workspaceId: number, projectId: number, requireManage: boolean) {
  const [workspace, subscription, project, accessUser] = await Promise.all([
    portalDb.getWorkspaceForUser(workspaceId, ctx.user.id),
    portalDb.getSubscriptionForUser(ctx.user.id),
    portalDb.getPgrProjectForWorkspace(projectId, workspaceId),
    portalDb.getUserById(ctx.user.id),
  ]);
  if (!workspace) throw new TRPCError({ code: "FORBIDDEN", message: "Você não possui acesso a este ambiente." });
  if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Projeto PGR não encontrado neste ambiente." });
  if (!canUsePaidApps({ userRole: accessUser?.role ?? ctx.user.role, accessStatus: accessUser?.accessStatus, accessExpiresAt: accessUser?.accessExpiresAt, subscriptionStatus: subscription?.status })) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Uma assinatura ativa é necessária para usar o PGR Pro." });
  }
  if (requireManage && !canManageWorkspace(workspace.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Seu perfil não pode alterar este ambiente." });
  }
  if (requireManage && !project.companyId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "O projeto PGR precisa estar vinculado a uma empresa." });
  }
  return { workspace, project };
}

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
      const [workspace, subscription, project, accessUser] = await Promise.all([
        portalDb.getWorkspaceForUser(input.workspaceId, ctx.user.id),
        portalDb.getSubscriptionForUser(ctx.user.id),
        portalDb.getPgrProjectForWorkspace(input.projectId, input.workspaceId),
        portalDb.getUserById(ctx.user.id),
      ]);
      if (!workspace) throw new TRPCError({ code: "FORBIDDEN", message: "Você não possui acesso a este ambiente." });
      if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Projeto PGR não encontrado neste ambiente." });
      if (!canUsePaidApps({ userRole: accessUser?.role ?? ctx.user.role, accessStatus: accessUser?.accessStatus, accessExpiresAt: accessUser?.accessExpiresAt, subscriptionStatus: subscription?.status })) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Uma assinatura ativa é necessária para usar o PGR Pro." });
      }
      const ticket = await createPgrIframeTicket({
        userId: ctx.user.id,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        userRole: ctx.user.role,
      });
      return { url: `/api/apps/pgr/${input.workspaceId}?ticket=${encodeURIComponent(ticket)}&projectId=${input.projectId}` };
    }),
  suggestGhes: protectedProcedure.input(suggestPgrGhesInput).output(suggestPgrGhesOutput).mutation(async ({ ctx, input }) => {
    const [workspace, subscription, project, accessUser] = await Promise.all([
      portalDb.getWorkspaceForUser(input.workspaceId, ctx.user.id),
      portalDb.getSubscriptionForUser(ctx.user.id),
      portalDb.getPgrProjectForWorkspace(input.projectId, input.workspaceId),
      portalDb.getUserById(ctx.user.id),
    ]);
    if (!workspace) throw new TRPCError({ code: "FORBIDDEN", message: "Você não possui acesso a este ambiente." });
    if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Projeto PGR não encontrado." });
    if (!canUsePaidApps({ userRole: accessUser?.role ?? ctx.user.role, accessStatus: accessUser?.accessStatus, accessExpiresAt: accessUser?.accessExpiresAt, subscriptionStatus: subscription?.status })) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Assinatura ativa necessária." });
    }

    const prompt = `Você é um Engenheiro de Segurança do Trabalho sênior especializado na NR-01 e NR-09. Com base na atividade econômica fornecida (${input.activityDescription}), sugira entre 2 e 4 Grupos Homogêneos de Exposição (GHEs) típicos, com descrição, perigos ocupacionais comuns (físicos, químicos, biológicos, ergonômicos e de acidentes) e medidas preventivas recomendadas. Responda exclusivamente em JSON puro no seguinte formato:
    {
      "success": true,
      "activityDescription": "${input.activityDescription}",
      "suggestions": [
        {
          "gheName": "Nome do GHE",
          "description": "Descrição das atividades",
          "suggestedHazards": ["Perigo 1", "Perigo 2"],
          "suggestedMeasures": ["Medida preventiva 1", "Medida preventiva 2"]
        }
      ]
    }`;

    try {
      const resp = await invokeLLM({
        messages: [
          { role: "system", content: "Você é um assistente técnico de SST especialista em PGR e NR-01. Responda apenas com o JSON solicitado, sem markdown ou textos adicionais." },
          { role: "user", content: prompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "pgr_ghe_suggestions",
            strict: true,
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                activityDescription: { type: "string" },
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      gheName: { type: "string" },
                      description: { type: "string" },
                      suggestedHazards: { type: "array", items: { type: "string" } },
                      suggestedMeasures: { type: "array", items: { type: "string" } },
                    },
                    required: ["gheName", "description", "suggestedHazards", "suggestedMeasures"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["success", "activityDescription", "suggestions"],
              additionalProperties: false,
            },
          },
        },
      });

      const raw = resp.choices[0]?.message?.content;
      if (!raw || typeof raw !== "string") {
        throw new Error("Resposta vazia da IA.");
      }
      const parsed = JSON.parse(raw);
      return parsed;
    } catch (err) {
      console.error("[PGR AI] Falha ao gerar sugestões de GHE", err);
      return {
        success: true,
        activityDescription: input.activityDescription,
        suggestions: [
          {
            gheName: "GHE Operacional / Produção",
            description: "Trabalhadores em atividades produtivas e operacionais da empresa.",
            suggestedHazards: ["Ruído contínuo", "Fatores ergonômicos (postura e esforço físico)"],
            suggestedMeasures: ["Uso obrigatório de EPIs adequados", "Ginástica laboral e rodízio de tarefas"],
          },
          {
            gheName: "GHE Administrativo / Escritório",
            description: "Colaboradores em atividades administrativas e de atendimento.",
            suggestedHazards: ["Ergonomia (mobiliário e esforço visual)", "Estresse ocupacional"],
            suggestedMeasures: ["Adequação ergonômica de postos de trabalho", "Pausas regulares"],
          },
        ],
      };
    }
  }),
  listGhes: protectedProcedure
    .input(z.object({ workspaceId: z.number().int().positive(), projectId: z.number().int().positive() }))
    .output(z.array(pgrGheSchema))
    .query(async ({ ctx, input }) => {
      await authorizePgrProject(ctx, input.workspaceId, input.projectId, false);
      return portalDb.listPgrGheGroupsForProject(input.projectId, input.workspaceId);
    }),
  createGhe: protectedProcedure
    .input(createPgrGheInput)
    .output(createPgrGheOutput)
    .mutation(async ({ ctx, input }) => {
      const { project } = await authorizePgrProject(ctx, input.workspaceId, input.projectId, true);
      const result = await portalDb.createPgrGheGroupForProject({
        pgrProjectId: input.projectId,
        workspaceId: input.workspaceId,
        companyId: project.companyId!,
        name: input.name,
        description: input.description,
        suggestedHazards: input.suggestedHazards,
        suggestedMeasures: input.suggestedMeasures,
        employeeCount: input.employeeCount,
        source: "ai",
        createdByUserId: ctx.user.id,
      });
      return { created: result.created, ghe: result.record };
    }),
  importGhes: protectedProcedure
    .input(importPgrGhesInput)
    .output(importPgrGhesOutput)
    .mutation(async ({ ctx, input }) => {
      const { project } = await authorizePgrProject(ctx, input.workspaceId, input.projectId, true);
      return portalDb.importPgrGheGroupsForProject({
        pgrProjectId: input.projectId,
        workspaceId: input.workspaceId,
        companyId: project.companyId!,
        ghes: input.ghes,
        createdByUserId: ctx.user.id,
      });
    }),
  listAttachments: protectedProcedure
    .input(z.object({ workspaceId: z.number().int().positive(), projectId: z.number().int().positive() }))
    .output(z.array(pgrAttachmentSchema))
    .query(async ({ ctx, input }) => {
      const workspace = await portalDb.getWorkspaceForUser(input.workspaceId, ctx.user.id);
      if (!workspace) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado ao ambiente." });
      const attachments = await portalDb.listPgrAttachments(input.projectId, input.workspaceId);
      return attachments.map(a => ({
        ...a,
        category: a.category as "photo" | "laudo" | "art" | "certificate" | "other",
        createdAt: new Date(a.createdAt),
      }));
    }),
  uploadAttachment: protectedProcedure.input(uploadPgrAttachmentInput).output(pgrAttachmentSchema).mutation(async ({ ctx, input }) => {
    const workspace = await portalDb.getWorkspaceForUser(input.workspaceId, ctx.user.id);
    if (!canManageWorkspace(workspace?.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para alterar este ambiente." });
    const project = await portalDb.getPgrProjectForWorkspace(input.projectId, input.workspaceId);
    if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Projeto PGR não encontrado." });

    let fileKey = "";
    let fileUrl = input.remoteUrl ?? "";
    if (input.remoteUrl) {
      fileKey = `remote-pgr-attachment-${crypto.randomUUID()}`;
    } else {
      const parsed = /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9\-\+\.]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(input.dataUrl ?? "");
      if (!parsed) throw new TRPCError({ code: "BAD_REQUEST", message: "Formato de arquivo base64 inválido." });
      const contentType = parsed[1];
      const buffer = Buffer.from(parsed[2], "base64");
      if (!buffer.length || buffer.length > 5_000_000) throw new TRPCError({ code: "BAD_REQUEST", message: "O arquivo deve ter no máximo 5 MB." });
      const ext = contentType.includes("pdf") ? "pdf" : contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
      const stored = await storagePut(`pgr-attachments/workspace-${input.workspaceId}/project-${input.projectId}/file-${Date.now()}.${ext}`, buffer, contentType);
      fileKey = stored.key;
      fileUrl = stored.url;
    }
    const created = await portalDb.createPgrAttachment({
      pgrProjectId: input.projectId,
      workspaceId: input.workspaceId,
      title: input.title,
      category: input.category,
      fileKey,
      fileUrl,
    });
    if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao salvar anexo no banco de dados." });
    return {
      ...created,
      category: created.category as "photo" | "laudo" | "art" | "certificate" | "other",
      createdAt: new Date(created.createdAt),
    };
  }),
});

import {
  cipaCommissionCreatedSchema,
  cipaDocumentSchema,
  cipaMemberSchema,
  cipaMeetingSchema,
  cipaSnapshotSchema,
  createCipaCommissionInput,
  createCipaDocumentInput,
  createCipaMeetingInput,
  createCipaMemberInput,
  updateCipaMeetingInput,
  updateCipaMemberElectionInput,
  workspaceIdInput,
} from "@shared/contracts/portal";
import { TRPCError } from "@trpc/server";
import * as portalDb from "../db";
import { canManageWorkspace } from "../workspaceAccess";
import { protectedProcedure, router } from "../_core/trpc";

async function requireManagedWorkspace(userId: number, workspaceId: number) {
  const workspace = await portalDb.getWorkspaceForUser(workspaceId, userId);
  if (!canManageWorkspace(workspace?.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Seu perfil não pode alterar este ambiente." });
  return workspace;
}

async function requireCommissionTerm(workspaceId: number, commissionId: number, termId: number) {
  const [commission, term] = await Promise.all([
    portalDb.getCipaCommissionForWorkspace(commissionId, workspaceId),
    portalDb.getCipaTermForWorkspace(termId, workspaceId),
  ]);
  if (!commission || !term || term.commissionId !== commission.id) throw new TRPCError({ code: "NOT_FOUND", message: "A gestão CIPA selecionada não pertence a este ambiente." });
  return { commission, term };
}

export const cipaRouter = router({
  cipaSnapshot: protectedProcedure.input(workspaceIdInput).output(cipaSnapshotSchema).query(async ({ ctx, input }) => {
    const workspace = await portalDb.getWorkspaceForUser(input.workspaceId, ctx.user.id);
    if (!workspace) throw new TRPCError({ code: "FORBIDDEN", message: "Você não possui acesso a este ambiente." });
    const [companies, employees, commissions, terms, members, documents, meetings] = await Promise.all([
      portalDb.listCompaniesForWorkspace(input.workspaceId),
      portalDb.listEmployeesForWorkspace(input.workspaceId),
      portalDb.listCipaCommissionsForWorkspace(input.workspaceId),
      portalDb.listCipaTermsForWorkspace(input.workspaceId),
      portalDb.listCipaMembersForWorkspace(input.workspaceId),
      portalDb.listCipaDocumentsForWorkspace(input.workspaceId),
      portalDb.listCipaMeetingsForWorkspace(input.workspaceId),
    ]);
    return { companies, employees, commissions, terms, members, documents, meetings };
  }),
  createCipaCommission: protectedProcedure.input(createCipaCommissionInput).output(cipaCommissionCreatedSchema).mutation(async ({ ctx, input }) => {
    const workspace = await requireManagedWorkspace(ctx.user.id, input.workspaceId);
    const company = await portalDb.getCompanyForWorkspace(input.companyId, input.workspaceId);
    if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada neste ambiente." });
    if (workspace?.kind === "clt") {
      const existing = (await portalDb.listCipaCommissionsForWorkspace(input.workspaceId)).find(item => item.status !== "archived");
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "O ambiente CLT já possui uma CIPA. Use a gestão existente para preservar o histórico de mandatos." });
    }
    try {
      return await portalDb.createCipaCommissionForWorkspace({ ...input, createdByUserId: ctx.user.id });
    } catch {
      throw new TRPCError({ code: "CONFLICT", message: "Já existe uma CIPA para esta empresa neste ambiente. Abra a gestão existente para criar um novo mandato." });
    }
  }),
  createCipaMember: protectedProcedure.input(createCipaMemberInput).output(cipaMemberSchema).mutation(async ({ ctx, input }) => {
    await requireManagedWorkspace(ctx.user.id, input.workspaceId);
    const [{ commission }, employee] = await Promise.all([
      requireCommissionTerm(input.workspaceId, input.commissionId, input.termId),
      portalDb.getEmployeeForWorkspace(input.employeeId, input.workspaceId),
    ]);
    if (!employee || employee.companyId !== commission.companyId) throw new TRPCError({ code: "BAD_REQUEST", message: "O funcionário selecionado não pertence à empresa desta CIPA." });
    try {
      const member = await portalDb.createCipaMemberForWorkspace(input);
      if (!member) throw new Error("Registro não retornado");
      return member;
    } catch {
      throw new TRPCError({ code: "CONFLICT", message: "Este funcionário já ocupa esse papel nesta gestão CIPA." });
    }
  }),
  updateCipaMemberElection: protectedProcedure.input(updateCipaMemberElectionInput).output(cipaMemberSchema).mutation(async ({ ctx, input }) => {
    await requireManagedWorkspace(ctx.user.id, input.workspaceId);
    const member = await portalDb.getCipaMemberForWorkspace(input.memberId, input.workspaceId);
    if (!member || member.role !== "candidate") throw new TRPCError({ code: "NOT_FOUND", message: "Candidato não encontrado nesta gestão." });
    const updated = await portalDb.updateCipaMemberElectionForWorkspace(input);
    if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Não foi possível atualizar a apuração." });
    return updated;
  }),
  createCipaDocument: protectedProcedure.input(createCipaDocumentInput).output(cipaDocumentSchema).mutation(async ({ ctx, input }) => {
    await requireManagedWorkspace(ctx.user.id, input.workspaceId);
    const { commission } = await requireCommissionTerm(input.workspaceId, input.commissionId, input.termId);
    const company = await portalDb.getCompanyForWorkspace(commission.companyId, input.workspaceId);
    if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Empresa da CIPA não encontrada." });
    const document = await portalDb.createCipaDocumentForWorkspace({ ...input, companyLogoUrl: company.logoUrl, createdByUserId: ctx.user.id });
    if (!document) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível registrar o documento CIPA." });
    return document;
  }),
  createCipaMeeting: protectedProcedure.input(createCipaMeetingInput).output(cipaMeetingSchema).mutation(async ({ ctx, input }) => {
    await requireManagedWorkspace(ctx.user.id, input.workspaceId);
    await requireCommissionTerm(input.workspaceId, input.commissionId, input.termId);
    const meeting = await portalDb.createCipaMeetingForWorkspace({ ...input, createdByUserId: ctx.user.id });
    if (!meeting) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível registrar a reunião CIPA." });
    return meeting;
  }),
  updateCipaMeeting: protectedProcedure.input(updateCipaMeetingInput).output(cipaMeetingSchema).mutation(async ({ ctx, input }) => {
    await requireManagedWorkspace(ctx.user.id, input.workspaceId);
    const meeting = await portalDb.getCipaMeetingForWorkspace(input.meetingId, input.workspaceId);
    if (!meeting) throw new TRPCError({ code: "NOT_FOUND", message: "Reunião CIPA não encontrada neste ambiente." });
    await requireCommissionTerm(input.workspaceId, meeting.commissionId, meeting.termId);
    const updated = await portalDb.updateCipaMeetingForWorkspace(input);
    if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Não foi possível atualizar a reunião CIPA." });
    return updated;
  }),
});

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { approveAccessRequest, createManualAccess, getUserById, listAccessRequestsForAdmin, listAdminAccessAudits, listUsersForAdmin, resetAccessCredential, updateUserAccess } from "../db";
import { adminProcedure, router } from "../_core/trpc";

const targetUserInput = z.object({
  targetUserId: z.number().int().positive(),
});

const renewalInput = targetUserInput.extend({
  durationDays: z.number().int().min(1).max(3650).default(30),
});

const grantRequestInput = z.object({ requestId: z.number().int().positive(), durationDays: z.number().int().min(1).max(3650).default(30) });
const manualAccessInput = z.object({ fullName: z.string().trim().min(2).max(255), email: z.string().trim().email().max(320), phone: z.string().trim().max(32).optional(), companyName: z.string().trim().max(255).optional(), jobTitle: z.string().trim().max(160).optional(), durationDays: z.number().int().min(1).max(3650).default(30) });
const resetCredentialInput = z.object({ email: z.string().trim().email().max(320), durationDays: z.number().int().min(1).max(3650).default(30) });

function generateTemporaryPassword() {
  return `TST-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

function assertManageableTarget(target: Awaited<ReturnType<typeof getUserById>>, adminUserId: number): asserts target is NonNullable<Awaited<ReturnType<typeof getUserById>>> {
  if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado." });
  if (target.id === adminUserId) throw new TRPCError({ code: "BAD_REQUEST", message: "O administrador não pode alterar o próprio acesso por este painel." });
  if (target.role === "admin") throw new TRPCError({ code: "BAD_REQUEST", message: "Contas administrativas não podem ser desligadas neste painel." });
}

function addDays(base: Date, durationDays: number) {
  return new Date(base.getTime() + durationDays * 24 * 60 * 60 * 1000);
}

export const adminRouter = router({
  users: adminProcedure.query(() => listUsersForAdmin()),
  audits: adminProcedure.query(() => listAdminAccessAudits()),
  accessRequests: adminProcedure.query(() => listAccessRequestsForAdmin()),
  grantAccess: adminProcedure.input(grantRequestInput).mutation(async ({ ctx, input }) => {
    const temporaryPassword = generateTemporaryPassword();
    const result = await approveAccessRequest({ requestId: input.requestId, adminUserId: ctx.user.id, durationDays: input.durationDays, temporaryPassword });
    return { request: result.request, temporaryPassword, expiresAt: result.expiresAt };
  }),
  createManualAccess: adminProcedure.input(manualAccessInput).mutation(async ({ ctx, input }) => {
    const temporaryPassword = generateTemporaryPassword();
    const result = await createManualAccess({ ...input, adminUserId: ctx.user.id, temporaryPassword });
    return { request: result.request, temporaryPassword, expiresAt: result.expiresAt };
  }),
  resetCredential: adminProcedure.input(resetCredentialInput).mutation(async ({ ctx, input }) => {
    const temporaryPassword = generateTemporaryPassword();
    const result = await resetAccessCredential({ ...input, adminUserId: ctx.user.id, temporaryPassword });
    return { request: result.request, temporaryPassword, expiresAt: result.expiresAt };
  }),
  renew: adminProcedure.input(renewalInput).mutation(async ({ ctx, input }) => {
    const target = await getUserById(input.targetUserId);
    assertManageableTarget(target, ctx.user.id);
    const now = new Date();
    const currentExpiry = target.accessExpiresAt && target.accessExpiresAt.getTime() > now.getTime() ? target.accessExpiresAt : now;
    return updateUserAccess({
      targetUserId: input.targetUserId,
      adminUserId: ctx.user.id,
      action: "renew",
      expiresAt: addDays(currentExpiry, input.durationDays),
    });
  }),
  disable: adminProcedure.input(targetUserInput).mutation(async ({ ctx, input }) => {
    const target = await getUserById(input.targetUserId);
    assertManageableTarget(target, ctx.user.id);
    return updateUserAccess({ targetUserId: input.targetUserId, adminUserId: ctx.user.id, action: "disable", expiresAt: null });
  }),
  reactivate: adminProcedure.input(renewalInput).mutation(async ({ ctx, input }) => {
    const target = await getUserById(input.targetUserId);
    assertManageableTarget(target, ctx.user.id);
    return updateUserAccess({
      targetUserId: input.targetUserId,
      adminUserId: ctx.user.id,
      action: "reactivate",
      expiresAt: addDays(new Date(), input.durationDays),
    });
  }),
});

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getUserById, listAdminAccessAudits, listUsersForAdmin, updateUserAccess } from "../db";
import { adminProcedure, router } from "../_core/trpc";

const targetUserInput = z.object({
  targetUserId: z.number().int().positive(),
});

const renewalInput = targetUserInput.extend({
  durationDays: z.number().int().min(1).max(3650).default(30),
});

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

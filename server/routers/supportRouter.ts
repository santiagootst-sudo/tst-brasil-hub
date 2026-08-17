import { TRPCError } from "@trpc/server";
import { createSupportTicketInput, supportTicketCreatedSchema, supportTicketSchema, workspaceIdInput } from "@shared/contracts/portal";
import * as portalDb from "../db";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";

export const supportRouter = router({
  supportTickets: protectedProcedure.input(workspaceIdInput).output(supportTicketSchema.array()).query(async ({ ctx, input }) => {
    const workspace = await portalDb.getWorkspaceForUser(input.workspaceId, ctx.user.id);
    if (!workspace) throw new TRPCError({ code: "FORBIDDEN", message: "Você não possui acesso a este ambiente." });
    return portalDb.listSupportTicketsForWorkspace(workspace.id);
  }),
  createSupportTicket: protectedProcedure.input(createSupportTicketInput).output(supportTicketCreatedSchema).mutation(async ({ ctx, input }) => {
    const workspace = await portalDb.getWorkspaceForUser(input.workspaceId, ctx.user.id);
    if (!workspace) throw new TRPCError({ code: "FORBIDDEN", message: "Você não possui acesso a este ambiente." });
    return portalDb.createSupportTicketForWorkspace({ ...input, createdByUserId: ctx.user.id });
  }),
});

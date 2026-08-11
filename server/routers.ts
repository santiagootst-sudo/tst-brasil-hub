import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { canUsePaidApps } from "./access";
import { createCompanyForWorkspace, createPgrProjectForWorkspace, createWorkspaceForUser, getSubscriptionForUser, getWorkspaceForUser, listCompaniesForWorkspace, listPgrProjectsForWorkspace, listWorkspacesForUser } from "./db";
import { getSubscriptionPlan, subscriptionPlans, type PlanCode } from "./products";
import { createCustomerBillingPortal, createSubscriptionCheckout } from "./stripe";
import { canManageWorkspace } from "./workspaceAccess";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

const workspaceInput = z.object({
  name: z.string().trim().min(2).max(160),
  kind: z.enum(["autonomo", "clt"]),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  portal: router({
    workspaces: protectedProcedure.query(({ ctx }) => listWorkspacesForUser(ctx.user.id)),
    createWorkspace: protectedProcedure.input(workspaceInput).mutation(({ ctx, input }) => createWorkspaceForUser({ userId: ctx.user.id, ...input })),
    workspace: protectedProcedure.input(z.object({ workspaceId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const workspace = await getWorkspaceForUser(input.workspaceId, ctx.user.id);
      if (!workspace) return null;
      const [companies, pgrProjects] = await Promise.all([
        listCompaniesForWorkspace(workspace.id),
        listPgrProjectsForWorkspace(workspace.id),
      ]);
      return { ...workspace, companies, pgrProjects };
    }),
    createCompany: protectedProcedure.input(z.object({
      workspaceId: z.number().int().positive(),
      name: z.string().trim().min(2).max(255),
      document: z.string().trim().max(32).optional(),
    })).mutation(async ({ ctx, input }) => {
      const workspace = await getWorkspaceForUser(input.workspaceId, ctx.user.id);
      if (!canManageWorkspace(workspace?.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Seu perfil não pode alterar este ambiente." });
      return createCompanyForWorkspace(input);
    }),
    createPgrProject: protectedProcedure.input(z.object({
      workspaceId: z.number().int().positive(),
      companyId: z.number().int().positive().optional(),
      name: z.string().trim().min(2).max(255),
    })).mutation(async ({ ctx, input }) => {
      const workspace = await getWorkspaceForUser(input.workspaceId, ctx.user.id);
      if (!canManageWorkspace(workspace?.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Seu perfil não pode alterar este ambiente." });
      const legacyStorageKey = `workspace-${input.workspaceId}-pgr-${crypto.randomUUID()}`;
      return createPgrProjectForWorkspace({ ...input, legacyStorageKey });
    }),
  }),
  billing: router({
    plans: publicProcedure.query(() => subscriptionPlans.map(({ priceId, ...plan }) => ({ ...plan, checkoutReady: true }))),
    status: protectedProcedure.query(async ({ ctx }) => {
      const subscription = await getSubscriptionForUser(ctx.user.id);
      const plan = subscription ? getSubscriptionPlan(subscription.planCode) : undefined;
      return {
        subscription,
        plan: plan ? { code: plan.code, name: plan.name, displayPrice: plan.displayPrice } : null,
        hasPaidAccess: canUsePaidApps({ userRole: ctx.user.role, subscriptionStatus: subscription?.status }),
      };
    }),
    checkout: protectedProcedure
      .input(z.object({ planCode: z.enum(["pgr_pro", "autonomo", "empresa"]) }))
      .mutation(({ ctx, input }) => {
        const origin = ctx.req.headers.origin || `${ctx.req.protocol}://${ctx.req.get("host")}`;
        return createSubscriptionCheckout({
          userId: ctx.user.id,
          userEmail: ctx.user.email,
          userName: ctx.user.name,
          planCode: input.planCode as PlanCode,
          origin,
        });
      }),
    manage: protectedProcedure.mutation(({ ctx }) => {
      const origin = ctx.req.headers.origin || `${ctx.req.protocol}://${ctx.req.get("host")}`;
      return createCustomerBillingPortal({ userId: ctx.user.id, origin });
    }),
  }),
});

export type AppRouter = typeof appRouter;

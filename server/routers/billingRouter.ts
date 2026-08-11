import { billingPortalSessionSchema, billingStatusSchema, checkoutInput, checkoutSessionSchema, subscriptionPlanSchema } from "@shared/contracts/portal";
import { canUsePaidApps } from "../access";
import { getSubscriptionForUser } from "../db";
import { getSubscriptionPlan, subscriptionPlans, type PlanCode } from "../products";
import { createCustomerBillingPortal, createSubscriptionCheckout } from "../stripe";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const billingRouter = router({
  plans: publicProcedure.output(subscriptionPlanSchema.array()).query(() => subscriptionPlans.map(({ priceId, ...plan }) => ({ ...plan, features: [...plan.features], checkoutReady: true }))),
  status: protectedProcedure.output(billingStatusSchema).query(async ({ ctx }) => {
    const subscription = await getSubscriptionForUser(ctx.user.id);
    const plan = subscription ? getSubscriptionPlan(subscription.planCode) : undefined;
    return {
      subscription: subscription ?? null,
      plan: plan ? { code: plan.code, name: plan.name, displayPrice: plan.displayPrice } : null,
      hasPaidAccess: canUsePaidApps({ userRole: ctx.user.role, subscriptionStatus: subscription?.status }),
    };
  }),
  checkout: protectedProcedure.input(checkoutInput).output(checkoutSessionSchema).mutation(({ ctx, input }) => {
    const origin = ctx.req.headers.origin || `${ctx.req.protocol}://${ctx.req.get("host")}`;
    return createSubscriptionCheckout({ userId: ctx.user.id, userEmail: ctx.user.email, userName: ctx.user.name, planCode: input.planCode as PlanCode, origin });
  }),
  manage: protectedProcedure.output(billingPortalSessionSchema).mutation(({ ctx }) => {
    const origin = ctx.req.headers.origin || `${ctx.req.protocol}://${ctx.req.get("host")}`;
    return createCustomerBillingPortal({ userId: ctx.user.id, origin });
  }),
});

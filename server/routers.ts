import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { billingRouter } from "./routers/billingRouter";
import { adminRouter } from "./routers/adminRouter";
import { portalRouter } from "./routers/portalRouter";
import { accessRouter } from "./routers/accessRouter";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, getSessionCookieOptions(ctx.req));
      return { success: true } as const;
    }),
    updateProfile: protectedProcedure
      .input(z.object({ name: z.string().trim().min(2, "Informe pelo menos 2 caracteres.").max(120, "O nome deve ter no máximo 120 caracteres.") }))
      .mutation(async ({ ctx, input }) => {
        const updated = await db.updateUserProfile(ctx.user.id, input);
        if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado." });
        return updated;
      }),
    directLogin: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const email = input.email.trim().toLowerCase();
        const password = input.password.trim();

        if (email === "santiagoocorretor@gmail.com" && password !== "251089") {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Senha incorreta para a conta master." });
        }

        const approvedRequest = email === "santiagoocorretor@gmail.com" ? undefined : await db.authenticateApprovedAccess(email, password);
        if (email !== "santiagoocorretor@gmail.com" && !approvedRequest) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso não liberado. Solicite suas credenciais ao administrador do TST Brasil Hub." });
        }

        const openId = email === "santiagoocorretor@gmail.com" ? "owner-master-openid-12345" : `user-${Buffer.from(email).toString("hex")}`;
        const name = email === "santiagoocorretor@gmail.com" ? "Santiago (Master Admin)" : approvedRequest!.fullName;
        
        try {
          await db.upsertUser({
            openId,
            name,
            email,
          loginMethod: "direct",
          ...(approvedRequest ? { accessStatus: "active" as const, accessExpiresAt: approvedRequest.accessExpiresAt } : {}),
            lastSignedIn: new Date(),
          });
        } catch (err: any) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Falha ao persistir usuário: ${err?.message || "Erro desconhecido"}` });
        }

        const userRecord = await db.getUserByOpenId(openId);
        if (!userRecord) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao criar ou localizar o usuário no banco." });
        }

        const sessionToken = await sdk.createSessionToken(openId, {
          name,
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true, token: sessionToken, user: userRecord } as const;
      }),
  }),
  portal: portalRouter,
  access: accessRouter,
  billing: billingRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createContentMaterial, listContentMaterialsForAdmin, listPublishedContentMaterials, updateContentMaterial } from "../db";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";

const placementSchema = z.enum(["marketplace", "library"]);
const formatSchema = z.enum(["modelo", "planilha", "checklist", "ebook", "curso", "documento", "outro"]);
const salePlatformSchema = z.enum(["hotmart", "kiwify", "externo", "nenhuma"]);
const statusSchema = z.enum(["draft", "published", "hidden"]);

const optionalUrl = z.string().trim().url("Informe uma URL válida.").max(2048).optional().or(z.literal(""));

const contentMaterialInput = z.object({
  placement: placementSchema,
  title: z.string().trim().min(3, "Informe um título com pelo menos 3 caracteres.").max(255),
  description: z.string().trim().min(10, "Descreva o material para o profissional.").max(1500),
  category: z.string().trim().min(2).max(100),
  format: formatSchema,
  salePlatform: salePlatformSchema,
  priceCents: z.number().int().min(0).max(99_999_999).nullable().optional(),
  referenceUrl: optionalUrl,
  coverUrl: optionalUrl,
  status: statusSchema,
  featured: z.boolean().default(false),
});

function normalizeMaterial(input: z.infer<typeof contentMaterialInput>) {
  const referenceUrl = input.referenceUrl?.trim() || null;
  const coverUrl = input.coverUrl?.trim() || null;

  if (input.status === "published" && !referenceUrl) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Informe o link do material antes de publicá-lo." });
  }

  if (input.placement === "marketplace" && input.status === "published" && input.salePlatform === "nenhuma") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Selecione Hotmart, Kiwify ou outra plataforma para publicar uma oferta." });
  }

  return { ...input, referenceUrl, coverUrl, priceCents: input.priceCents ?? null };
}

export const contentRouter = router({
  published: protectedProcedure.input(z.object({ placement: placementSchema })).query(({ input }) => listPublishedContentMaterials(input.placement)),
  adminList: adminProcedure.query(() => listContentMaterialsForAdmin()),
  create: adminProcedure.input(contentMaterialInput).mutation(({ ctx, input }) => createContentMaterial({ ...normalizeMaterial(input), createdByUserId: ctx.user.id })),
  update: adminProcedure.input(z.object({ id: z.number().int().positive(), material: contentMaterialInput })).mutation(({ input }) => updateContentMaterial(input.id, normalizeMaterial(input.material))),
});

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createContentMaterial, getContentMaterialCheckoutMetrics, listContentMaterialsForAdmin, listPublishedContentMaterials, registerContentMaterialCheckoutClick, updateContentMaterial } from "../db";
import { storagePut } from "../storage";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";

const placementSchema = z.enum(["marketplace", "library"]);
const formatSchema = z.enum(["modelo", "planilha", "checklist", "ebook", "curso", "documento", "outro"]);
const salePlatformSchema = z.enum(["hotmart", "kiwify", "externo", "nenhuma"]);
const statusSchema = z.enum(["draft", "published", "hidden"]);

const optionalUrl = z.string().trim().url("Informe uma URL válida.").max(2048).optional().or(z.literal(""));

const contentAssetUploadInput = z.object({
  kind: z.enum(["cover", "pdf"]),
  fileName: z.string().trim().min(1).max(255),
  dataUrl: z.string().min(32).max(14_000_000),
});

const contentAssetUploadSchema = z.object({
  key: z.string().min(1),
  url: z.string().min(1),
  fileName: z.string(),
  mimeType: z.string(),
  bytes: z.number().int().positive(),
});


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
  fileUrl: optionalUrl,
  fileName: z.string().trim().max(255).optional().or(z.literal("")),
  fileMimeType: z.string().trim().max(120).optional().or(z.literal("")),
  status: statusSchema,
  featured: z.boolean().default(false),
});

function parseContentAsset(input: z.infer<typeof contentAssetUploadInput>) {
  const parsed = /^data:([^;]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(input.dataUrl);
  if (!parsed) throw new TRPCError({ code: "BAD_REQUEST", message: "Formato de arquivo base64 inválido." });

  const contentType = parsed[1].toLowerCase();
  const allowedTypes = input.kind === "cover"
    ? ["image/png", "image/jpeg", "image/webp"]
    : ["application/pdf"];
  if (!allowedTypes.includes(contentType)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: input.kind === "cover" ? "Envie uma capa PNG, JPEG ou WEBP." : "Envie um arquivo PDF válido." });
  }

  const buffer = Buffer.from(parsed[2].replace(/\s/g, ""), "base64");
  if (!buffer.length || buffer.length > 10_000_000) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "O arquivo deve ter no máximo 10 MB." });
  }

  const extension = contentType === "application/pdf" ? "pdf" : contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  return { contentType, buffer, extension };
}

function normalizeMaterial(input: z.infer<typeof contentMaterialInput>) {
  const referenceUrl = input.referenceUrl?.trim() || null;
  const coverUrl = input.coverUrl?.trim() || null;
  const fileUrl = input.fileUrl?.trim() || null;
  const fileName = input.fileName?.trim() || null;
  const fileMimeType = input.fileMimeType?.trim() || null;

  if (input.status === "published" && !referenceUrl) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Informe o link do material antes de publicá-lo." });
  }

  if (input.placement === "marketplace" && input.status === "published" && input.salePlatform === "nenhuma") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Selecione Hotmart, Kiwify ou outra plataforma para publicar uma oferta." });
  }

  return { ...input, referenceUrl, coverUrl, fileUrl, fileName, fileMimeType, priceCents: input.priceCents ?? null };
}

export const contentRouter = router({
  published: protectedProcedure.input(z.object({ placement: placementSchema })).query(({ input }) => listPublishedContentMaterials(input.placement)),
  adminList: adminProcedure.query(() => listContentMaterialsForAdmin()),
  uploadAsset: adminProcedure.input(contentAssetUploadInput).output(contentAssetUploadSchema).mutation(async ({ input }) => {
    const asset = parseContentAsset(input);
    const stored = await storagePut(`content-assets/${input.kind}/${crypto.randomUUID()}.${asset.extension}`, asset.buffer, asset.contentType);
    return { key: stored.key, url: stored.url, fileName: input.fileName, mimeType: asset.contentType, bytes: asset.buffer.length };
  }),
  metrics: adminProcedure.query(() => getContentMaterialCheckoutMetrics()),
  trackCheckout: protectedProcedure.input(z.object({ materialId: z.number().int().positive() })).mutation(({ ctx, input }) => registerContentMaterialCheckoutClick({ materialId: input.materialId, userId: ctx.user.id })),
  create: adminProcedure.input(contentMaterialInput).mutation(({ ctx, input }) => createContentMaterial({ ...normalizeMaterial(input), createdByUserId: ctx.user.id })),
  update: adminProcedure.input(z.object({ id: z.number().int().positive(), material: contentMaterialInput })).mutation(({ input }) => updateContentMaterial(input.id, normalizeMaterial(input.material))),
});

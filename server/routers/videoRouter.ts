import { z } from "zod";
import { parseYouTubeVideoUrl } from "@shared/youtube";
import { createYouTubeVideo, listPublishedYouTubeVideos, listYouTubeVideosForAdmin, updateYouTubeVideo } from "../db";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";

const statusSchema = z.enum(["draft", "published", "hidden"]);
const videoInput = z.object({
  title: z.string().trim().min(3, "Informe um título com pelo menos 3 caracteres.").max(255),
  description: z.string().trim().min(10, "Descreva o vídeo para os assinantes.").max(1500),
  category: z.string().trim().min(2).max(100),
  youtubeUrl: z.string().trim().url("Informe uma URL válida do YouTube.").max(2048),
  status: statusSchema,
  featured: z.boolean().default(false),
});

function normalizeVideo(input: z.infer<typeof videoInput>) {
  const parsed = parseYouTubeVideoUrl(input.youtubeUrl);
  if (!parsed) throw new Error("Use um link válido de vídeo do YouTube, youtu.be, Shorts ou embed.");
  return { ...input, youtubeUrl: parsed.youtubeUrl, youtubeVideoId: parsed.videoId, thumbnailUrl: parsed.thumbnailUrl };
}

export const videoRouter = router({
  published: protectedProcedure.query(() => listPublishedYouTubeVideos()),
  adminList: adminProcedure.query(() => listYouTubeVideosForAdmin()),
  create: adminProcedure.input(videoInput).mutation(({ ctx, input }) => {
    try {
      return createYouTubeVideo({ ...normalizeVideo(input), createdByUserId: ctx.user.id });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Não foi possível salvar o vídeo.");
    }
  }),
  update: adminProcedure.input(z.object({ id: z.number().int().positive(), video: videoInput })).mutation(({ input }) => {
    try {
      return updateYouTubeVideo(input.id, normalizeVideo(input.video));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Não foi possível atualizar o vídeo.");
    }
  }),
});

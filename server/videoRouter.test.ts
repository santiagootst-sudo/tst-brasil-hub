import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const db = vi.hoisted(() => ({
  createYouTubeVideo: vi.fn(),
  listPublishedYouTubeVideos: vi.fn(),
  listYouTubeVideosForAdmin: vi.fn(),
  updateYouTubeVideo: vi.fn(),
}));

vi.mock("./db", () => db);

import { videoRouter } from "./routers/videoRouter";

function createContext(role: "admin" | "user" = "admin"): TrpcContext {
  return {
    user: { id: 19080001, openId: "owner-master-openid-12345", name: "Santiago (Master Admin)", email: "santiagoocorretor@gmail.com", role, accessStatus: "active", accessExpiresAt: null },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const publishedVideo = {
  title: "Como organizar as reuniões da CIPA",
  description: "Orientações práticas para registrar calendário, pautas e encaminhamentos da comissão.",
  category: "CIPA e NR-05",
  youtubeUrl: "https://youtu.be/dQw4w9WgXcQ",
  status: "published" as const,
  featured: true,
};

describe("módulo de vídeos YouTube", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lista somente vídeos publicados para profissionais autenticados", async () => {
    db.listPublishedYouTubeVideos.mockResolvedValue([{ id: 1, ...publishedVideo }]);
    await expect(videoRouter.createCaller(createContext("user")).published()).resolves.toHaveLength(1);
  });

  it("normaliza link do YouTube e cria publicação somente pelo administrador", async () => {
    db.createYouTubeVideo.mockResolvedValue({ id: 1, ...publishedVideo });
    await expect(videoRouter.createCaller(createContext()).create(publishedVideo)).resolves.toMatchObject({ id: 1 });
    expect(db.createYouTubeVideo).toHaveBeenCalledWith(expect.objectContaining({ createdByUserId: 19080001, youtubeVideoId: "dQw4w9WgXcQ", thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg" }));
    await expect(videoRouter.createCaller(createContext("user")).adminList()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("recusa URL que não representa um vídeo válido do YouTube", async () => {
    await expect(videoRouter.createCaller(createContext()).create({ ...publishedVideo, youtubeUrl: "https://example.com/video" })).rejects.toThrow("Use um link válido de vídeo do YouTube");
  });
});

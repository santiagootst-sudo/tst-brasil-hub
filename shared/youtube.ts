export type ParsedYouTubeVideo = {
  videoId: string;
  youtubeUrl: string;
  thumbnailUrl: string;
};

const videoIdPattern = /^[A-Za-z0-9_-]{11}$/;

export function parseYouTubeVideoUrl(rawUrl: string): ParsedYouTubeVideo | null {
  try {
    const parsed = new URL(rawUrl.trim());
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    let videoId = "";
    if (host === "youtu.be") videoId = parsed.pathname.split("/").filter(Boolean)[0] ?? "";
    if (host === "youtube.com" || host === "m.youtube.com") {
      videoId = parsed.searchParams.get("v") ?? "";
      if (!videoId) {
        const parts = parsed.pathname.split("/").filter(Boolean);
        if (["shorts", "embed", "live"].includes(parts[0] ?? "")) videoId = parts[1] ?? "";
      }
    }
    if (!videoIdPattern.test(videoId)) return null;
    return {
      videoId,
      youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    };
  } catch {
    return null;
  }
}

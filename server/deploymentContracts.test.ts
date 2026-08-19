import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dbSource = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");

describe("contratos de deploy dos módulos publicados", () => {
  it("mantém os helpers usados pelos routers de calendário CIPA e vídeos", () => {
    expect(dbSource).toContain("export async function listCipaMeetingsForWorkspace");
    expect(dbSource).toContain("export async function createCipaMeetingForWorkspace");
    expect(dbSource).toContain("export async function updateCipaMeetingForWorkspace");
    expect(dbSource).toContain("export async function listPublishedYouTubeVideos");
    expect(dbSource).toContain("export async function listYouTubeVideosForAdmin");
    expect(dbSource).toContain("export async function createYouTubeVideo");
    expect(dbSource).toContain("export async function updateYouTubeVideo");
  });
});

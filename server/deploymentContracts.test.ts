import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dbSource = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
const storageProxySource = readFileSync(
  resolve(process.cwd(), "server/_core/storageProxy.ts"),
  "utf8"
);
const watermarkSource = readFileSync(
  resolve(process.cwd(), "client/src/lib/certificateWatermark.ts"),
  "utf8"
);
const publicAssetsSource = readFileSync(
  resolve(process.cwd(), "shared/publicAssets.ts"),
  "utf8"
);

describe("contratos de deploy dos módulos publicados", () => {
  it("mantém os helpers usados pelos routers de calendário CIPA e vídeos", () => {
    expect(dbSource).toContain(
      "export async function listCipaMeetingsForWorkspace"
    );
    expect(dbSource).toContain(
      "export async function createCipaMeetingForWorkspace"
    );
    expect(dbSource).toContain(
      "export async function updateCipaMeetingForWorkspace"
    );
    expect(dbSource).toContain(
      "export async function listPublishedYouTubeVideos"
    );
    expect(dbSource).toContain(
      "export async function listYouTubeVideosForAdmin"
    );
    expect(dbSource).toContain("export async function createYouTubeVideo");
    expect(dbSource).toContain("export async function updateYouTubeVideo");
  });

  it("entrega as marcas d’água de certificado na mesma origem para geração de PDF", () => {
    expect(storageProxySource).toContain('req.query.inline === "1"');
    expect(storageProxySource).toContain("storageGetObject(key)");
    expect(storageProxySource).toContain("res.send(object.body)");
    expect(watermarkSource).toContain("inlineWatermarkUrl");
    expect(watermarkSource).toContain("?inline=1");
    expect(publicAssetsSource).toContain(
      'watermarkNr01: "/assets/watermark-nr01.jpg"'
    );
    expect(publicAssetsSource).toContain(
      'watermarkNr06: "/assets/watermark-nr06.jpg"'
    );
    expect(publicAssetsSource).toContain(
      'watermarkNrEquipment: "/assets/watermark-nr-equipment.jpg"'
    );
  });
});

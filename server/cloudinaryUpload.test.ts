import { afterEach, describe, expect, it, vi } from "vitest";
import { CONTENT_ASSET_MAX_BYTES, uploadCompanyLogo, uploadContentAsset } from "../client/src/lib/cloudinaryUpload";

describe("upload direto de materiais", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("envia uma capa ao preset administrativo sem expor chaves privadas", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ secure_url: "https://res.cloudinary.com/er2184wh/image/upload/tst-brasil-hub/capa.png", bytes: 1200 }) });
    vi.stubGlobal("fetch", fetchMock);
    const asset = await uploadContentAsset(new File(["imagem"], "capa.png", { type: "image/png" }), "cover");

    expect(asset).toMatchObject({ fileName: "capa.png", mimeType: "image/png" });
    expect(fetchMock.mock.calls[0][0]).toContain("api.cloudinary.com/v1_1/er2184wh/auto/upload");
  });

  it("aceita PDFs e rejeita arquivos acima do limite configurado", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ secure_url: "https://res.cloudinary.com/er2184wh/raw/upload/tst-brasil-hub/material.pdf", bytes: 100 }) });
    vi.stubGlobal("fetch", fetchMock);
    await expect(uploadContentAsset(new File(["pdf"], "material.pdf", { type: "application/pdf" }), "pdf")).resolves.toMatchObject({ fileName: "material.pdf" });
    await expect(uploadContentAsset(new File([new Uint8Array(CONTENT_ASSET_MAX_BYTES + 1)], "grande.pdf", { type: "application/pdf" }), "pdf")).rejects.toThrow("10 MB");
  });

  it("envia logo empresarial como imagem e preserva a URL segura retornada", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ secure_url: "https://res.cloudinary.com/er2184wh/image/upload/tst-brasil-hub/empresa/logo.png", bytes: 900 }) });
    vi.stubGlobal("fetch", fetchMock);
    const asset = await uploadCompanyLogo(new File(["logo"], "logo.png", { type: "image/png" }));

    expect(asset.url).toContain("res.cloudinary.com/er2184wh/");
    expect(fetchMock.mock.calls[0][0]).toContain("api.cloudinary.com/v1_1/er2184wh/image/upload");
  });
});

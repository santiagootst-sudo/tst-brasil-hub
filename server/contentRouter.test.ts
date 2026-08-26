import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const db = vi.hoisted(() => ({
  createContentMaterial: vi.fn(),
  getContentMaterialCheckoutMetrics: vi.fn(),
  listContentMaterialsForAdmin: vi.fn(),
  listPublishedContentMaterials: vi.fn(),
  registerContentMaterialCheckoutClick: vi.fn(),
  updateContentMaterial: vi.fn(),
}));

const storage = vi.hoisted(() => ({
  storagePut: vi.fn(),
}));

vi.mock("./db", () => db);
vi.mock("./storage", () => storage);

import { contentRouter } from "./routers/contentRouter";

function createContext(role: "admin" | "user" = "admin"): TrpcContext {
  return {
    user: {
      id: 19080001,
      openId: "owner-master-openid-12345",
      name: "Santiago (Master Admin)",
      email: "santiagoocorretor@gmail.com",
      role,
      accessStatus: "active",
      accessExpiresAt: null,
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const publishedMarketplaceMaterial = {
  placement: "marketplace" as const,
  title: "Planilha de controle de EPIs",
  description: "Planilha editável para organizar estoque, entregas e validades de EPIs.",
  category: "Planilhas profissionais",
  format: "planilha" as const,
  salePlatform: "hotmart" as const,
  priceCents: 4990,
  referenceUrl: "https://pay.hotmart.com/exemplo",
  coverUrl: "",
  status: "published" as const,
  featured: true,
};

describe("catálogo global de materiais", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lista apenas os materiais publicados da seção solicitada para profissionais autenticados", async () => {
    db.listPublishedContentMaterials.mockResolvedValue([{ id: 1, ...publishedMarketplaceMaterial }]);

    await expect(contentRouter.createCaller(createContext()).published({ placement: "marketplace" })).resolves.toHaveLength(1);
    expect(db.listPublishedContentMaterials).toHaveBeenCalledWith("marketplace");
  });

  it("permite que o Administrador Mestre publique uma oferta com checkout externo", async () => {
    db.createContentMaterial.mockResolvedValue({ id: 1, ...publishedMarketplaceMaterial });

    await expect(contentRouter.createCaller(createContext()).create(publishedMarketplaceMaterial)).resolves.toMatchObject({ id: 1 });
    expect(db.createContentMaterial).toHaveBeenCalledWith(expect.objectContaining({
      createdByUserId: 19080001,
      referenceUrl: "https://pay.hotmart.com/exemplo",
      placement: "marketplace",
      salePlatform: "hotmart",
    }));
  });

  it("impede a publicação sem link e bloqueia a edição para usuários não administrativos", async () => {
    const caller = contentRouter.createCaller(createContext());
    await expect(caller.create({ ...publishedMarketplaceMaterial, referenceUrl: "" })).rejects.toMatchObject({ code: "BAD_REQUEST" });

    await expect(contentRouter.createCaller(createContext("user")).adminList()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("permite ocultar ou atualizar um material existente sem removê-lo", async () => {
    db.updateContentMaterial.mockResolvedValue({ id: 1, ...publishedMarketplaceMaterial, status: "hidden" });

    await expect(contentRouter.createCaller(createContext()).update({ id: 1, material: { ...publishedMarketplaceMaterial, status: "hidden" } })).resolves.toMatchObject({ status: "hidden" });
    expect(db.updateContentMaterial).toHaveBeenCalledWith(1, expect.objectContaining({ status: "hidden" }));
  });

  it("registra cliques de checkout para profissionais autenticados e entrega métricas apenas ao administrador", async () => {
    db.registerContentMaterialCheckoutClick.mockResolvedValue({ recorded: true });
    db.getContentMaterialCheckoutMetrics.mockResolvedValue({ totalClicks: 4, materials: [{ id: 1, title: publishedMarketplaceMaterial.title, checkoutClicks: 4 }] });

    await expect(contentRouter.createCaller(createContext("user")).trackCheckout({ materialId: 1 })).resolves.toEqual({ recorded: true });
    expect(db.registerContentMaterialCheckoutClick).toHaveBeenCalledWith({ materialId: 1, userId: 19080001 });
    await expect(contentRouter.createCaller(createContext()).metrics()).resolves.toMatchObject({ totalClicks: 4 });
    await expect(contentRouter.createCaller(createContext("user")).metrics()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("valida PDF e grava o conteúdo pelo storagePut no R2", async () => {
    const content = Buffer.from("%PDF-1.4\nTST Brasil Hub\n");
    storage.storagePut.mockResolvedValue({ key: "content-assets/pdf/test.pdf", url: "/storage/content-assets/pdf/test.pdf" });

    await expect(contentRouter.createCaller(createContext()).uploadAsset({
      kind: "pdf",
      fileName: "manual-teste.pdf",
      dataUrl: `data:application/pdf;base64,${content.toString("base64")}`,
    })).resolves.toMatchObject({ fileName: "manual-teste.pdf", mimeType: "application/pdf", bytes: content.length });
    expect(storage.storagePut).toHaveBeenCalledWith(expect.stringMatching(/^content-assets\/pdf\/.*\.pdf$/), content, "application/pdf");
  });

});

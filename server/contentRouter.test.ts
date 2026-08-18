import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const db = vi.hoisted(() => ({
  createContentMaterial: vi.fn(),
  listContentMaterialsForAdmin: vi.fn(),
  listPublishedContentMaterials: vi.fn(),
  updateContentMaterial: vi.fn(),
}));

vi.mock("./db", () => db);

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
});

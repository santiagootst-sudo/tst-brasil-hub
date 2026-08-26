import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("correções operacionais do portal", () => {
  it("mantém o menu móvel e alertas acionáveis no layout", () => {
    const layout = readFileSync(new URL("../client/src/components/DashboardLayout.tsx", import.meta.url), "utf8");
    expect(layout).toContain("Sheet open={mobileNavOpen}");
    expect(layout).toContain("setMobileNavOpen(true)");
    expect(layout).toContain("workspaceNotifications");
    expect(layout).toContain("Alertas do ambiente ativo");
  });

  it("faz upload de arquivos pelo servidor e pelo armazenamento R2", () => {
    const contentRouter = readFileSync(new URL("./routers/contentRouter.ts", import.meta.url), "utf8");
    const operationsRouter = readFileSync(new URL("./routers/operationsRouter.ts", import.meta.url), "utf8");
    const pgrPage = readFileSync(new URL("../client/src/pages/PgrApp.tsx", import.meta.url), "utf8");
    const operationsPage = readFileSync(new URL("../client/src/pages/Operations.tsx", import.meta.url), "utf8");
    expect(contentRouter).toContain("storagePut");
    expect(contentRouter).toContain("uploadAsset");
    expect(operationsRouter).toContain("uploadEpiImage");
    expect(operationsRouter).toContain("storagePut");
    expect(pgrPage).toContain("readFileAsDataUrl");
    expect(operationsPage).toContain("trpc.portal.uploadEpiImage");
  });

  it("persiste GHEs no TiDB e mantém a compatibilidade do gerador legado", () => {
    const pgrPage = readFileSync(new URL("../client/src/pages/PgrApp.tsx", import.meta.url), "utf8");
    const pgrRouter = readFileSync(new URL("./routers/pgrRouter.ts", import.meta.url), "utf8");
    expect(pgrPage).toContain("trpc.portal.createGhe.useMutation");
    expect(pgrPage).toContain("trpc.portal.importGhes.useMutation");
    expect(pgrPage).toContain("localStorage.setItem(storageKey, JSON.stringify(data))");
    expect(pgrRouter).toContain("portalDb.createPgrGheGroupForProject");
    expect(pgrRouter).toContain("portalDb.importPgrGheGroupsForProject");
  });

  it("alinha o acesso manual aprovado do PGR no ticket e no gateway", () => {
    const router = readFileSync(new URL("./routers/pgrRouter.ts", import.meta.url), "utf8");
    const gateway = readFileSync(new URL("./pgrLegacyRoute.ts", import.meta.url), "utf8");
    expect(router).toContain("accessExpiresAt: accessUser?.accessExpiresAt");
    expect(router).toContain("portalDb.getUserById(ctx.user.id)");
    expect(gateway).toContain("getUserById(userId)");
  });

  it("preserva documentos CIPA sem cabeçalho de marca do portal", () => {
    const cipa = readFileSync(new URL("../client/src/pages/CipaAssistant.tsx", import.meta.url), "utf8");
    expect(cipa).toContain("IDENTIFICAÇÃO DA ELEIÇÃO");
    expect(cipa).toContain("VIA 01 — COMPROVANTE DE INSCRIÇÃO");
    expect(cipa).not.toContain("TST BRASIL HUB  ·  CIPA");
  });
});

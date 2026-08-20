import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
const sourcePath = new URL("./fixtures/pgr-pro-portal-integrado.html", import.meta.url);

async function readPgrSource() {
  return readFile(sourcePath, "utf8");
}

describe("PGR legado integrado ao Portal TST", () => {
  it("inicia por portalAuth sem exibir login ou permitir saída interna", async () => {
    const html = await readPgrSource();

    expect(html).toContain("function iniciarSessaoDoPortal()");
    expect(html).toContain("params.get('portalAuth') !== '1'");
    expect(html).toContain("loginContainer.classList.add('hidden')");
    expect(html).toContain("pgrContainer.classList.add('active')");
    expect(html).toContain("logoutButton.style.display = 'none'");
    expect(html).toContain("O acesso deste PGR é gerenciado pelo Portal TST.");
  });

  it("mantém autosave e exportações do HTML legado disponíveis", async () => {
    const html = await readPgrSource();

    expect(html).toContain("function salvarDados()");
    expect(html).toContain("localStorage.setItem('pgrDadosV23'");
    expect(html).toContain("function carregarDados()");
    expect(html).toContain("html2pdf");
    expect(html).toContain("html-docx");
  });

  it("escopa o armazenamento local e o retorno ao ambiente no shell do portal", async () => {
    const shell = await readFile("server/pgrLegacyRoute.ts", "utf8");

    expect(shell).toContain("var portalStoragePrefix = 'tst-pgr-project-${workspaceId}-${storageScope}-'");
    expect(shell).toContain("portalStorage.setItem = function");
    expect(shell).toContain("portalStorage.getItem = function");
    expect(shell).toContain("portalStorage.removeItem = function");
    expect(shell).toContain("portalBackUrl = '/app/pgr?workspace=${workspaceId}'");
    expect(shell).toContain("tst-pgr-document-snapshot");
  });

  it("mantém uma origem pública de contingência para o HTML legado no Render", async () => {
    const shell = await readFile("server/pgrLegacyRoute.ts", "utf8");
    const assets = await readFile("shared/publicAssets.ts", "utf8");

    expect(shell).toContain("publicAssetUrls.pgrLegacyHtml");
    expect(assets).toContain("pgrLegacyHtml");
  });
});

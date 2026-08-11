import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const sourcePath = "/home/ubuntu/webdev-static-assets/pgr-pro-portal-integrado.html";

describe("PGR legado integrado ao Portal TST", () => {
  it("inicia por portalAuth sem exibir login ou permitir saída interna", async () => {
    const html = await readFile(sourcePath, "utf8");

    expect(html).toContain("function iniciarSessaoDoPortal()");
    expect(html).toContain("params.get('portalAuth') !== '1'");
    expect(html).toContain("loginContainer.classList.add('hidden')");
    expect(html).toContain("pgrContainer.classList.add('active')");
    expect(html).toContain("logoutButton.style.display = 'none'");
    expect(html).toContain("O acesso deste PGR é gerenciado pelo Portal TST.");
  });
});

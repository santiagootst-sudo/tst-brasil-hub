import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const brandSource = readFileSync(resolve(process.cwd(), "client/src/components/BrandLockup.tsx"), "utf8");
const homeSource = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
const workspaceSource = readFileSync(resolve(process.cwd(), "client/src/pages/WorkspaceHub.tsx"), "utf8");
const layoutSource = readFileSync(resolve(process.cwd(), "client/src/components/DashboardLayout.tsx"), "utf8");
const htmlSource = readFileSync(resolve(process.cwd(), "client/index.html"), "utf8");

describe("identidade TST Brasil Hub", () => {
  it("utiliza o logotipo oficial otimizado no lockup reutilizável", () => {
    expect(brandSource).toContain("tst-brasil-hub-logo-otimizado_50d81e90.png");
    expect(brandSource).toContain('alt="TST Brasil Hub"');
    expect(brandSource).toContain('inverse ? "rounded-xl bg-white');
  });

  it("aplica o lockup na entrada pública, na escolha de ambiente e no dashboard", () => {
    expect(homeSource).toContain("<BrandLockup");
    expect(workspaceSource).toContain("<BrandLockup");
    expect(layoutSource).toContain("<BrandLockup inverse");
    expect(layoutSource).toContain('title = "TST Brasil Hub"');
    expect(workspaceSource).not.toContain('>TST Brasil Hub</p>');
  });

  it("publica metadados coerentes com a marca atual", () => {
    expect(htmlSource).toContain("<html lang=\"pt-BR\">");
    expect(htmlSource).toContain("<title>TST Brasil Hub — Gestão SST</title>");
    expect(htmlSource).toContain("tst-brasil-hub-favicon_07785ba1.png");
    expect(homeSource).not.toContain("portal-tst-logo-clean_28523a59.png");
  });
});

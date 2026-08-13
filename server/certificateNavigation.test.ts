import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dashboardLayout = readFileSync(resolve(process.cwd(), "client/src/components/DashboardLayout.tsx"), "utf8");
const workspaceOverview = readFileSync(resolve(process.cwd(), "client/src/pages/WorkspaceOverview.tsx"), "utf8");
const certificatesPage = readFileSync(resolve(process.cwd(), "client/src/pages/Certificates.tsx"), "utf8");

describe("navegação do gerador de certificados no ambiente Empresa", () => {
  it("expõe um item contextual explícito no menu CLT", () => {
    expect(dashboardLayout).toContain('const isClt = currentWorkspace?.kind === "clt";');
    expect(dashboardLayout).toContain('{ label: "Gerador de certificados NR", icon: Award, path: "/app/certificados?generator=1" }');
  });

  it("expõe um atalho direto no dashboard Empresa preservando o workspace", () => {
    expect(workspaceOverview).toContain('title: "Gerador de certificados NR", text: "Emitir e validar certificados"');
    expect(workspaceOverview).toContain('appHref("/app/certificados")}&generator=1');
  });

  it("mantém o gerador visível e bloqueia apenas a emissão sem permissão", () => {
    expect(certificatesPage).toContain('disabled={!canManage}');
    expect(certificatesPage).toContain('<CertificateGeneratorPanel');
    expect(certificatesPage).toContain('canManage={canManage}');
  });
});

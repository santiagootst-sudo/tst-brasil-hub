import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const layoutSource = readFileSync(
  resolve(process.cwd(), "client/src/components/DashboardLayout.tsx"),
  "utf8"
);
const overviewSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/WorkspaceOverview.tsx"),
  "utf8"
);
const routerSource = readFileSync(
  resolve(process.cwd(), "server/routers.ts"),
  "utf8"
);
const dbSource = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");

describe("conta e experiência de carregamento do dashboard", () => {
  it("oferece logout no cabeçalho e mantém o encerramento integrado ao hook de autenticação", () => {
    expect(layoutSource).toContain("const handleLogout = async () =>");
    expect(layoutSource).toContain("await logout();");
    expect(layoutSource).toContain('title="Encerrar sessão"');
    expect(layoutSource).toContain("Sessão encerrada com segurança.");
  });

  it("permite editar o nome e salvar preferências sem expor alteração de email", () => {
    expect(routerSource).toContain("updateProfile: protectedProcedure");
    expect(routerSource).toMatch(/z\s*\.string\(\)\s*\.trim\(\)\s*\.min\(2/);
    expect(dbSource).toContain("updateUserProfile");
    expect(layoutSource).toContain('id="profile-name"');
    expect(layoutSource).toContain("PROFILE_PREFERENCES_KEY");
    expect(layoutSource).toContain(
      "O email é gerenciado pelo provedor de autenticação"
    );
    expect(layoutSource).toContain("Preferências salvas neste navegador.");
  });

  it("renderiza skeletons animados e acessíveis durante a busca do panorama", () => {
    expect(overviewSource).toContain("function WorkspaceOverviewSkeleton()");
    expect(overviewSource).toContain('aria-busy="true"');
    expect(overviewSource).toContain("motion-safe:animate-pulse");
    expect(overviewSource).toContain(
      "Os indicadores serão exibidos quando os registros reais terminarem de carregar."
    );
    expect(overviewSource).toContain("return <WorkspaceOverviewSkeleton />;");
  });
});

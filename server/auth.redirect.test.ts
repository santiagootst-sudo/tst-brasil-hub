import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const mainSource = readFileSync(
  resolve(process.cwd(), "client/src/main.tsx"),
  "utf8"
);
const constSource = readFileSync(
  resolve(process.cwd(), "client/src/const.ts"),
  "utf8"
);
const authHookSource = readFileSync(
  resolve(process.cwd(), "client/src/_core/hooks/useAuth.ts"),
  "utf8"
);

describe("proteções do fluxo de autenticação", () => {
  it("não redireciona erros de sessão em páginas públicas", () => {
    expect(mainSource).toContain(
      'const isProtectedRoute = window.location.pathname === "/app" || window.location.pathname.startsWith("/app/")'
    );
    expect(mainSource).toContain(
      "if (!isUnauthorized || !isProtectedRoute || loginRedirectInFlight) return;"
    );
  });

  it("retorna usuários não autenticados ao login local sem depender de OAuth", () => {
    expect(constSource).toContain(
      "export const isOAuthConfigured = () => false;"
    );
    expect(constSource).toContain('window.location.assign("/");');
    expect(mainSource).toContain("startLogin({ automatic: true });");
    expect(authHookSource).toContain("startLogin({ automatic: true });");
  });

  it("mantém a tentativa manual disponível", () => {
    expect(constSource).toContain("automatic = false");
    expect(constSource).toContain(
      'window.dispatchEvent(new CustomEvent("tst:open-login"));'
    );
  });
});

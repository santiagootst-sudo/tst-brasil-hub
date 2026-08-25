import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const clientSource = readFileSync(
  resolve(process.cwd(), "client/src/const.ts"),
  "utf8"
);
const serverSource = readFileSync(
  resolve(process.cwd(), "server/_core/oauth.ts"),
  "utf8"
);
const sharedSource = readFileSync(
  resolve(process.cwd(), "shared/const.ts"),
  "utf8"
);

describe("autenticação independente", () => {
  it("mantém o OAuth do cliente desativado em produção", () => {
    expect(clientSource).toContain(
      "export const isOAuthConfigured = () => false;"
    );
    expect(clientSource).not.toContain("VITE_OAUTH_PORTAL_URL");
    expect(clientSource).not.toContain("/app-auth");
  });

  it("preserva a proteção CSRF da rota OAuth legada caso ela seja habilitada explicitamente", () => {
    expect(sharedSource).toContain(
      'export const OAUTH_STATE_COOKIE = "__Host-oauth_state";'
    );
    expect(sharedSource).toContain(
      'export const OAUTH_STATE_COOKIE_FALLBACK = "oauth_state";'
    );
    expect(serverSource).toContain(
      'const requestCookies = parseCookieHeader(req.headers.cookie ?? "");'
    );
    expect(serverSource).toContain(
      "requestCookies[OAUTH_STATE_COOKIE] ?? requestCookies[OAUTH_STATE_COOKIE_FALLBACK]"
    );
    expect(serverSource).toContain("if (!nonce || nonce !== expectedNonce)");
    expect(serverSource).toContain(
      'res.status(403).json({ error: "invalid oauth state" });'
    );
  });

  it("mantém startLogin como fallback local sem nonce externo", () => {
    expect(clientSource).toContain(
      'window.dispatchEvent(new CustomEvent("tst:open-login"));'
    );
    expect(clientSource).not.toContain("crypto.randomUUID");
    expect(clientSource).not.toContain("window.location.href = url.toString()");
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const clientSource = readFileSync(resolve(process.cwd(), "client/src/const.ts"), "utf8");
const serverSource = readFileSync(resolve(process.cwd(), "server/_core/oauth.ts"), "utf8");
const sharedSource = readFileSync(resolve(process.cwd(), "shared/const.ts"), "utf8");

describe("regressão do estado OAuth", () => {
  it("usa o cookie __Host- em HTTPS e fallback somente em preview HTTP", () => {
    expect(sharedSource).toContain('export const OAUTH_STATE_COOKIE = "__Host-oauth_state";');
    expect(sharedSource).toContain('export const OAUTH_STATE_COOKIE_FALLBACK = "oauth_state";');
    expect(clientSource).toContain('const cookieName = secureOrigin ? OAUTH_STATE_COOKIE : OAUTH_STATE_COOKIE_FALLBACK;');
    expect(clientSource).toContain('`SameSite=${secureOrigin ? "None" : "Lax"}`');
    expect(clientSource).toContain('if (secureOrigin) cookieAttributes.push("Secure");');
  });

  it("valida o nonce contra os dois nomes de cookie sem remover a proteção CSRF", () => {
    expect(serverSource).toContain("const requestCookies = parseCookieHeader(req.headers.cookie ?? \"\");");
    expect(serverSource).toContain("requestCookies[OAUTH_STATE_COOKIE] ?? requestCookies[OAUTH_STATE_COOKIE_FALLBACK]");
    expect(serverSource).toContain('if (!nonce || nonce !== expectedNonce)');
    expect(serverSource).toContain('res.status(403).json({ error: "invalid oauth state" });');
  });

  it("impede que tentativas automáticas ou manuais simultâneas sobrescrevam o nonce", () => {
    expect(clientSource).toContain("const LOGIN_REDIRECT_MANUAL_LOCK_TTL = 3_000;");
    expect(clientSource).toContain("const lockTtl = automatic ? LOGIN_REDIRECT_LOCK_TTL : LOGIN_REDIRECT_MANUAL_LOCK_TTL;");
    expect(clientSource).toContain('window.localStorage.setItem(LOGIN_REDIRECT_LOCK, String(now))');
  });
});

import { OAUTH_STATE_COOKIE, OAUTH_STATE_COOKIE_FALLBACK, encodeOAuthState } from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Start the Manus OAuth login. Call this from an event handler or effect at the
// moment you want to navigate, e.g. `onClick={() => startLogin()}`.
//
// It has SIDE EFFECTS — it mints a one-time nonce, writes the __Host- state
// cookie, and navigates immediately — so the cookie nonce always matches the
// `state` it sends. Do NOT call it during render (no `href={startLogin()}` /
// `loginUrl={...}`): each call overwrites the cookie, so a stray render-phase
// call would desync it from an in-flight login and the callback would reject it
// with "invalid oauth state". It returns void by design, so there is no URL to
// stash across renders.
const LOGIN_REDIRECT_LOCK = "portal-tst-login-redirect";
const LOGIN_REDIRECT_LOCK_TTL = 15_000;
const LOGIN_REDIRECT_MANUAL_LOCK_TTL = 3_000;

type StartLoginOptions = { automatic?: boolean };

export const isOAuthConfigured = () => false;

export const startLogin = ({ automatic = false }: StartLoginOptions = {}) => {
  if (typeof window === "undefined") return;

  let storage: Storage | null = null;
  try {
    storage = window.sessionStorage;
  } catch {
    // Alguns navegadores bloqueiam o storage privado; o fluxo OAuth continua,
    // mas sem usar o fallback de sessão do preview.
  }

  const now = Date.now();
  const lockValues: number[] = [];
  for (const candidate of [storage, (() => { try { return window.localStorage; } catch { return null; } })()]) {
    const value = Number(candidate?.getItem(LOGIN_REDIRECT_LOCK) ?? "0");
    if (Number.isFinite(value) && value > 0) lockValues.push(value);
  }
  const lastRedirect = Math.max(0, ...lockValues);
  const lockTtl = automatic ? LOGIN_REDIRECT_LOCK_TTL : LOGIN_REDIRECT_MANUAL_LOCK_TTL;
  if (lastRedirect > 0 && now - lastRedirect < lockTtl) return;

  storage?.setItem(LOGIN_REDIRECT_LOCK, String(now));
  try { window.localStorage.setItem(LOGIN_REDIRECT_LOCK, String(now)); } catch {}
  // Nunca deixe um Bearer de preview antigo substituir a sessão OAuth recém-iniciada.
  storage?.removeItem("manus-cookie");

  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  const nonce = crypto.randomUUID();
  const secureOrigin = window.location.protocol === "https:";
  const cookieName = secureOrigin ? OAUTH_STATE_COOKIE : OAUTH_STATE_COOKIE_FALLBACK;
  const cookieAttributes = [`${cookieName}=${nonce}`, "Path=/", "Max-Age=600", `SameSite=${secureOrigin ? "None" : "Lax"}`];
  if (secureOrigin) cookieAttributes.push("Secure");
  document.cookie = cookieAttributes.join("; ");
  const state = encodeOAuthState({ redirectUri, nonce });

  if (!oauthPortalUrl || !appId) {
    alert("O login por servidor externo (OAuth) não está configurado neste ambiente. Utilize o login por e-mail e senha diretamente no portal.");
    return;
  }
  try {
    const url = new URL(`${oauthPortalUrl}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");
    window.location.href = url.toString();
  } catch (err) {
    console.error("[OAuth] Invalid OAuth portal URL:", oauthPortalUrl, err);
    alert("URL do servidor de autenticação inválida. Utilize o login por e-mail e senha.");
  }
};

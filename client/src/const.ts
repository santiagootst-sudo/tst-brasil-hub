import { OAUTH_STATE_COOKIE, encodeOAuthState } from "@shared/const";

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

type StartLoginOptions = { automatic?: boolean };

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
  const lastRedirect = Number(storage?.getItem(LOGIN_REDIRECT_LOCK) ?? "0");
  if (automatic && Number.isFinite(lastRedirect) && now - lastRedirect < LOGIN_REDIRECT_LOCK_TTL) return;

  if (automatic) storage?.setItem(LOGIN_REDIRECT_LOCK, String(now));
  // Nunca deixe um Bearer de preview antigo substituir a sessão OAuth recém-iniciada.
  storage?.removeItem("manus-cookie");

  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  const nonce = crypto.randomUUID();
  document.cookie = `${OAUTH_STATE_COOKIE}=${nonce}; Path=/; Max-Age=600; SameSite=None; Secure`;
  const state = encodeOAuthState({ redirectUri, nonce });

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  window.location.href = url.toString();
};

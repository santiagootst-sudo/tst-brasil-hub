export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

type StartLoginOptions = { automatic?: boolean };

/** OAuth externo foi removido do caminho de produção; o portal usa login local. */
export const isOAuthConfigured = () => false;

/**
 * Mantém compatibilidade com componentes antigos que chamam startLogin.
 * Usuários não autenticados retornam à página inicial, sem chamada a provedor externo.
 */
export const startLogin = ({ automatic = false }: StartLoginOptions = {}) => {
  if (typeof window === "undefined") return;
  if (automatic && window.location.pathname !== "/") {
    window.location.assign("/");
    return;
  }
  window.dispatchEvent(new CustomEvent("tst:open-login"));
};

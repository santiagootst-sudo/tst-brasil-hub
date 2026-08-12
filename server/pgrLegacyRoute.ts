import type { Express, Request, Response } from "express";
import { canUsePaidApps } from "./access";
import { getSubscriptionForUser, getUserById, getWorkspaceForUser } from "./db";
import { verifyPgrIframeTicket } from "./pgrIframeTicket";
import { sdk } from "./_core/sdk";
import { storageGetSignedUrl } from "./storage";

const PGR_STORAGE_KEY = "pgr-pro-portal-integrado_2fdf701f.html";
let cachedPgrHtml: string | null = null;

async function getPgrHtml() {
  if (cachedPgrHtml) return cachedPgrHtml;
  const signedUrl = await storageGetSignedUrl(PGR_STORAGE_KEY);
  const response = await fetch(signedUrl);
  if (!response.ok) throw new Error(`Falha ao carregar o PGR do armazenamento (${response.status}).`);
  cachedPgrHtml = await response.text();
  return cachedPgrHtml;
}

function withPortalShell(html: string, workspaceId: number) {
  const portalScript = `<style>
html.portal-tst-embedded #loginContainer { display: none !important; }
html.portal-tst-embedded, html.portal-tst-embedded body { width: 100%; height: 100%; overflow: hidden; }
html.portal-tst-embedded #pgrContainer { display: flex !important; width: 100% !important; max-width: none !important; height: 100vh !important; min-height: 100vh !important; margin: 0 !important; border-radius: 0 !important; }
html.portal-tst-embedded #pgrContainer .sidebar { height: 100vh !important; max-height: 100vh !important; }
html.portal-tst-embedded #pgrContainer .main-content { min-width: 0; height: 100vh !important; max-height: 100vh !important; }
#portal-tst-back-link { position: fixed; top: 14px; right: 18px; z-index: 2147483647; display: inline-flex; align-items: center; gap: 8px; border-radius: 10px; background: #063b43; color: #ffffff; padding: 10px 14px; font: 700 13px/1.1 Arial, sans-serif; text-decoration: none; box-shadow: 0 8px 22px rgba(6, 59, 67, .24); }
#portal-tst-back-link:hover { background: #0c7474; }
</style><script>
(function () {
  var portalBackUrl = '/app/pgr?workspace=${workspaceId}';
  function activatePortalMode() {
    document.documentElement.classList.add('portal-tst-embedded');
    var login = document.getElementById('loginContainer');
    var app = document.getElementById('pgrContainer');
    if (login) login.style.display = 'none';
    if (app) { app.classList.add('active'); app.style.display = 'block'; }
    if (!document.getElementById('portal-tst-back-link')) {
      var back = document.createElement('a');
      back.id = 'portal-tst-back-link';
      back.href = portalBackUrl;
      back.textContent = '← Voltar ao Portal TST';
      back.setAttribute('aria-label', 'Voltar ao Portal TST');
      document.body.appendChild(back);
    }
  }
  document.documentElement.classList.add('portal-tst-embedded');
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', activatePortalMode);
  else activatePortalMode();
})();
</script>`;
  return html.includes("</head>") ? html.replace("</head>", `${portalScript}</head>`) : `${portalScript}${html}`;
}

export function registerPgrLegacyRoute(app: Express) {
  app.get("/api/apps/pgr/:workspaceId", async (req: Request, res: Response) => {
    try {
      let user = null;
      try {
        user = await sdk.authenticateRequest(req);
      } catch {
        user = null;
      }
      const workspaceId = Number(req.params.workspaceId);
      if (!Number.isInteger(workspaceId) || workspaceId <= 0) return res.status(400).send("Ambiente inválido.");

      const rawTicket = req.query?.ticket;
      const ticket = typeof rawTicket === "string" ? await verifyPgrIframeTicket(rawTicket) : null;
      if (!user && !ticket) return res.status(401).send("Autenticação necessária para abrir o PGR.");
      if (ticket && ticket.workspaceId !== workspaceId) return res.status(403).send("Ticket inválido para este ambiente.");

      const userId = user?.id ?? ticket!.userId;
      const userRole = user?.role ?? ticket!.userRole;

      const [workspace, subscription, accessUser] = await Promise.all([
        getWorkspaceForUser(workspaceId, userId),
        getSubscriptionForUser(userId),
        user ? Promise.resolve(user) : getUserById(userId),
      ]);
      if (!workspace) return res.status(403).send("Você não possui acesso a este ambiente.");
      if (!canUsePaidApps({ userRole, accessStatus: accessUser?.accessStatus, accessExpiresAt: accessUser?.accessExpiresAt, subscriptionStatus: subscription?.status })) {
        return res.status(402).send("Uma assinatura ativa é necessária para usar o PGR Pro.");
      }

      const html = await getPgrHtml();
      res.set({
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
        "X-Frame-Options": "SAMEORIGIN",
      });
      return res.send(withPortalShell(html, workspaceId));
    } catch (error) {
      console.error("[PGR] Falha ao abrir aplicativo legado", error);
      return res.status(500).send("Não foi possível carregar o Gerador de PGR.");
    }
  });
}

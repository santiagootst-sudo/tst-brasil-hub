import type { Express, Request, Response } from "express";
import { canUsePaidApps } from "./access";
import { getSubscriptionForUser, getWorkspaceForUser } from "./db";
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

      const [workspace, subscription] = await Promise.all([
        getWorkspaceForUser(workspaceId, userId),
        getSubscriptionForUser(userId),
      ]);
      if (!workspace) return res.status(403).send("Você não possui acesso a este ambiente.");
      if (!canUsePaidApps({ userRole, subscriptionStatus: subscription?.status })) {
        return res.status(402).send("Uma assinatura ativa é necessária para usar o PGR Pro.");
      }

      const html = await getPgrHtml();
      res.set({
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
        "X-Frame-Options": "SAMEORIGIN",
      });
      return res.send(html);
    } catch (error) {
      console.error("[PGR] Falha ao abrir aplicativo legado", error);
      return res.status(500).send("Não foi possível carregar o Gerador de PGR.");
    }
  });
}

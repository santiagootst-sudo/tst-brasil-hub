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

  window.addEventListener('DOMContentLoaded', function () {
    // Injetar estilos do modal e toast
    var style = document.createElement('style');
    style.textContent = '#tst-modal-overlay { position: fixed; inset: 0; background: rgba(9, 30, 34, 0.65); backdrop-filter: blur(4px); z-index: 2147483646; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s ease; }' +
      '#tst-modal-overlay.active { opacity: 1; }' +
      '#tst-modal-card { background: #ffffff; border-radius: 20px; padding: 28px; max-width: 420px; width: 90%; box-shadow: 0 20px 40px rgba(0,0,0,0.25); transform: scale(0.95); transition: transform 0.2s ease; font-family: system-ui, sans-serif; }' +
      '#tst-modal-overlay.active #tst-modal-card { transform: scale(1); }' +
      '#tst-toast { position: fixed; bottom: 24px; right: 24px; background: #0c7474; color: #ffffff; padding: 14px 20px; border-radius: 12px; box-shadow: 0 10px 30px rgba(6,59,67,0.3); z-index: 2147483647; font: 600 14px system-ui, sans-serif; opacity: 0; transform: translateY(20px); transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1); pointer-events: none; }' +
      '#tst-toast.active { opacity: 1; transform: translateY(0); }';
    document.head.appendChild(style);

    function showToast(msg) {
      var old = document.getElementById('tst-toast');
      if (old) old.remove();
      var t = document.createElement('div');
      t.id = 'tst-toast';
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(function() { t.classList.add('active'); }, 10);
      setTimeout(function() {
        t.classList.remove('active');
        setTimeout(function() { t.remove(); }, 300);
      }, 3500);
    }

    // Injetar barra de progresso no topo do conteúdo principal
    var mainContent = document.querySelector('.main-content') || document.body;
    var progressBarContainer = document.createElement('div');
    progressBarContainer.id = 'tst-progress-bar-container';
    progressBarContainer.innerHTML = '<div style="background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; font-family: system-ui, sans-serif; box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: sticky; top: 0; z-index: 100;">' +
        '<div style="display: flex; align-items: center; gap: 10px;">' +
          '<div style="width: 28px; height: 28px; border-radius: 8px; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px;">📊</div>' +
          '<div>' +
            '<span style="font-size: 13px; font-weight: 700; color: #091e22; display: block;">Progresso do PGR</span>' +
            '<span id="tst-progress-text" style="font-size: 11px; color: #64748b; font-weight: 500;">0% preenchido</span>' +
          '</div>' +
        '</div>' +
        '<div style="flex: 1; max-width: 320px; background: #f1f5f9; height: 8px; border-radius: 999px; overflow: hidden; position: relative;">' +
          '<div id="tst-progress-fill" style="background: linear-gradient(90deg, #0c7474, #14b8a6); width: 0%; height: 100%; border-radius: 999px; transition: width 0.3s ease;"></div>' +
        '</div>' +
        '<div id="tst-progress-badge" style="background: #f0fdf4; color: #15803d; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; border: 1px solid #bbf7d0;">Em andamento</div>' +
      '</div>';
    if (mainContent.firstChild) {
      mainContent.insertBefore(progressBarContainer, mainContent.firstChild);
    } else {
      mainContent.appendChild(progressBarContainer);
    }

    function updateProgress() {
      var inputs = document.querySelectorAll('#pgrContainer input:not([type="hidden"]):not([type="submit"]):not([type="button"]), #pgrContainer select, #pgrContainer textarea');
      if (!inputs.length) return;
      var filled = 0;
      var total = inputs.length;
      for (var i = 0; i < total; i++) {
        var el = inputs[i];
        if (el.type === 'checkbox' || el.type === 'radio') {
          if (el.checked) filled++;
        } else if (el.value && el.value.trim() !== '') {
          filled++;
        }
      }
      var pct = Math.min(100, Math.round((filled / total) * 100));
      var fillEl = document.getElementById('tst-progress-fill');
      var textEl = document.getElementById('tst-progress-text');
      var badgeEl = document.getElementById('tst-progress-badge');
      if (fillEl) fillEl.style.width = pct + '%';
      if (textEl) textEl.textContent = pct + '% preenchido (' + filled + '/' + total + ' campos)';
      if (badgeEl) {
        if (pct === 100) {
          badgeEl.textContent = 'Concluído 100%';
          badgeEl.style.background = '#f0fdf4';
          badgeEl.style.color = '#15803d';
          badgeEl.style.borderColor = '#bbf7d0';
        } else if (pct > 50) {
          badgeEl.textContent = 'Avançado';
          badgeEl.style.background = '#fef9c3';
          badgeEl.style.color = '#a16207';
          badgeEl.style.borderColor = '#fef08a';
        } else {
          badgeEl.textContent = 'Em andamento';
          badgeEl.style.background = '#f0fdf4';
          badgeEl.style.color = '#15803d';
          badgeEl.style.borderColor = '#bbf7d0';
        }
      }
    }

    document.addEventListener('input', updateProgress);
    document.addEventListener('change', updateProgress);
    setTimeout(updateProgress, 500);

    window.clearData = window.limparDados = function () {
      var oldOverlay = document.getElementById('tst-modal-overlay');
      if (oldOverlay) oldOverlay.remove();

      var overlay = document.createElement('div');
      overlay.id = 'tst-modal-overlay';
      overlay.innerHTML = '<div id="tst-modal-card">' +
          '<div style="display:flex; align-items:center; gap:12px; margin-bottom:14px;">' +
            '<div style="width:40px; height:40px; border-radius:12px; background:#fef2f2; color:#dc2626; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:18px;">⚠️</div>' +
            '<div>' +
              '<h3 style="margin:0; font-size:18px; font-weight:700; color:#091e22;">Limpar todos os dados?</h3>' +
              '<p style="margin:2px 0 0; font-size:12px; color:#64748b;">Esta ação redefinirá o formulário do PGR.</p>' +
            '</div>' +
          '</div>' +
          '<p style="font-size:14px; color:#334155; line-height:1.5; margin:0 0 20px;">Deseja realmente limpar todos os campos preenchidos neste PGR? Os dados atuais serão apagados e não poderão ser recuperados.</p>' +
          '<div style="display:flex; gap:10px; justify-content:flex-end;">' +
            '<button id="tst-modal-cancel" style="padding:10px 16px; border-radius:10px; border:1px solid #cbd5e1; background:#ffffff; color:#334155; font-weight:600; cursor:pointer; font-size:13px;">Cancelar</button>' +
            '<button id="tst-modal-confirm" style="padding:10px 18px; border-radius:10px; border:none; background:#dc2626; color:#ffffff; font-weight:600; cursor:pointer; font-size:13px;">Sim, limpar dados</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(overlay);
      setTimeout(function() { overlay.classList.add('active'); }, 10);

      document.getElementById('tst-modal-cancel').onclick = function () {
        overlay.classList.remove('active');
        setTimeout(function() { overlay.remove(); }, 200);
      };

      document.getElementById('tst-modal-confirm').onclick = function () {
        overlay.classList.remove('active');
        setTimeout(function() { overlay.remove(); }, 200);
        try {
          var inputs = document.querySelectorAll('#pgrContainer input:not([type="hidden"]):not([type="submit"]):not([type="button"]), #pgrContainer select, #pgrContainer textarea');
          for (var i = 0; i < inputs.length; i++) {
            var el = inputs[i];
            if (el.type === 'checkbox' || el.type === 'radio') {
              el.checked = false;
            } else {
              el.value = '';
            }
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
          for (var key in localStorage) {
            if (key.indexOf('pgr') !== -1 || key.indexOf('tst') !== -1) {
              localStorage.removeItem(key);
            }
          }
          showToast('✓ Dados limpos e redefinidos com sucesso!');
        } catch (err) {
          console.error('Erro ao limpar dados:', err);
        }
      };
    };
  });
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

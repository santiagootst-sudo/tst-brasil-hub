import type { Express, Request, Response } from "express";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { canUsePaidApps } from "./access";
import {
  getPgrProjectForWorkspace,
  getSubscriptionForUser,
  getUserById,
  getWorkspaceForUser,
} from "./db";
import { verifyPgrIframeTicket } from "./pgrIframeTicket";
import { sdk } from "./_core/sdk";
import { publicAssetUrls } from "@shared/publicAssets";

let cachedPgrHtml: string | null = null;

async function getPgrHtml() {
  if (cachedPgrHtml) return cachedPgrHtml;

  const assetPaths = [
    resolve(process.cwd(), "dist/public/assets/pgr-legacy.html"),
    resolve(process.cwd(), "client/public/assets/pgr-legacy.html"),
  ];
  let lastError: unknown;
  for (const assetPath of assetPaths) {
    try {
      cachedPgrHtml = await readFile(assetPath, "utf8");
      return cachedPgrHtml;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`Falha ao carregar o asset local ${publicAssetUrls.pgrLegacyHtml}.`, { cause: lastError });
}

function withPortalShell(
  html: string,
  workspaceId: number,
  storageScope: string
) {
  const portalScript = `<style>
html.portal-tst-embedded #loginContainer { display: none !important; }
html.portal-tst-embedded, html.portal-tst-embedded body { width: 100%; height: 100%; overflow: hidden; }
html.portal-tst-embedded #pgrContainer { display: flex !important; width: 100% !important; max-width: none !important; height: 100vh !important; min-height: 100vh !important; margin: 0 !important; border-radius: 0 !important; }
html.portal-tst-embedded #pgrContainer .sidebar { height: 100vh !important; max-height: 100vh !important; }
html.portal-tst-embedded #pgrContainer .main-content { min-width: 0; height: 100vh !important; max-height: 100vh !important; }
#portal-tst-back-link { position: fixed; top: 13px; right: 18px; z-index: 2147483647; display: inline-flex; align-items: center; gap: 8px; border: 1px solid #0c7474; border-radius: 8px; background: #063b43; color: #ffffff; padding: 9px 12px; font: 700 12px/1.1 Inter, Arial, sans-serif; text-decoration: none; box-shadow: none; }
#portal-tst-back-link:hover { background: #0c7474; }

/* Camada visual operacional do Portal TST para o aplicativo legado. */
html.portal-tst-embedded body { background: #f5f8f7 !important; color: #183238 !important; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important; }
html.portal-tst-embedded #pgrContainer .sidebar { width: 250px !important; min-width: 250px !important; background: #063b43 !important; border-right: 1px solid #0a555e !important; box-shadow: none !important; }
html.portal-tst-embedded #pgrContainer .sidebar-header { padding: 22px 20px 18px !important; border-bottom: 1px solid rgba(197, 237, 229, .16) !important; }
html.portal-tst-embedded #pgrContainer .sidebar-header h2 { color: #ffffff !important; font-size: 15px !important; letter-spacing: -.01em !important; }
html.portal-tst-embedded #pgrContainer .sidebar-header p { color: #b9d8d4 !important; font-size: 11px !important; }
html.portal-tst-embedded #pgrContainer .menu-category { margin: 18px 14px 6px !important; padding: 0 4px !important; color: #8ec5bd !important; font-size: 10px !important; font-weight: 800 !important; letter-spacing: .1em !important; text-transform: uppercase !important; }
html.portal-tst-embedded #pgrContainer .menu-item { margin: 2px 10px !important; padding: 9px 11px !important; border: 1px solid transparent !important; border-radius: 7px !important; color: #dceeea !important; font-size: 12px !important; font-weight: 600 !important; line-height: 1.25 !important; transition: background .16s ease, border-color .16s ease, color .16s ease !important; }
html.portal-tst-embedded #pgrContainer .menu-item:hover { background: rgba(255,255,255,.08) !important; color: #ffffff !important; }
html.portal-tst-embedded #pgrContainer .menu-item.active { background: #0c7474 !important; border-color: #2c9a96 !important; color: #ffffff !important; box-shadow: none !important; }
html.portal-tst-embedded #pgrContainer .badge-count { min-width: 17px !important; height: 17px !important; margin-left: auto !important; border-radius: 999px !important; background: rgba(255,255,255,.16) !important; color: #ffffff !important; font-size: 10px !important; line-height: 17px !important; }
html.portal-tst-embedded #pgrContainer .main-content { background: #f5f8f7 !important; }
html.portal-tst-embedded #pgrContainer .header { min-height: 56px !important; padding: 10px 194px 10px 26px !important; border-bottom: 1px solid #dce8e4 !important; background: #ffffff !important; box-shadow: none !important; }
html.portal-tst-embedded #pgrContainer .header-left .icon { display: none !important; }
html.portal-tst-embedded #pgrContainer .header-left h1 { color: #16343a !important; font-size: 15px !important; font-weight: 750 !important; }
html.portal-tst-embedded #pgrContainer .header .badge { border: 1px solid #cde5df !important; border-radius: 999px !important; background: #edf8f5 !important; color: #16635f !important; font-size: 10px !important; font-weight: 700 !important; }
html.portal-tst-embedded #pgrContainer .user-info { gap: 8px !important; }
html.portal-tst-embedded #pgrContainer #userNameDisplay, html.portal-tst-embedded #pgrContainer #userPlanDisplay, html.portal-tst-embedded #pgrContainer .btn-logout { display: none !important; }
html.portal-tst-embedded #pgrContainer .save-indicator { padding: 4px 8px !important; border: 1px solid #d7ece6 !important; border-radius: 999px !important; background: #f5fcf9 !important; color: #277269 !important; font-size: 10px !important; }
html.portal-tst-embedded #pgrContainer .btn-group.print-hidden { display: none !important; }
html.portal-tst-embedded #pgrContainer .tab-content { padding: 24px 28px 44px !important; }
html.portal-tst-embedded #pgrContainer .tab-content > h2 { color: #16343a !important; font-size: 22px !important; letter-spacing: -.025em !important; }
html.portal-tst-embedded #pgrContainer .dashboard-card, html.portal-tst-embedded #pgrContainer .card, html.portal-tst-embedded #pgrContainer .form-section { border: 1px solid #dbe8e4 !important; border-radius: 10px !important; background: #ffffff !important; box-shadow: none !important; }
html.portal-tst-embedded #pgrContainer input, html.portal-tst-embedded #pgrContainer select, html.portal-tst-embedded #pgrContainer textarea { border-color: #bfd8d2 !important; border-radius: 7px !important; color: #16343a !important; font: 500 13px/1.35 Inter, ui-sans-serif, system-ui, sans-serif !important; }
html.portal-tst-embedded #pgrContainer input:focus, html.portal-tst-embedded #pgrContainer select:focus, html.portal-tst-embedded #pgrContainer textarea:focus { border-color: #0c7474 !important; box-shadow: 0 0 0 3px rgba(12,116,116,.12) !important; outline: none !important; }
#tst-pgr-commandbar { position: sticky; top: 0; z-index: 102; display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 11px 26px; border-bottom: 1px solid #dce8e4; background: rgba(255,255,255,.97); backdrop-filter: blur(9px); font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
#tst-pgr-commandbar .tst-pgr-context { display: flex; min-width: 0; align-items: center; gap: 10px; }
#tst-pgr-commandbar .tst-pgr-context-mark { width: 9px; height: 9px; border-radius: 50%; background: #15803d; box-shadow: 0 0 0 4px #e7f5ed; }
#tst-pgr-commandbar .tst-pgr-eyebrow { margin: 0 0 2px; color: #608078; font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
#tst-pgr-commandbar .tst-pgr-title { overflow: hidden; color: #16343a; font-size: 13px; font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }
#tst-pgr-commandbar .tst-pgr-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 7px; }
#tst-pgr-commandbar button { display: inline-flex; min-height: 34px; align-items: center; justify-content: center; border: 1px solid #c8ddd8; border-radius: 7px; background: #ffffff; color: #24464a; padding: 0 11px; cursor: pointer; font: 700 12px/1 Inter, ui-sans-serif, system-ui, sans-serif; transition: background .16s ease, border-color .16s ease, transform .16s ease; }
#tst-pgr-commandbar button:hover { border-color: #7db8ae; background: #f2faf7; }
#tst-pgr-commandbar button:active { transform: scale(.97); }
#tst-pgr-commandbar button[data-action="save"] { border-color: #0c7474; background: #0c7474; color: #ffffff; }
#tst-pgr-commandbar button[data-action="save"]:hover { background: #075d60; }
#tst-pgr-commandbar button[data-action="clear"] { border-color: #ecc8c4; color: #a83930; }
@media (max-width: 860px) { html.portal-tst-embedded #pgrContainer .sidebar { width: 212px !important; min-width: 212px !important; } html.portal-tst-embedded #pgrContainer .tab-content { padding: 18px !important; } #tst-pgr-commandbar { align-items: flex-start; flex-direction: column; padding: 10px 16px; } #tst-pgr-commandbar .tst-pgr-actions { justify-content: flex-start; } html.portal-tst-embedded #pgrContainer .header { padding-right: 18px !important; } #portal-tst-back-link { position: static; margin: 10px 12px 0 auto; width: max-content; } }
@media (prefers-reduced-motion: reduce) { html.portal-tst-embedded #pgrContainer .menu-item, #tst-pgr-commandbar button { transition: none !important; } }
</style><script>
(function () {
  var portalBackUrl = '/app/pgr?workspace=${workspaceId}';
  var portalStoragePrefix = 'tst-pgr-project-${workspaceId}-${storageScope}-';
  var portalStorage = window.localStorage;
  var nativeSetItem = portalStorage.setItem.bind(portalStorage);
  var nativeGetItem = portalStorage.getItem.bind(portalStorage);
  var nativeRemoveItem = portalStorage.removeItem.bind(portalStorage);
  var nativeKey = portalStorage.key.bind(portalStorage);
  function scopedStorageKey(key) {
    return String(key).indexOf(portalStoragePrefix) === 0 ? String(key) : portalStoragePrefix + String(key);
  }
  portalStorage.setItem = function (key, value) { return nativeSetItem(scopedStorageKey(key), value); };
  portalStorage.getItem = function (key) { return nativeGetItem(scopedStorageKey(key)); };
  portalStorage.removeItem = function (key) { return nativeRemoveItem(scopedStorageKey(key)); };
  portalStorage.key = function (index) {
    var rawKey = nativeKey(index);
    return rawKey && rawKey.indexOf(portalStoragePrefix) === 0 ? rawKey.slice(portalStoragePrefix.length) : rawKey;
  };
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
    var snapshotTimer = null;
    function buildDocumentSnapshot() {
      var snapshot = JSON.parse(JSON.stringify(typeof dados !== 'undefined' ? dados : {}));
      snapshot.mapaRisco = snapshot.mapaRisco || {};
      if (typeof mapaCirculos !== 'undefined' && mapaCirculos.length) snapshot.mapaRisco.circulos = mapaCirculos;
      if (typeof mapaImagemData !== 'undefined' && mapaImagemData) snapshot.mapaRisco.imagem = mapaImagemData;
      else if (typeof mapaImagemCache !== 'undefined' && mapaImagemCache) snapshot.mapaRisco.imagem = mapaImagemCache;
      return snapshot;
    }
    function postDocumentSnapshot(action) {
      try {
        if (window.parent === window) return false;
        window.parent.postMessage({ type: 'tst-pgr-document-snapshot', action: action, snapshot: buildDocumentSnapshot() }, window.location.origin);
        if (action === 'word') showToast('info', 'O documento Word profissional está sendo preparado pelo Portal TST.');
        return false;
      } catch (error) {
        console.error('Erro ao preparar documento do PGR:', error);
        return false;
      }
    }
    function scheduleDocumentSnapshot() {
      if (snapshotTimer) clearTimeout(snapshotTimer);
      snapshotTimer = setTimeout(function () { postDocumentSnapshot('sync'); }, 600);
    }
    window.addEventListener('message', function (event) {
      if (event.origin !== window.location.origin || event.data?.type !== 'tst-pgr-request-document-snapshot') return;
      postDocumentSnapshot('sync');
    });
    window.baixarComoWord = function () { return postDocumentSnapshot('word'); };
    window.exportarWord = function () { return postDocumentSnapshot('word'); };
    document.querySelectorAll('button[onclick*="exportarWord"], button[onclick*="baixarComoWord"]').forEach(function (button) {
      button.onclick = function () { return postDocumentSnapshot('word'); };
    });
    document.addEventListener('input', scheduleDocumentSnapshot);
    document.addEventListener('change', scheduleDocumentSnapshot);
    setTimeout(function () { postDocumentSnapshot('sync'); }, 850);

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

    // Barra compacta de comandos: preserva as ações originais, mas prioriza o fluxo real do técnico.
    if (!document.getElementById('tst-pgr-commandbar')) {
      var commandBar = document.createElement('div');
      commandBar.id = 'tst-pgr-commandbar';
      commandBar.innerHTML = '<div class="tst-pgr-context">' +
          '<span class="tst-pgr-context-mark" aria-hidden="true"></span>' +
          '<div><p class="tst-pgr-eyebrow">Projeto em edição</p><div class="tst-pgr-title">Preencha, revise os riscos e emita o relatório</div></div>' +
        '</div>' +
        '<div class="tst-pgr-actions" aria-label="Comandos do PGR">' +
          '<button type="button" data-action="save">Salvar agora</button>' +
          '<button type="button" data-action="preview">Prévia PDF</button>' +
          '<button type="button" data-action="word">Emitir Word</button>' +
          '<button type="button" data-action="matrix">Ir à matriz</button>' +
          '<button type="button" data-action="clear">Limpar</button>' +
        '</div>';
      if (progressBarContainer.nextSibling) mainContent.insertBefore(commandBar, progressBarContainer.nextSibling);
      else mainContent.appendChild(commandBar);
      commandBar.addEventListener('click', function(event) {
        var action = event.target && event.target.getAttribute ? event.target.getAttribute('data-action') : null;
        if (!action) return;
        if (action === 'save' && typeof window.salvarDados === 'function') window.salvarDados();
        if (action === 'preview' && typeof window.abrirPreviewPDF === 'function') window.abrirPreviewPDF();
        if (action === 'word') postDocumentSnapshot('word');
        if (action === 'matrix' && typeof window.mudarAba === 'function') window.mudarAba('matriz');
        if (action === 'clear' && typeof window.limparDados === 'function') window.limparDados();
      });
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
  return html.includes("</head>")
    ? html.replace("</head>", `${portalScript}</head>`)
    : `${portalScript}${html}`;
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
      if (!Number.isInteger(workspaceId) || workspaceId <= 0)
        return res.status(400).send("Ambiente inválido.");

      const rawTicket = req.query?.ticket;
      const ticket =
        typeof rawTicket === "string"
          ? await verifyPgrIframeTicket(rawTicket)
          : null;
      if (!user && !ticket)
        return res
          .status(401)
          .send("Autenticação necessária para abrir o PGR.");
      if (ticket && ticket.workspaceId !== workspaceId)
        return res.status(403).send("Ticket inválido para este ambiente.");

      const userId = user?.id ?? ticket!.userId;
      const userRole = user?.role ?? ticket!.userRole;

      const requestedProjectId =
        ticket?.projectId ?? Number(req.query?.projectId);
      const [workspace, subscription, accessUser, project] = await Promise.all([
        getWorkspaceForUser(workspaceId, userId),
        getSubscriptionForUser(userId),
        getUserById(userId),
        Number.isInteger(requestedProjectId) && requestedProjectId > 0
          ? getPgrProjectForWorkspace(requestedProjectId, workspaceId)
          : Promise.resolve(undefined),
      ]);
      if (!workspace)
        return res.status(403).send("Você não possui acesso a este ambiente.");
      if (requestedProjectId && !project)
        return res.status(403).send("Projeto PGR inválido para este ambiente.");
      if (
        !canUsePaidApps({
          userRole: accessUser?.role ?? userRole,
          accessStatus: accessUser?.accessStatus,
          accessExpiresAt: accessUser?.accessExpiresAt,
          subscriptionStatus: subscription?.status,
        })
      ) {
        return res
          .status(402)
          .send("Uma assinatura ativa é necessária para usar o PGR Pro.");
      }

      const html = await getPgrHtml();
      res.set({
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
        "X-Frame-Options": "SAMEORIGIN",
      });
      return res.send(
        withPortalShell(
          html,
          workspaceId,
          project?.legacyStorageKey ?? "legacy"
        )
      );
    } catch (error) {
      console.error("[PGR] Falha ao abrir aplicativo legado", error);
      return res
        .status(500)
        .send("Não foi possível carregar o Gerador de PGR.");
    }
  });
}

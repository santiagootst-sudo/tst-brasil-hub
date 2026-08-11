// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import PgrFullscreenOverlay from "../client/src/components/PgrFullscreenOverlay";

let appRoot: Root | undefined;

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function renderOverlay(open: boolean, onClose = vi.fn(), onIframeLoad = vi.fn()) {
  const app = document.getElementById("test-root")!;
  appRoot ??= createRoot(app);
  act(() => {
    appRoot!.render(
      <PgrFullscreenOverlay
        open={open}
        projectName="PGR da Empresa"
        iframeSource="/api/apps/pgr/7?ticket=temporario"
        isAuthorizing={false}
        isIframeLoaded
        onClose={onClose}
        onIframeLoad={onIframeLoad}
      />,
    );
  });
  return { onClose, onIframeLoad };
}

afterEach(() => {
  if (appRoot) {
    act(() => appRoot?.unmount());
    appRoot = undefined;
  }
  document.body.innerHTML = "";
});

describe("PgrFullscreenOverlay", () => {
  it("monta, desmonta e remonta na raiz dedicada sem deixar nós órfãos", () => {
    document.body.innerHTML = '<div id="test-root"></div><div id="pgr-overlay-root"></div>';
    const portalRoot = document.getElementById("pgr-overlay-root")!;

    renderOverlay(true);
    expect(portalRoot.textContent).toContain("Gerador carregado");
    expect(portalRoot.querySelector("iframe")?.getAttribute("src")).toContain("ticket=temporario");

    renderOverlay(false);
    expect(portalRoot.childElementCount).toBe(0);

    renderOverlay(true);
    expect(portalRoot.textContent).toContain("PGR da Empresa");
    expect(portalRoot.querySelectorAll("iframe")).toHaveLength(1);
  });

  it("propaga os eventos de retorno e carregamento do iframe", () => {
    document.body.innerHTML = '<div id="test-root"></div><div id="pgr-overlay-root"></div>';
    const { onClose, onIframeLoad } = renderOverlay(true);
    const portalRoot = document.getElementById("pgr-overlay-root")!;

    act(() => portalRoot.querySelector("iframe")?.dispatchEvent(new Event("load", { bubbles: true })));
    act(() => (portalRoot.querySelector("button") as HTMLButtonElement).click());

    expect(onIframeLoad).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

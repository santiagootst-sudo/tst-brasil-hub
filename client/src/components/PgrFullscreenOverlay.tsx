import { ArrowLeft, BadgeCheck, CircleAlert, ExternalLink, Loader2 } from "lucide-react";
import React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

type PgrFullscreenOverlayProps = {
  open: boolean;
  projectName: string;
  iframeSource: string;
  isAuthorizing: boolean;
  isIframeLoaded: boolean;
  onClose: () => void;
  onIframeLoad: () => void;
};

export default function PgrFullscreenOverlay({
  open,
  projectName,
  iframeSource,
  isAuthorizing,
  isIframeLoaded,
  onClose,
  onIframeLoad,
}: PgrFullscreenOverlayProps) {
  if (!open || typeof document === "undefined") return null;
  const overlayRoot = document.getElementById("pgr-overlay-root");
  if (!overlayRoot) return null;

  return createPortal(
    <section aria-label={`PGR em tela cheia: ${projectName}`} translate="no" className="fixed inset-0 z-40 flex flex-col bg-[#edf5f3] lg:left-72">
      <header className="flex min-h-[4.75rem] shrink-0 flex-col justify-between gap-3 border-b border-[#d5e7e3] bg-white px-4 py-3 sm:flex-row sm:items-center sm:px-6">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#0c8c89]">PGR Pro integrado</p>
          <h2 className="truncate text-base font-bold text-[#102b32]">{projectName}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span aria-live="polite" className={`hidden items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold md:inline-flex ${isIframeLoaded ? "bg-[#e8f6f1] text-[#087463]" : "bg-[#fff6e8] text-[#a76127]"}`}>
            {isIframeLoaded ? <BadgeCheck className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
            {isIframeLoaded ? "Gerador carregado" : "Conectando gerador"}
          </span>
          {iframeSource && <a href={iframeSource} target="_blank" rel="noreferrer" className="hidden items-center gap-2 rounded-xl border border-[#c9dfda] px-3 py-2 text-xs font-bold text-[#0c7474] transition hover:bg-[#f2faf7] sm:inline-flex"><ExternalLink className="h-4 w-4" />Nova guia</a>}
          <Button type="button" variant="outline" onClick={onClose} className="h-9 rounded-xl border-[#c9dfda] bg-white px-3 text-xs font-bold text-[#0c7474]"><ArrowLeft className="mr-2 h-4 w-4" />Voltar à carteira</Button>
        </div>
      </header>
      <div className="min-h-0 flex-1 p-2 sm:p-3">
        {isAuthorizing ? (
          <div className="grid h-full min-h-[420px] place-items-center rounded-2xl bg-white"><Loader2 className="animate-spin text-[#0c7474]" /></div>
        ) : iframeSource ? (
          <iframe title={`Gerador de PGR — ${projectName}`} src={iframeSource} onLoad={onIframeLoad} className="h-full min-h-[420px] w-full rounded-2xl border border-[#cfe3de] bg-white shadow-xl" />
        ) : (
          <div className="grid h-full min-h-[420px] place-items-center rounded-2xl bg-white p-10 text-center"><div><CircleAlert className="mx-auto h-8 w-8 text-[#e98766]" /><h3 className="mt-4 text-xl font-bold">Não foi possível autorizar a abertura deste PGR.</h3><p className="mt-2 text-sm text-[#668087]">Atualize a página ou verifique o acesso da assinatura.</p></div></div>
        )}
      </div>
    </section>,
    overlayRoot,
  );
}

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pgrAppSource = readFileSync(resolve(process.cwd(), "client/src/pages/PgrApp.tsx"), "utf8");
const overlaySource = readFileSync(resolve(process.cwd(), "client/src/components/PgrFullscreenOverlay.tsx"), "utf8");

describe("abertura ampliada do PGR", () => {
  it("mantém o aplicativo em uma área fixa ao lado da navegação principal", () => {
    expect(overlaySource).toContain("fixed inset-0 z-40 flex flex-col bg-[#edf5f3] lg:left-72");
    expect(overlaySource).toContain("className=\"h-full min-h-[420px] w-full rounded-2xl");
  });

  it("emite um ticket novo somente quando o usuário abre o PGR ampliado", () => {
    expect(pgrAppSource).toContain("billing.data?.hasPaidAccess && isPgrFullscreen");
    expect(pgrAppSource).toContain("setIsPgrFullscreen(true);");
  });

  it("mantém uma saída para a carteira de empresas sem depender do retorno do iframe", () => {
    expect(overlaySource).toContain("Voltar à carteira");
    expect(pgrAppSource).toContain("setIsPgrFullscreen(false)");
  });

  it("torna observável quando o iframe do gerador concluiu o carregamento", () => {
    expect(pgrAppSource).toContain("const [isIframeLoaded, setIsIframeLoaded] = useState(false)");
    expect(pgrAppSource).toContain("onIframeLoad={() => {");
    expect(pgrAppSource).toContain("setIsIframeLoaded(true);");
    expect(pgrAppSource).toContain("tst-pgr-request-document-snapshot");
    expect(overlaySource).toContain("Gerador carregado");
  });

  it("monta a camada ampliada em uma raiz dedicada para não reconciliar sobre o conteúdo do portal", () => {
    expect(pgrAppSource).toContain("<PgrFullscreenOverlay");
    expect(pgrAppSource).toContain("open={Boolean(isPgrFullscreen && selectedProject)}");
  });
});

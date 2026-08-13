import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { certificateCatalog, certificateNrs, certificateDescription } from "../client/src/lib/certificateCatalog";
import { certificateWatermarkThemes, getCertificateWatermarkSvgDataUrl } from "../client/src/lib/certificateWatermark";

const generatorSource = readFileSync(resolve(process.cwd(), "client/src/components/CertificateGeneratorPanel.tsx"), "utf8");
const certificatesPageSource = readFileSync(resolve(process.cwd(), "client/src/pages/Certificates.tsx"), "utf8");

 describe("gerador de certificados NR integrado", () => {
  it("mantém as seis normas suportadas com cursos e conteúdo programático", () => {
    expect(certificateNrs).toEqual(["NR-05", "NR-10", "NR-15", "NR-20", "NR-33", "NR-35"]);
    for (const nr of certificateNrs) {
      expect(certificateCatalog[nr].courses.length).toBeGreaterThan(0);
      expect(certificateCatalog[nr].content.length).toBeGreaterThan(0);
      expect(certificateCatalog[nr].colors).toHaveLength(2);
    }
  });

  it("preserva as descrições específicas de cada norma", () => {
    expect(certificateDescription("NR-05", "8h")).toContain("CIPA");
    expect(certificateDescription("NR-10", "40h")).toContain("instalações elétricas");
    expect(certificateDescription("NR-15", "Conforme NR-15")).toContain("ruído ocupacional");
    expect(certificateDescription("NR-20", "8h")).toContain("inflamáveis");
    expect(certificateDescription("NR-33", "16h")).toContain("espaços confinados");
    expect(certificateDescription("NR-35", "8h")).toContain("trabalho em altura");
  });

  it("gera PDF frente e verso com QR Code opcional, marca d'água e logo", () => {
    expect(generatorSource).toContain('import QRCode from "qrcode"');
    expect(generatorSource).toContain('import { GState, jsPDF } from "jspdf"');
    expect(generatorSource).toContain('doc.addPage()');
    expect(generatorSource).toContain('const fileName = `Certificado_');
    expect(generatorSource).toContain("watermarkOpacity");
    expect(generatorSource).toContain("qrDataUrl");
    expect(generatorSource).toContain("logoDataUrl");
    expect(generatorSource).toContain("backgroundColor");
    expect(generatorSource).toContain("accentColor");
    expect(generatorSource).toContain("addPageBackground");
    expect(generatorSource).toContain('type="color"');
    expect(generatorSource).toContain("programContent");
    expect(generatorSource).toContain("Conteúdo programático mínimo sugerido");
    expect(generatorSource).toContain('setPreviewSide("back")');
    expect(generatorSource).toContain("Conteúdo prático sugerido");
    expect(generatorSource).toContain("signatureDataUrl");
    expect(generatorSource).toContain("Assinatura digital do instrutor");
    expect(generatorSource).toContain("TEMPLATE_STORAGE_KEY");
    expect(generatorSource).toContain("Salvar modelo");
    expect(generatorSource).toContain("previewQrDataUrl");
    expect(generatorSource).toContain("QR Code de validação na prévia");
  });

  it("mantém uma marca d'água temática e sincronizável para cada NR", () => {
    for (const nr of certificateNrs) {
      const theme = certificateWatermarkThemes[nr];
      const svg = getCertificateWatermarkSvgDataUrl(nr, theme.color, 0.12);
      expect(theme.label.length).toBeGreaterThan(0);
      expect(theme.description.length).toBeGreaterThan(0);
      expect(svg).toContain("data:image/svg+xml");
      expect(svg).toContain(encodeURIComponent(theme.color));
    }
    expect(certificateWatermarkThemes["NR-10"].kind).toBe("electricity");
    expect(certificateWatermarkThemes["NR-33"].kind).toBe("confined");
    expect(certificateWatermarkThemes["NR-35"].kind).toBe("height");
  });

  it("oferece prévia modal antes do download e arquivamento", () => {
    expect(generatorSource).toContain("DialogTitle");
    expect(generatorSource).toContain("Confira o certificado antes de baixar");
    expect(generatorSource).toContain("Pré-visualização do certificado em PDF");
    expect(generatorSource).toContain("handleDownloadPreview");
    expect(generatorSource).toContain("doc.output(\"blob\")");
    expect(generatorSource).toContain("Baixar PDF e salvar no acervo");
    expect(generatorSource).toContain("getCertificateWatermarkSvgDataUrl");
  });

  it("integra a emissão ao workspace ativo e permite salvar no acervo real", () => {
    expect(certificatesPageSource).toContain("<CertificateGeneratorPanel");
    expect(certificatesPageSource).toContain("workspaceName={activeWorkspace.name}");
    expect(certificatesPageSource).toContain("companies={activeWorkspaceDetail.data?.companies ?? []}");
    expect(certificatesPageSource).toContain("onPersist={persistGeneratedCertificate}");
    expect(certificatesPageSource).toContain("companyId: payload.companyId ?? undefined");
    expect(certificatesPageSource).toContain('category: "certificate"');
    expect(certificatesPageSource).toContain("utils.portal.certificates.invalidate");
    expect(certificatesPageSource).toContain("Histórico operacional");
    expect(certificatesPageSource).toContain("Baixar documento novamente");
    expect(certificatesPageSource).toContain("Reenviar");
    expect(generatorSource).toContain("companyId: number | null");
    expect(generatorSource).toContain("Vincular ao cliente");
  });
});

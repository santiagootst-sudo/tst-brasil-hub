import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { certificateCatalog, certificateNrs, certificateDescription } from "../client/src/lib/certificateCatalog";

const generatorSource = readFileSync(resolve(process.cwd(), "client/src/components/CertificateGeneratorPanel.tsx"), "utf8");
const certificatesPageSource = readFileSync(resolve(process.cwd(), "client/src/pages/Certificates.tsx"), "utf8");

 describe("gerador de certificados NR integrado", () => {
  it("mantém as cinco normas do HTML original com cursos e conteúdo programático", () => {
    expect(certificateNrs).toEqual(["NR-10", "NR-15", "NR-20", "NR-33", "NR-35"]);
    for (const nr of certificateNrs) {
      expect(certificateCatalog[nr].courses.length).toBeGreaterThan(0);
      expect(certificateCatalog[nr].content.length).toBeGreaterThan(0);
      expect(certificateCatalog[nr].colors).toHaveLength(2);
    }
  });

  it("preserva as descrições específicas de cada norma", () => {
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
    expect(generatorSource).toContain('doc.save(`Certificado_');
    expect(generatorSource).toContain("watermarkOpacity");
    expect(generatorSource).toContain("qrDataUrl");
    expect(generatorSource).toContain("logoDataUrl");
  });

  it("integra a emissão ao workspace ativo e permite salvar no acervo real", () => {
    expect(certificatesPageSource).toContain("<CertificateGeneratorPanel");
    expect(certificatesPageSource).toContain("workspaceName={activeWorkspace.name}");
    expect(certificatesPageSource).toContain("companies={activeWorkspaceDetail.data?.companies ?? []}");
    expect(certificatesPageSource).toContain("onPersist={persistGeneratedCertificate}");
    expect(certificatesPageSource).toContain("companyId: payload.companyId ?? undefined");
    expect(certificatesPageSource).toContain('category: "certificate"');
    expect(certificatesPageSource).toContain("utils.portal.certificates.invalidate");
    expect(generatorSource).toContain("companyId: number | null");
    expect(generatorSource).toContain("Vincular ao cliente");
  });
});

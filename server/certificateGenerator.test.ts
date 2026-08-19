import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  certificateCatalog,
  certificateDescription,
  certificateNrs,
  getCertificateWatermarkKey,
  getSuggestedPracticalContent,
  getSuggestedProgramContent,
} from "../client/src/lib/certificateCatalog";
import { certificateWatermarkThemes, certificateWatermarkVariants } from "../client/src/lib/certificateWatermark";

const generatorSource = readFileSync(resolve(process.cwd(), "client/src/components/CertificateGeneratorPanel.tsx"), "utf8");
const certificatesPageSource = readFileSync(resolve(process.cwd(), "client/src/pages/Certificates.tsx"), "utf8");

describe("gerador de certificados NR integrado", () => {
  it("mantém as normas suportadas com cursos, conteúdos e identidade visual", () => {
    expect(certificateNrs).toEqual(["NR-01", "NR-05", "NR-06", "NR-10", "NR-15", "NR-17", "NR-18", "NR-20", "NR-23", "NR-33", "NR-35"]);
    for (const nr of certificateNrs) {
      expect(certificateCatalog[nr].courses.length).toBeGreaterThan(0);
      expect(certificateCatalog[nr].content.length).toBeGreaterThan(0);
      expect(certificateCatalog[nr].colors).toHaveLength(2);
      expect(certificateWatermarkThemes[nr].assetUrl).toMatch(/^\/manus-storage\/certificate-watermark-nr/);
      expect(certificateWatermarkThemes[nr].assetUrl).toContain("?inline=1");
    }
  });

  it("preserva descrições coerentes com as capacitações cadastradas", () => {
    expect(certificateDescription("NR-01", "4h")).toContain("gerenciamento de riscos");
    expect(certificateDescription("NR-05", "8h")).toContain("CIPA");
    expect(certificateDescription("NR-06", "4h")).toContain("proteção individual");
    expect(certificateDescription("NR-10", "40h")).toContain("instalações elétricas");
    expect(certificateDescription("NR-15", "Conforme NR-15")).toContain("ruído ocupacional");
    expect(certificateDescription("NR-17", "4h")).toContain("ergonomia");
    expect(certificateDescription("NR-18", "16h")).toContain("indústria da construção");
    expect(certificateDescription("NR-20", "8h")).toContain("inflamáveis");
    expect(certificateDescription("NR-23", "4h")).toContain("incêndios");
    expect(certificateDescription("NR-33", "16h")).toContain("espaços confinados");
    expect(certificateDescription("NR-35", "8h")).toContain("trabalho em altura");
  });

  it("oferece conteúdo e marca d’água específicos para operação de equipamentos no contexto da NR-18", () => {
    const forklift = certificateCatalog["NR-18"].courses.find(course => course.name.includes("empilhadeira"));
    const crane = certificateCatalog["NR-18"].courses.find(course => course.name.includes("grua"));
    expect(forklift?.content?.some(item => item.includes("checklist diário"))).toBe(true);
    expect(crane?.content?.some(item => item.includes("cargas suspensas"))).toBe(true);
    expect(getCertificateWatermarkKey("NR-18", forklift?.name ?? "")).toBe("NR-18-EQUIPMENT");
    expect(getSuggestedProgramContent("NR-18", forklift?.name ?? "").length).toBeGreaterThan(6);
    expect(getSuggestedPracticalContent("NR-18", crane?.name ?? "").length).toBeGreaterThan(1);
    expect(certificateWatermarkThemes["NR-18-EQUIPMENT"].kind).toBe("equipment");
  });

  it("mantém imagens temáticas e quatro variações de marca d’água", () => {
    expect(certificateWatermarkThemes["NR-10"].kind).toBe("electricity");
    expect(certificateWatermarkThemes["NR-18"].kind).toBe("construction");
    expect(certificateWatermarkThemes["NR-23"].kind).toBe("fireProtection");
    expect(certificateWatermarkVariants.map(variant => variant.id)).toEqual(["photographic", "technical", "contour", "minimal"]);
    for (const variant of certificateWatermarkVariants) {
      expect(variant.description.length).toBeGreaterThan(20);
      expect(variant.imageOpacity).toBeGreaterThan(0);
      expect(variant.imageOpacity).toBeLessThanOrEqual(0.2);
    }
  });

  it("gera PDF frente e verso com escolha de curso, imagem temática e identidade visual", () => {
    expect(generatorSource).toContain('import { GState, jsPDF } from "jspdf"');
    expect(generatorSource).toContain("doc.addPage()");
    expect(generatorSource).toContain("watermarkOpacity");
    expect(generatorSource).toContain("getCertificateWatermarkKey");
    expect(generatorSource).toContain("getSuggestedPracticalContent");
    expect(generatorSource).toContain("handleCourseChange");
    expect(generatorSource).toContain("Conteúdo programático mínimo sugerido");
    expect(generatorSource).toContain("Conteúdo prático sugerido");
    expect(generatorSource).toContain("Assinatura digital do instrutor");
    expect(generatorSource).toContain("customWatermarkDataUrl");
    expect(generatorSource).toContain("handleCustomWatermark");
    expect(generatorSource).toContain("certificateWatermarkVariants.map");
    expect(generatorSource).toContain("Pré-visualização do certificado em PDF");
    expect(generatorSource).toContain("handleDownloadPreview");
    expect(generatorSource).toContain("doc.output(\"blob\")");
  });

  it("integra a emissão ao workspace ativo e permite salvar no acervo real", () => {
    expect(certificatesPageSource).toContain("<CertificateGeneratorPanel");
    expect(certificatesPageSource).toContain("workspaceId={activeWorkspace.id}");
    expect(certificatesPageSource).toContain("workspaceName={activeWorkspace.name}");
    expect(certificatesPageSource).toContain("companies={activeWorkspaceDetail.data?.companies ?? []}");
    expect(certificatesPageSource).toContain("onPersist={persistGeneratedCertificate}");
    expect(certificatesPageSource).toContain('category: "certificate"');
    expect(generatorSource).toContain("Vincular ao cliente");
    expect(generatorSource).toContain("Salvar identidade da empresa");
  });
});

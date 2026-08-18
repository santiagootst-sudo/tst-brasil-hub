import type { CertificateNr } from "./certificateCatalog";
import { publicAssetUrls } from "@shared/publicAssets";

export type CertificateWatermarkTheme = {
  nr: CertificateNr;
  label: string;
  eyebrow: string;
  description: string;
  color: string;
  assetUrl: string;
  kind: "cipa" | "electricity" | "noise" | "fire" | "confined" | "height";
};

export type CertificateWatermarkVariantId = "photographic" | "technical" | "contour" | "minimal";

export type CertificateWatermarkVariant = {
  id: CertificateWatermarkVariantId;
  label: string;
  description: string;
  helper: string;
  imageOpacity: number;
  overlayOpacity: number;
};

export const certificateWatermarkVariants: CertificateWatermarkVariant[] = [
  {
    id: "photographic",
    label: "Fotografia temática",
    description: "Imagem relacionada à NR ocupando a página inteira com leitura suave.",
    helper: "Mais expressiva",
    imageOpacity: 0.12,
    overlayOpacity: 0,
  },
  {
    id: "technical",
    label: "Painel técnico",
    description: "Fotografia concentrada em uma faixa lateral com linhas técnicas e acabamento editorial.",
    helper: "Equilíbrio entre imagem e dados",
    imageOpacity: 0.16,
    overlayOpacity: 0.08,
  },
  {
    id: "contour",
    label: "Contorno industrial",
    description: "Imagem centralizada com moldura de contorno e transparência reforçada para documentos formais.",
    helper: "Visual corporativo",
    imageOpacity: 0.09,
    overlayOpacity: 0.04,
  },
  {
    id: "minimal",
    label: "Fundo minimalista",
    description: "Selo visual discreto no centro da página, priorizando o conteúdo e a impressão econômica.",
    helper: "Máxima legibilidade",
    imageOpacity: 0.065,
    overlayOpacity: 0,
  },
];

export const certificateWatermarkThemes: Record<CertificateNr, CertificateWatermarkTheme> = {
  "NR-05": {
    nr: "NR-05",
    label: "CIPA e prevenção",
    eyebrow: "Prevenção coletiva",
    description: "Imagem editorial de colaboração e prevenção no ambiente de trabalho.",
    color: "#8c6f3d",
    assetUrl: publicAssetUrls.watermarkNr05,
    kind: "cipa",
  },
  "NR-10": {
    nr: "NR-10",
    label: "Eletricidade segura",
    eyebrow: "Energia e proteção",
    description: "Painel elétrico industrial e cabos protegidos em composição de baixa opacidade.",
    color: "#0c8c89",
    assetUrl: publicAssetUrls.watermarkNr10,
    kind: "electricity",
  },
  "NR-15": {
    nr: "NR-15",
    label: "Ruído ocupacional",
    eyebrow: "Medição e controle",
    description: "Medidor de nível sonoro e proteção auditiva para representar a avaliação ocupacional.",
    color: "#2b9a70",
    assetUrl: publicAssetUrls.watermarkNr15,
    kind: "noise",
  },
  "NR-20": {
    nr: "NR-20",
    label: "Inflamáveis",
    eyebrow: "Controle de energia",
    description: "Equipamentos de transferência e chama controlada em contexto industrial seguro.",
    color: "#d78343",
    assetUrl: publicAssetUrls.watermarkNr20,
    kind: "fire",
  },
  "NR-33": {
    nr: "NR-33",
    label: "Espaço confinado",
    eyebrow: "Acesso e resgate",
    description: "Acesso técnico, tripé de resgate e monitoramento atmosférico de espaço confinado.",
    color: "#c85e55",
    assetUrl: publicAssetUrls.watermarkNr33,
    kind: "confined",
  },
  "NR-35": {
    nr: "NR-35",
    label: "Trabalho em altura",
    eyebrow: "Ancoragem e resgate",
    description: "Trabalhador equipado e ancorado em estrutura industrial, com leitura visual segura.",
    color: "#3b72a4",
    assetUrl: publicAssetUrls.watermarkNr35,
    kind: "height",
  },
};

export function getCertificateWatermarkTheme(nr: CertificateNr) {
  return certificateWatermarkThemes[nr];
}

export function getCertificateWatermarkVariant(id: CertificateWatermarkVariantId) {
  return certificateWatermarkVariants.find(variant => variant.id === id) ?? certificateWatermarkVariants[0];
}

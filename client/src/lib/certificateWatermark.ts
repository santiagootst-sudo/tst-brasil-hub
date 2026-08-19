import type { CertificateNr, CertificateWatermarkKey } from "@/lib/certificateCatalog";

const inlineWatermarkUrl = (key: string) => `/manus-storage/${key}?inline=1`;

export type CertificateWatermarkTheme = {
  nr: CertificateWatermarkKey;
  label: string;
  eyebrow: string;
  description: string;
  color: string;
  assetUrl: string;
  kind: "management" | "cipa" | "epi" | "electricity" | "noise" | "ergonomics" | "construction" | "equipment" | "fire" | "fireProtection" | "confined" | "height";
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
  { id: "photographic", label: "Fotografia temática", description: "Imagem relacionada à capacitação ocupando a página inteira com leitura suave.", helper: "Mais expressiva", imageOpacity: 0.12, overlayOpacity: 0 },
  { id: "technical", label: "Painel técnico", description: "Fotografia concentrada em uma faixa lateral com linhas técnicas e acabamento editorial.", helper: "Equilíbrio entre imagem e dados", imageOpacity: 0.16, overlayOpacity: 0.08 },
  { id: "contour", label: "Contorno industrial", description: "Imagem centralizada com moldura de contorno e transparência reforçada para documentos formais.", helper: "Visual corporativo", imageOpacity: 0.09, overlayOpacity: 0.04 },
  { id: "minimal", label: "Fundo minimalista", description: "Selo visual discreto no centro da página, priorizando o conteúdo e a impressão econômica.", helper: "Máxima legibilidade", imageOpacity: 0.065, overlayOpacity: 0 },
];

export const certificateWatermarkThemes: Record<CertificateWatermarkKey, CertificateWatermarkTheme> = {
  "NR-01": { nr: "NR-01", label: "GRO e prevenção", eyebrow: "Gestão de riscos", description: "Profissional de SST em leitura de riscos e planejamento preventivo no ambiente de trabalho.", color: "#1b7a6e", assetUrl: inlineWatermarkUrl("certificate-watermark-nr01_469fac80.jpg"), kind: "management" },
  "NR-05": { nr: "NR-05", label: "CIPA e prevenção", eyebrow: "Prevenção coletiva", description: "Imagem editorial de colaboração e prevenção no ambiente de trabalho.", color: "#8c6f3d", assetUrl: inlineWatermarkUrl("certificate-watermark-nr05_c09495dd.jpg"), kind: "cipa" },
  "NR-06": { nr: "NR-06", label: "Proteção individual", eyebrow: "EPI e cuidado", description: "Verificação orientada de equipamentos de proteção individual antes da atividade.", color: "#346e87", assetUrl: inlineWatermarkUrl("certificate-watermark-nr06_16be9632.jpg"), kind: "epi" },
  "NR-10": { nr: "NR-10", label: "Eletricidade segura", eyebrow: "Energia e proteção", description: "Painel elétrico industrial e cabos protegidos em composição de baixa opacidade.", color: "#0c8c89", assetUrl: inlineWatermarkUrl("certificate-watermark-nr10_b040e9df.jpg"), kind: "electricity" },
  "NR-15": { nr: "NR-15", label: "Ruído ocupacional", eyebrow: "Medição e controle", description: "Medidor de nível sonoro e proteção auditiva para representar a avaliação ocupacional.", color: "#2b9a70", assetUrl: inlineWatermarkUrl("certificate-watermark-nr15_552a2d54.jpg"), kind: "noise" },
  "NR-17": { nr: "NR-17", label: "Ergonomia aplicada", eyebrow: "Conforto e organização", description: "Posto de trabalho ajustado e análise ergonômica em ambiente profissional.", color: "#6f5c9c", assetUrl: inlineWatermarkUrl("certificate-watermark-nr17_1123a518.jpg"), kind: "ergonomics" },
  "NR-18": { nr: "NR-18", label: "Construção segura", eyebrow: "Canteiro protegido", description: "Profissional de segurança em canteiro organizado, com medidas de prevenção visíveis.", color: "#b36a3a", assetUrl: inlineWatermarkUrl("certificate-watermark-nr18_5377cf1a.jpg"), kind: "construction" },
  "NR-18-EQUIPMENT": { nr: "NR-18-EQUIPMENT", label: "Movimentação segura", eyebrow: "Operação de equipamentos", description: "Operação de empilhadeira, guindaste e equipamentos de movimentação com controle de área.", color: "#496c83", assetUrl: inlineWatermarkUrl("certificate-watermark-nr11_9b136328.jpg"), kind: "equipment" },
  "NR-20": { nr: "NR-20", label: "Inflamáveis", eyebrow: "Controle de energia", description: "Equipamentos de transferência e chama controlada em contexto industrial seguro.", color: "#d78343", assetUrl: inlineWatermarkUrl("certificate-watermark-nr20_db15a211.jpg"), kind: "fire" },
  "NR-23": { nr: "NR-23", label: "Prevenção a incêndios", eyebrow: "Resposta inicial", description: "Equipamentos de combate e rota de fuga em um ambiente preparado para emergências.", color: "#b94b45", assetUrl: inlineWatermarkUrl("certificate-watermark-nr23_e9c95ca7.jpg"), kind: "fireProtection" },
  "NR-33": { nr: "NR-33", label: "Espaço confinado", eyebrow: "Acesso e resgate", description: "Acesso técnico, tripé de resgate e monitoramento atmosférico de espaço confinado.", color: "#c85e55", assetUrl: inlineWatermarkUrl("certificate-watermark-nr33_6aa5caf5.jpg"), kind: "confined" },
  "NR-35": { nr: "NR-35", label: "Trabalho em altura", eyebrow: "Ancoragem e resgate", description: "Trabalhador equipado e ancorado em estrutura industrial, com leitura visual segura.", color: "#3b72a4", assetUrl: inlineWatermarkUrl("certificate-watermark-nr35_3d8a561b.jpg"), kind: "height" },
};

export function getCertificateWatermarkTheme(key: CertificateWatermarkKey | CertificateNr) {
  return certificateWatermarkThemes[key];
}

export function getCertificateWatermarkVariant(id: CertificateWatermarkVariantId) {
  return certificateWatermarkVariants.find(variant => variant.id === id) ?? certificateWatermarkVariants[0];
}

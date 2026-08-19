const CLOUDINARY_CLOUD_NAME = "er2184wh";
const CLOUDINARY_UPLOAD_PRESET = "tst_brasil_hub_admin_uploads";
export const CONTENT_ASSET_MAX_BYTES = 10 * 1024 * 1024;

export type UploadedContentAsset = {
  url: string;
  fileName: string;
  mimeType: string;
  bytes: number;
};

export type UploadedCompanyLogo = Pick<UploadedContentAsset, "url" | "fileName" | "mimeType" | "bytes">;

function isSupportedContentAsset(file: File, kind: "cover" | "pdf") {
  if (kind === "cover") return file.type.startsWith("image/");
  return file.type === "application/pdf" || file.name.toLocaleLowerCase().endsWith(".pdf");
}

export async function uploadContentAsset(file: File, kind: "cover" | "pdf"): Promise<UploadedContentAsset> {
  if (!isSupportedContentAsset(file, kind)) {
    throw new Error(kind === "cover" ? "Selecione uma imagem de capa válida." : "Selecione um arquivo PDF válido.");
  }
  if (file.size > CONTENT_ASSET_MAX_BYTES) {
    throw new Error("O arquivo ultrapassa o limite de 10 MB permitido para este upload.");
  }

  const payload = new FormData();
  payload.append("file", file);
  payload.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  payload.append("context", `alt=${file.name}|caption=Material administrativo TST Brasil Hub`);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
    method: "POST",
    body: payload,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || typeof body.secure_url !== "string") {
    throw new Error(body?.error?.message || "Não foi possível enviar o arquivo para a biblioteca segura.");
  }

  return {
    url: body.secure_url,
    fileName: file.name,
    mimeType: file.type || (kind === "pdf" ? "application/pdf" : "image/*"),
    bytes: Number(body.bytes ?? file.size),
  };
}

export async function uploadPgrEvidenceAsset(file: File): Promise<UploadedContentAsset> {
  const isPdf = file.type === "application/pdf" || file.name.toLocaleLowerCase().endsWith(".pdf");
  const isImage = file.type.startsWith("image/");
  if (!isPdf && !isImage) {
    throw new Error("Envie um laudo ou certificado em PDF, PNG, JPEG ou WEBP.");
  }
  if (file.size > CONTENT_ASSET_MAX_BYTES) {
    throw new Error("O arquivo ultrapassa o limite de 10 MB permitido para anexos do PGR.");
  }

  const payload = new FormData();
  payload.append("file", file);
  payload.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  payload.append("context", `alt=${file.name}|caption=Evidência técnica vinculada a PGR no TST Brasil Hub`);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, { method: "POST", body: payload });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || typeof body.secure_url !== "string") {
    throw new Error(body?.error?.message || "Não foi possível enviar a evidência técnica do PGR.");
  }
  return {
    url: body.secure_url,
    fileName: file.name,
    mimeType: file.type || (isPdf ? "application/pdf" : "image/*"),
    bytes: Number(body.bytes ?? file.size),
  };
}

export async function uploadCompanyLogo(file: File): Promise<UploadedCompanyLogo> {
  const supported = ["image/png", "image/jpeg", "image/webp"].includes(file.type);
  if (!supported) throw new Error("Selecione um logo em PNG, JPEG ou WEBP.");
  if (file.size > 2_500_000) throw new Error("O logo deve ter no máximo 2,5 MB.");

  const payload = new FormData();
  payload.append("file", file);
  payload.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  payload.append("context", `alt=${file.name}|caption=Logo de empresa do TST Brasil Hub`);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: payload });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || typeof body.secure_url !== "string") throw new Error(body?.error?.message || "Não foi possível enviar o logo da empresa.");
  return { url: body.secure_url, fileName: file.name, mimeType: file.type, bytes: Number(body.bytes ?? file.size) };
}

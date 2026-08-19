import type { PgrDocumentAttachment } from "./pgrDocumentExport";

const MAX_INLINE_IMAGE_BYTES = 5 * 1024 * 1024;

function arrayBufferToDataUrl(buffer: ArrayBuffer, mimeType: string) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...Array.from(bytes.subarray(index, index + chunkSize)));
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

export async function hydratePgrImageAttachments<T extends { attachments?: PgrDocumentAttachment[] }>(input: T): Promise<T> {
  if (!input.attachments?.length) return input;
  const attachments = await Promise.all(input.attachments.map(async attachment => {
    if (attachment.inlineDataUrl || !attachment.fileUrl) return attachment;
    try {
      const response = await fetch(attachment.fileUrl);
      const mimeType = response.headers.get("content-type")?.split(";")[0].toLowerCase() ?? "";
      if (!response.ok || !mimeType.startsWith("image/")) return attachment;
      const buffer = await response.arrayBuffer();
      if (!buffer.byteLength || buffer.byteLength > MAX_INLINE_IMAGE_BYTES) return attachment;
      return { ...attachment, mimeType, inlineDataUrl: arrayBufferToDataUrl(buffer, mimeType) };
    } catch {
      return attachment;
    }
  }));
  return { ...input, attachments };
}

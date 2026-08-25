import { storagePut } from "server/storage";
import { ENV } from "./env";

const DEFAULT_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
const DEFAULT_IMAGE_QUALITY = "medium";

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
  model?: string;
  quality?: string;
};

export type GenerateImageResponse = {
  url?: string;
};

function assertImageApiConfigured() {
  if (!ENV.openAiApiKey) throw new Error("OPENAI_API_KEY is not configured");
  if (!ENV.openAiApiBase) throw new Error("OPENAI_API_BASE is not configured");
}

export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  assertImageApiConfigured();

  const response = await fetch(`${ENV.openAiApiBase}/images/generations`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${ENV.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: options.model ?? DEFAULT_IMAGE_MODEL,
      prompt: options.prompt,
      quality: options.quality ?? DEFAULT_IMAGE_QUALITY,
      size: "1024x1024",
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Image generation request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }

  const result = (await response.json()) as {
    data?: Array<{ b64_json?: string; url?: string }>;
  };
  const image = result.data?.[0];
  if (!image?.b64_json && !image?.url) {
    throw new Error("Image generation response did not contain an image");
  }

  if (image.url) return { url: image.url };

  const buffer = Buffer.from(image.b64_json!, "base64");
  const stored = await storagePut(
    `generated/${Date.now()}.png`,
    buffer,
    "image/png"
  );
  return { url: stored.url };
}

export type ImageModelInfo = {
  model?: string;
  id?: string;
};

export type ListImageModelsResponse = {
  models: ImageModelInfo[];
};

export async function listImageModels(): Promise<ListImageModelsResponse> {
  assertImageApiConfigured();
  return {
    models: [{ model: DEFAULT_IMAGE_MODEL, id: DEFAULT_IMAGE_MODEL }],
  };
}

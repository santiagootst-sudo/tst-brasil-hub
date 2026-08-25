import { ENV } from "./env";

export type DataApiCallOptions = {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  pathParams?: Record<string, unknown>;
  formData?: Record<string, unknown>;
};

/** Integração opcional com uma API de dados controlada pelo operador. */
export async function callDataApi(apiId: string, options: DataApiCallOptions = {}): Promise<unknown> {
  const baseUrl = process.env.EXTERNAL_DATA_API_URL?.replace(/\/+$/, "");
  const apiKey = process.env.EXTERNAL_DATA_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new Error("Optional data API is not configured");
  }

  const response = await fetch(`${baseUrl}/apis/${encodeURIComponent(apiId)}`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query: options.query,
      body: options.body,
      pathParams: options.pathParams,
      formData: options.formData,
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`External data API failed (${response.status})${detail ? `: ${detail}` : ""}`);
  }
  return response.json();
}

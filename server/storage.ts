import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

function getStorageClient() {
  if (
    !ENV.s3Endpoint ||
    !ENV.s3Bucket ||
    !ENV.s3AccessKeyId ||
    !ENV.s3SecretAccessKey
  ) {
    throw new Error(
      "Storage config missing: configure S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY"
    );
  }

  return {
    client: new S3Client({
      endpoint: ENV.s3Endpoint,
      region: ENV.s3Region,
      forcePathStyle: ENV.s3ForcePathStyle,
      credentials: {
        accessKeyId: ENV.s3AccessKeyId,
        secretAccessKey: ENV.s3SecretAccessKey,
      },
    }),
    bucket: ENV.s3Bucket,
  };
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const { client, bucket } = getStorageClient();
  const key = appendHashSuffix(normalizeKey(relKey));

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: typeof data === "string" ? Buffer.from(data) : data,
      ContentType: contentType,
    })
  );

  return { key, url: `/storage/${encodeURIComponent(key)}` };
}

export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/storage/${encodeURIComponent(key)}` };
}

export async function storageGetObject(
  relKey: string
): Promise<{ body: Buffer; contentType: string }> {
  const { client, bucket } = getStorageClient();
  const key = normalizeKey(relKey);
  const result = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  );
  if (!result.Body) throw new Error("Storage object has no body");
  const bytes = await result.Body.transformToByteArray();
  return {
    body: Buffer.from(bytes),
    contentType: result.ContentType ?? "application/octet-stream",
  };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const { client, bucket } = getStorageClient();
  const key = normalizeKey(relKey);
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 900 }
  );
}

async function storageDelete(relKey: string): Promise<void> {
  const { client, bucket } = getStorageClient();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: normalizeKey(relKey) }));
}

/**
 * Temporary production diagnostic. It is intentionally self-cleaning and returns
 * only non-sensitive metadata, never the object key or storage configuration.
 */
export async function runStorageRoundtripTest(): Promise<{
  ok: true;
  bytes: number;
  contentType: string;
}> {
  const relKey = `diagnostics/r2-roundtrip-${Date.now()}-${crypto.randomUUID()}.txt`;
  const body = "TST Brasil Hub R2 round-trip diagnostic.\n";
  const stored = await storagePut(relKey, body, "text/plain; charset=utf-8");

  try {
    const loaded = await storageGetObject(stored.key);
    const expected = Buffer.from(body);
    if (!loaded.body.equals(expected)) {
      throw new Error("R2 round-trip content mismatch");
    }
    return { ok: true, bytes: loaded.body.length, contentType: loaded.contentType };
  } finally {
    await storageDelete(stored.key);
  }
}

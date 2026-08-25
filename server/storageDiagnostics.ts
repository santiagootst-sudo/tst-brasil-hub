import type { Express, Request, Response } from "express";
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { ENV } from "./_core/env";

const DIAGNOSTIC_PATH = "/api/internal/storage-health";

/**
 * Temporary, read-only production diagnostic. It is inert unless
 * STORAGE_DIAGNOSTICS_TOKEN is configured and never returns credentials.
 */
export function registerStorageDiagnostics(app: Express) {
  const configuredToken = process.env.STORAGE_DIAGNOSTICS_TOKEN?.trim();
  if (!configuredToken) return;

  app.get(DIAGNOSTIC_PATH, async (req: Request, res: Response) => {
    if (req.get("x-storage-diagnostics-token") !== configuredToken) {
      res.status(404).json({ error: "not found" });
      return;
    }

    if (
      !ENV.s3Endpoint ||
      !ENV.s3Bucket ||
      !ENV.s3AccessKeyId ||
      !ENV.s3SecretAccessKey
    ) {
      res.status(503).json({ error: "storage not configured" });
      return;
    }

    try {
      const client = new S3Client({
        endpoint: ENV.s3Endpoint,
        region: ENV.s3Region,
        forcePathStyle: ENV.s3ForcePathStyle,
        credentials: {
          accessKeyId: ENV.s3AccessKeyId,
          secretAccessKey: ENV.s3SecretAccessKey,
        },
      });
      const result = await client.send(
        new ListObjectsV2Command({ Bucket: ENV.s3Bucket, MaxKeys: 1 })
      );
      res.json({
        ok: true,
        bucketConfigured: true,
        keyCountReturned: Number(result.KeyCount ?? 0),
      });
    } catch (error) {
      console.error(
        "[Storage diagnostics] read-only check failed:",
        error instanceof Error ? error.message : error
      );
      res.status(503).json({ error: "storage check failed" });
    }
  });
}

import type { Express } from "express";
import { legacyPublicAssetUrls } from "@shared/publicAssets";
import { ENV } from "./env";

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    const publicAssetUrl = legacyPublicAssetUrls[key];
    if (publicAssetUrl) {
      if (req.query.inline === "1") {
        try {
          const assetResponse = await fetch(publicAssetUrl);
          if (!assetResponse.ok) {
            res.status(502).send("Public asset backend error");
            return;
          }

          const contentType = assetResponse.headers.get("content-type") ?? "application/octet-stream";
          const bytes = Buffer.from(await assetResponse.arrayBuffer());
          res.set("Content-Type", contentType);
          res.set("Cache-Control", "public, max-age=31536000, immutable");
          res.send(bytes);
          return;
        } catch (err) {
          console.error("[StorageProxy] inline public asset failed:", err);
          res.status(502).send("Public asset proxy error");
          return;
        }
      }
      res.set("Cache-Control", "public, max-age=31536000, immutable");
      res.redirect(302, publicAssetUrl);
      return;
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

import type { Express } from "express";
import { legacyPublicAssetUrls } from "@shared/publicAssets";
import { storageGetObject, storageGetSignedUrl } from "../storage";

export function registerStorageProxy(app: Express) {
  const handler = async (req: any, res: any) => {
    const rawKey = (req.params as Record<string, string>)[0];
    const key = rawKey ? decodeURIComponent(rawKey) : "";
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    const legacyPublicAssetUrl = legacyPublicAssetUrls[key];
    if (legacyPublicAssetUrl) {
      res.set("Cache-Control", "public, max-age=31536000, immutable");
      res.redirect(302, legacyPublicAssetUrl);
      return;
    }

    try {
      if (req.query.inline === "1") {
        const object = await storageGetObject(key);
        res.set("Content-Type", object.contentType);
        res.set("Cache-Control", "private, max-age=900");
        res.send(object.body);
        return;
      }

      const signedUrl = await storageGetSignedUrl(key);
      res.set("Cache-Control", "private, no-store");
      res.redirect(307, signedUrl);
    } catch (error) {
      console.error("[StorageProxy] external storage failed:", error);
      res.status(502).send("Storage backend unavailable");
    }
  };

  app.get("/storage/*", handler);
  // Compatibilidade temporária para URLs gravadas antes da migração do Forge.
  app.get("/manus-storage/*", handler);
}

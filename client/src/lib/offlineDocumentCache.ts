export type OfflineDocument = {
  id: string;
  title: string;
  sourceUrl: string;
  savedAt: string;
  userId: number;
};

const CACHE_NAME = "tst-library-offline-v1";
const STORAGE_PREFIX = "tst-library-offline-documents-v1";

export function offlineDocumentsStorageKey(userId: number) {
  return `${STORAGE_PREFIX}:${userId}`;
}

function cacheRequest(userId: number, documentId: string) {
  return new Request(`${window.location.origin}/__tst_offline_documents__/${encodeURIComponent(userId)}/${encodeURIComponent(documentId)}`);
}

export function listOfflineDocuments(userId: number): OfflineDocument[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(offlineDocumentsStorageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistDocuments(userId: number, documents: OfflineDocument[]) {
  localStorage.setItem(offlineDocumentsStorageKey(userId), JSON.stringify(documents));
}

export async function saveDocumentOffline(input: Omit<OfflineDocument, "savedAt">) {
  if (typeof window === "undefined" || !("caches" in window)) {
    throw new Error("Este navegador não oferece cache offline.");
  }

  const response = await fetch(input.sourceUrl, { credentials: "omit" });
  if (!response.ok || response.type === "opaque") {
    throw new Error("O documento não permite uma cópia offline neste navegador.");
  }

  const cache = await caches.open(CACHE_NAME);
  await cache.put(cacheRequest(input.userId, input.id), response.clone());

  const savedAt = new Date().toISOString();
  const next = [
    { ...input, savedAt },
    ...listOfflineDocuments(input.userId).filter(document => document.id !== input.id),
  ];
  persistDocuments(input.userId, next);
  return next;
}

export async function removeOfflineDocument(userId: number, documentId: string) {
  if (typeof window !== "undefined" && "caches" in window) {
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(cacheRequest(userId, documentId));
  }
  const next = listOfflineDocuments(userId).filter(document => document.id !== documentId);
  persistDocuments(userId, next);
  return next;
}

export async function openOfflineDocument(userId: number, documentId: string) {
  if (typeof window === "undefined" || !("caches" in window)) return null;
  const cache = await caches.open(CACHE_NAME);
  const response = await cache.match(cacheRequest(userId, documentId));
  if (!response) return null;
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

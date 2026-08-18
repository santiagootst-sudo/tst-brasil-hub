import { describe, expect, it } from "vitest";
import { offlineDocumentsStorageKey } from "./offlineDocumentCache";

describe("offline document cache identifiers", () => {
  it("separa o índice de documentos offline entre técnicos", () => {
    expect(offlineDocumentsStorageKey(22)).toBe("tst-library-offline-documents-v1:22");
    expect(offlineDocumentsStorageKey(23)).not.toBe(offlineDocumentsStorageKey(22));
  });
});

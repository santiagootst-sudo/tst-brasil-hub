import { describe, expect, it } from "vitest";
import { offlineDocumentsStorageKey } from "../client/src/lib/offlineDocumentCache";

describe("Biblioteca offline", () => {
  it("mantém os índices de cache local separados para cada técnico", () => {
    expect(offlineDocumentsStorageKey(19080001)).toBe("tst-library-offline-documents-v1:19080001");
    expect(offlineDocumentsStorageKey(2)).not.toBe(offlineDocumentsStorageKey(19080001));
  });
});

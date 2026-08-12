import { describe, expect, it } from "vitest";
import {
  clearRememberedProfile,
  readRememberedProfile,
  rememberProfile,
  REMEMBERED_PROFILE_KEY,
} from "../client/src/lib/profilePreference";

function createStorage(initial?: Record<string, string>) {
  const values = new Map(Object.entries(initial ?? {}));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe("workspace profile preference", () => {
  it("reads only supported profile values", () => {
    const storage = createStorage({ [REMEMBERED_PROFILE_KEY]: "clt" });
    expect(readRememberedProfile(storage)).toBe("clt");

    const invalidStorage = createStorage({ [REMEMBERED_PROFILE_KEY]: "admin" });
    expect(readRememberedProfile(invalidStorage)).toBeNull();
  });

  it("persists and clears the optional selection", () => {
    const storage = createStorage();
    expect(rememberProfile(storage, "autonomo")).toBe(true);
    expect(readRememberedProfile(storage)).toBe("autonomo");
    expect(clearRememberedProfile(storage)).toBe(true);
    expect(readRememberedProfile(storage)).toBeNull();
  });

  it("does not block the screen when storage is unavailable", () => {
    const unavailable = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
      removeItem: () => { throw new Error("blocked"); },
    };

    expect(readRememberedProfile(unavailable)).toBeNull();
    expect(rememberProfile(unavailable, "clt")).toBe(false);
    expect(clearRememberedProfile(unavailable)).toBe(false);
  });
});

import { randomBytes, scryptSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { isCredentialHashFormat, verifyCredential } from "./db";

function makeHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

describe("credential hash parsing", () => {
  it("verifies the generated salt:digest format", () => {
    const password = "test-only-password";
    const stored = makeHash(password);

    expect(isCredentialHashFormat(stored)).toBe(true);
    expect(verifyCredential(password, stored)).toBe(true);
    expect(verifyCredential("wrong-password", stored)).toBe(false);
  });

  it("accepts harmless copy wrappers without accepting malformed hashes", () => {
    const password = "test-only-password";
    const stored = makeHash(password);

    expect(isCredentialHashFormat(`  '${stored}'  `)).toBe(true);
    expect(isCredentialHashFormat(`MASTER_ADMIN_PASSWORD_HASH=${stored}`)).toBe(true);
    expect(verifyCredential(password, `MASTER_ADMIN_PASSWORD_HASH=\"${stored}\"`)).toBe(true);
    expect(isCredentialHashFormat("plain-password")).toBe(false);
    expect(isCredentialHashFormat(`${stored}:extra`)).toBe(false);
  });
});

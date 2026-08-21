import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const operations = readFileSync(resolve(process.cwd(), "client/src/pages/Operations.tsx"), "utf8");

describe("ciência presencial de EPI", () => {
  it("remove o QR Code decorativo da tela de aceite presencial", () => {
    expect(operations).not.toContain('<QrCode className="w-full h-full text-[#102b32]"');
    expect(operations).not.toContain("Portal TST Mobile");
    expect(operations).toContain("Registro presencial complementar");
    expect(operations).toContain("Registrar ciência presencial");
  });

  it("reforça que ciência presencial não substitui a ficha física e o OTP", () => {
    expect(operations).toContain("Mantenha a ficha física assinada");
    expect(operations).toContain("confirmação por e-mail OTP");
    expect(operations).toContain("link verificável, o hash da ficha e a trilha auditável");
  });
});

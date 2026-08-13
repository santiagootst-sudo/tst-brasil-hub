import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/components/WhatsAppFloatingButton.tsx"), "utf8");

describe("botão discreto de suporte via WhatsApp", () => {
  it("mantém o acesso acessível sem balão textual expansivo", () => {
    expect(source).toContain('aria-label="Abrir suporte via WhatsApp"');
    expect(source).toContain('title="Abrir suporte via WhatsApp"');
    expect(source).toContain("h-11 w-11");
    expect(source).toContain("z-20");
    expect(source).not.toContain("Suporte WhatsApp</span>");
  });

  it("preserva o link de suporte configurado", () => {
    expect(source).toContain("https://wa.me/5554999097610");
    expect(source).toContain("target=\"_blank\"");
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/pages/AdminPanel.tsx"), "utf8");

describe("painel mestre de acessos", () => {
  it("oferece filtro de vencimentos, prazos de ativação e envio de credenciais por WhatsApp", () => {
    expect(source).toContain("Vencem em 7 dias");
    expect(source).toContain("12 meses");
    expect(source).toContain("Enviar no WhatsApp");
    expect(source).toContain("https://wa.me/");
  });
});

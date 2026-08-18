import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homePage = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

describe("CTA público de acesso", () => {
  it("abre o formulário de e-mail e senha mesmo quando existe uma sessão anterior", () => {
    expect(homePage).toContain("const enter = () => setIsLoginModalOpen(true);");
    expect(homePage).toContain('<LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />');
  });

  it("exibe os planos de lançamento e encaminha cada escolha ao WhatsApp", () => {
    expect(homePage).toContain('id="planos"');
    expect(homePage).toContain('R$ 69,90');
    expect(homePage).toContain('R$ 269,70');
    expect(homePage).toContain('R$ 898,80');
    expect(homePage).toContain('https://wa.me/5554999097610');
    expect(homePage).toContain('Quero o plano {plan.code}');
  });
});

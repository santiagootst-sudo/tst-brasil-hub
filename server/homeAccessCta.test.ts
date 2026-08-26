import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homePage = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
const landingSections = readFileSync(resolve(process.cwd(), "client/src/components/PortalLandingSections.tsx"), "utf8");

describe("CTA público de acesso", () => {
  it("abre o formulário de e-mail e senha mesmo quando existe uma sessão anterior", () => {
    expect(homePage).toContain("const enter = () => setIsLoginModalOpen(true);");
    expect(homePage).toContain('<LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />');
  });

  it("exibe os planos de lançamento e encaminha cada escolha ao WhatsApp", () => {
    expect(landingSections).toContain('id="planos"');
    expect(landingSections).toContain('R$ 69,90');
    expect(landingSections).toContain('R$ 269,70');
    expect(landingSections).toContain('R$ 898,80');
    expect(landingSections).toContain('https://wa.me/5554999097610');
    expect(landingSections).toContain('href={whatsAppUrl}');
    expect(landingSections).toContain('Quero o {title.toLowerCase()}');
  });
});

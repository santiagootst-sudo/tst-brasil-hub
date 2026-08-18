import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homePage = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

describe("CTA público de acesso", () => {
  it("abre o formulário de e-mail e senha mesmo quando existe uma sessão anterior", () => {
    expect(homePage).toContain("const enter = () => setIsLoginModalOpen(true);");
    expect(homePage).toContain('<LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />');
  });
});

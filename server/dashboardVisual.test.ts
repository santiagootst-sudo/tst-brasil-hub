import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/pages/WorkspaceOverview.tsx"), "utf8");

describe("direção visual do dashboard", () => {
  it("usa superfícies claras distintas para os contextos", () => {
    expect(source).toContain('color: "bg-[#eef8f5] border-[#cfe7df]"');
    expect(source).toContain('color: "bg-[#f1f7fc] border-[#d3e4f0]"');
  });

  it("mantém contraste explícito no título e nos indicadores", () => {
    expect(source).toContain("text-[#173b43]");
    expect(source).toContain("text-[#668087]");
    expect(source).toContain("bg-white/80");
  });

  it("evita a superfície tracejada no estado vazio principal", () => {
    expect(source).toContain("Escolha o ambiente para começar.");
    expect(source).not.toContain("border-dashed border-[#bddbd5]");
  });
});

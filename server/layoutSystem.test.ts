import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const component = readFileSync(resolve(process.cwd(), "client/src/components/ModulePageLayout.tsx"), "utf8");
const shell = readFileSync(resolve(process.cwd(), "client/src/components/DashboardLayout.tsx"), "utf8");
const library = readFileSync(resolve(process.cwd(), "client/src/pages/Library.tsx"), "utf8");
const inspections = readFileSync(resolve(process.cwd(), "client/src/pages/Inspections.tsx"), "utf8");
const operations = readFileSync(resolve(process.cwd(), "client/src/pages/Operations.tsx"), "utf8");
const trainings = readFileSync(resolve(process.cwd(), "client/src/pages/Trainings.tsx"), "utf8");
const certificates = readFileSync(resolve(process.cwd(), "client/src/pages/Certificates.tsx"), "utf8");
const cipa = readFileSync(resolve(process.cwd(), "client/src/pages/CipaAssistant.tsx"), "utf8");
const commercial = readFileSync(resolve(process.cwd(), "client/src/pages/Commercial.tsx"), "utf8");
const marketplace = readFileSync(resolve(process.cwd(), "client/src/pages/Marketplace.tsx"), "utf8");
const pgr = readFileSync(resolve(process.cwd(), "client/src/pages/PgrApp.tsx"), "utf8");
const organization = readFileSync(resolve(process.cwd(), "client/src/pages/Organization.tsx"), "utf8");
const administration = readFileSync(resolve(process.cwd(), "client/src/pages/AdminPanel.tsx"), "utf8");

describe("sistema visual de módulos", () => {
  it("oferece cabeçalho, superfícies e indicadores reutilizáveis", () => {
    expect(component).toContain("export function ModulePage");
    expect(component).toContain("export function ModuleHeader");
    expect(component).toContain("export function ModuleMetricCard");
    expect(component).toContain("export function ModuleSurface");
  });

  it("preserva a barra lateral e reduz o canvas para a linguagem compacta", () => {
    expect(shell).toContain("w-64");
    expect(shell).toContain("lg:pl-64");
    expect(shell).toContain("h-16");
    expect(shell).toContain("bg-[#f7f9fa]");
  });

  it("aplica a base compartilhada nos módulos prioritários", () => {
    [library, inspections, operations, trainings, certificates, cipa, commercial, marketplace, pgr, organization, administration].forEach(source => {
      expect(source).toContain('from "@/components/ModulePageLayout"');
      expect(source).toContain("<ModulePage");
      expect(source).toContain("<ModuleHeader");
    });
  });
});

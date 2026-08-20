import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
const navigation = readFileSync(resolve(process.cwd(), "client/src/components/DashboardLayout.tsx"), "utf8");
const riskMap = readFileSync(resolve(process.cwd(), "client/src/pages/RiskMap.tsx"), "utf8");

describe("Mapa de Risco", () => {
  it("publica a rota e o acesso no ambiente CLT", () => {
    expect(app).toContain('path="/app/mapa-risco" component={RiskMap}');
    expect(navigation).toContain('{ label: "Mapa de Risco", icon: MapPinned, path: "/app/mapa-risco" }');
  });

  it("oferece cadastro por setor e controle de evolução baseado em histórico", () => {
    expect(riskMap).toContain('"Mapa por setor"');
    expect(riskMap).toContain('"Cadastrar risco"');
    expect(riskMap).toContain('"Plano de controle"');
    expect(riskMap).toContain('"Histórico"');
    expect(riskMap).toContain('Gráfico de controle — índice de risco');
    expect(riskMap).toContain('createRisk.mutate');
    expect(riskMap).toContain('updateRisk.mutate');
    expect(riskMap).toContain('Limite de atenção');
    expect(riskMap).toContain('Meta de controle');
  });
});

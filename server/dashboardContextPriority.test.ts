import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const overviewSource = readFileSync(resolve(process.cwd(), "client/src/pages/WorkspaceOverview.tsx"), "utf8");
const layoutSource = readFileSync(resolve(process.cwd(), "client/src/components/DashboardLayout.tsx"), "utf8");

describe("prioridades contextuais dos ambientes", () => {
  it("ordena o dashboard Autônomo para carteira, entregas e atendimento", () => {
    expect(overviewSource).toContain("Carteira, entregas e clientes sob controle.");
    expect(overviewSource).toContain("Empresas na carteira");
    expect(overviewSource).toContain("Roteiro de atendimento");
    expect(overviewSource).toContain("Materiais de atendimento");
  });

  it("ordena o dashboard CLT para pessoas, conformidade e rotina interna", () => {
    expect(overviewSource).toContain("Pessoas, conformidade e rotina interna em foco.");
    expect(overviewSource).toContain("Capacitação da equipe");
    expect(overviewSource).toContain("Conformidade documental");
    expect(overviewSource).toContain("Roteiro de conformidade");
  });

  it("preserva ferramentas compartilhadas, mas muda o destaque da barra lateral", () => {
    expect(layoutSource).toContain("Rotina de atendimento");
    expect(layoutSource).toContain("Rotina de conformidade");
    expect(layoutSource).toContain("Biblioteca técnica");
    expect(layoutSource).toContain("Suporte");
  });
});

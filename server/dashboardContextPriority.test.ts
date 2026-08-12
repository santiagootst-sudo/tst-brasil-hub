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
    expect(overviewSource).toContain("Estrutura dos clientes");
  });

  it("ordena o dashboard CLT para pessoas, conformidade e rotina interna", () => {
    expect(overviewSource).toContain("Pessoas, conformidade e rotina interna em foco.");
    expect(overviewSource).toContain("Capacitação da equipe");
    expect(overviewSource).toContain("Conformidade documental");
    expect(overviewSource).toContain("Roteiro de conformidade");
    expect(overviewSource).toContain("Estrutura e equipe");
  });

  it("preserva ferramentas compartilhadas, mas muda o destaque da barra lateral", () => {
    expect(layoutSource).toContain("Rotina de atendimento");
    expect(layoutSource).toContain("Rotina de conformidade");
    expect(layoutSource).toContain("Biblioteca técnica");
    expect(layoutSource).toContain("Suporte");
  });

  it("deriva indicadores e prioridades de pessoas, setores e funções registradas", () => {
    expect(overviewSource).toContain("trpc.portal.organization.useQuery");
    expect(overviewSource).toContain("Pessoas ativas");
    expect(overviewSource).toContain("Setores ativos");
    expect(overviewSource).toContain("Funções ativas");
    expect(overviewSource).toContain("Completar os vínculos da equipe");
    expect(overviewSource).toContain("Mapear os setores da operação");
  });
});

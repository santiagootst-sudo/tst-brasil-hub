import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "client/src/pages/WorkspaceOverview.tsx"), "utf8");

describe("disponibilidade do ambiente no dashboard", () => {
  it("reserva o bloqueio de acesso para a consulta do próprio ambiente", () => {
    expect(source).toContain("const workspaceError = workspace.isError ? workspace.error : null;");
    expect(source).toContain("if (workspaceError) {");
  });

  it("não agrega falhas de módulos auxiliares como erro de autorização", () => {
    expect(source).not.toContain("const queryError = [workspace, certificates, trainings, organization, operations, planning, commercial]");
  });
});

import { describe, expect, it } from "vitest";
import { canManageWorkspace, canReadWorkspace } from "./workspaceAccess";

describe("workspace access", () => {
  it("permite leitura a todos os membros", () => {
    expect(canReadWorkspace("owner")).toBe(true);
    expect(canReadWorkspace("manager")).toBe(true);
    expect(canReadWorkspace("member")).toBe(true);
  });

  it("restringe alterações a proprietários e gestores", () => {
    expect(canManageWorkspace("owner")).toBe(true);
    expect(canManageWorkspace("manager")).toBe(true);
    expect(canManageWorkspace("member")).toBe(false);
    expect(canManageWorkspace(null)).toBe(false);
  });
});

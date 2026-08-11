import { describe, expect, it } from "vitest";
import { withWorkspaceContext, workspaceIdFromSearch } from "../shared/workspaceContext";

describe("workspaceContext", () => {
  it("aceita apenas identificadores positivos de ambiente", () => {
    expect(workspaceIdFromSearch("?workspace=60002")).toBe(60002);
    expect(workspaceIdFromSearch("workspace=7")).toBe(7);
    expect(workspaceIdFromSearch("?workspace=0")).toBeNull();
    expect(workspaceIdFromSearch("?workspace=abc")).toBeNull();
  });

  it("preserva o contexto de ambiente ao compor rotas internas", () => {
    expect(withWorkspaceContext("/app/pgr", 60002)).toBe("/app/pgr?workspace=60002");
    expect(withWorkspaceContext("/app/visao?tab=prioridades", 7)).toBe("/app/visao?tab=prioridades&workspace=7");
    expect(withWorkspaceContext("/app", null)).toBe("/app");
  });
});

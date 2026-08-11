import { describe, expect, it } from "vitest";
import { createPgrIframeTicket, verifyPgrIframeTicket } from "./pgrIframeTicket";

describe("pgr iframe ticket", () => {
  it("emite e valida um ticket com escopo de usuário, ambiente e projeto", async () => {
    const token = await createPgrIframeTicket({ userId: 11, workspaceId: 42, projectId: 7, userRole: "user" });
    await expect(verifyPgrIframeTicket(token)).resolves.toEqual({ userId: 11, workspaceId: 42, projectId: 7, userRole: "user" });
  });

  it("rejeita um ticket inválido", async () => {
    await expect(verifyPgrIframeTicket("token-invalido")).resolves.toBeNull();
  });
});

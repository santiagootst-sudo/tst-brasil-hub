import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Express, Request, Response } from "express";

const db = vi.hoisted(() => ({
  getSubscriptionForUser: vi.fn(),
  getWorkspaceForUser: vi.fn(),
}));
const sdk = vi.hoisted(() => ({ authenticateRequest: vi.fn() }));
const storage = vi.hoisted(() => ({ storageGetSignedUrl: vi.fn() }));

vi.mock("./db", () => db);
vi.mock("./_core/sdk", () => ({ sdk }));
vi.mock("./storage", () => storage);

import { registerPgrLegacyRoute } from "./pgrLegacyRoute";

type RouteHandler = (req: Request, res: Response) => Promise<unknown>;

function registerHandler(): RouteHandler {
  let handler: RouteHandler | undefined;
  const app = {
    get: vi.fn((_path: string, callback: RouteHandler) => { handler = callback; }),
  } as unknown as Express;
  registerPgrLegacyRoute(app);
  if (!handler) throw new Error("Rota do PGR não foi registrada.");
  return handler;
}

function createResponse() {
  const response = {
    status: vi.fn(),
    send: vi.fn(),
    set: vi.fn(),
  };
  response.status.mockReturnValue(response);
  response.set.mockReturnValue(response);
  return response as unknown as Response & { status: ReturnType<typeof vi.fn>; send: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn> };
}

function createRequest(workspaceId = "7") {
  return { params: { workspaceId } } as unknown as Request;
}

describe("rota protegida do PGR", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: vi.fn().mockResolvedValue("<html>PGR</html>") }));
  });

  it("responde 401 quando não há autenticação", async () => {
    sdk.authenticateRequest.mockRejectedValue(new Error("sem sessão"));
    const response = createResponse();
    await registerHandler()(createRequest(), response);
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.send).toHaveBeenCalledWith("Autenticação necessária para abrir o PGR.");
  });

  it("responde 403 quando o usuário não tem vínculo com o ambiente", async () => {
    sdk.authenticateRequest.mockResolvedValue({ id: 12, role: "user" });
    db.getWorkspaceForUser.mockResolvedValue(undefined);
    db.getSubscriptionForUser.mockResolvedValue({ status: "active" });
    const response = createResponse();
    await registerHandler()(createRequest(), response);
    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.send).toHaveBeenCalledWith("Você não possui acesso a este ambiente.");
  });

  it("responde 402 quando o usuário tem ambiente mas não possui assinatura ativa", async () => {
    sdk.authenticateRequest.mockResolvedValue({ id: 12, role: "user" });
    db.getWorkspaceForUser.mockResolvedValue({ id: 7, role: "member" });
    db.getSubscriptionForUser.mockResolvedValue({ status: "past_due" });
    const response = createResponse();
    await registerHandler()(createRequest(), response);
    expect(response.status).toHaveBeenCalledWith(402);
    expect(response.send).toHaveBeenCalledWith("Uma assinatura ativa é necessária para usar o PGR Pro.");
  });

  it("entrega o PGR quando o vínculo e a assinatura ativa são válidos", async () => {
    sdk.authenticateRequest.mockResolvedValue({ id: 12, role: "user" });
    db.getWorkspaceForUser.mockResolvedValue({ id: 7, role: "owner" });
    db.getSubscriptionForUser.mockResolvedValue({ status: "active" });
    storage.storageGetSignedUrl.mockResolvedValue("https://storage.example/pgr.html");
    const response = createResponse();
    await registerHandler()(createRequest(), response);
    expect(response.set).toHaveBeenCalledWith(expect.objectContaining({ "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store" }));
    expect(response.send).toHaveBeenCalledWith("<html>PGR</html>");
  });
});

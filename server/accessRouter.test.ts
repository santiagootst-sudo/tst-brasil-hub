import { describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ createAccessRequest: vi.fn() }));
vi.mock("./db", () => db);

import { accessRouter } from "./routers/accessRouter";

describe("accessRouter", () => {
  it("registra solicitação pública com os dados profissionais informados", async () => {
    db.createAccessRequest.mockResolvedValue({ id: 41, status: "requested" });
    const result = await accessRouter.createCaller({} as any).request({ fullName: "Ana Segurança", email: "ana@empresa.com", phone: "11999999999", companyName: "Empresa SST", jobTitle: "Técnica de Segurança" });
    expect(db.createAccessRequest).toHaveBeenCalledWith(expect.objectContaining({ email: "ana@empresa.com", fullName: "Ana Segurança" }));
    expect(result).toEqual({ id: 41, status: "requested", alreadyRequested: false });
  });
});

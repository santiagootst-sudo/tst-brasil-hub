import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  drizzle: vi.fn(),
  execute: vi.fn(),
}));

vi.mock("drizzle-orm/mysql2", () => ({
  drizzle: mocks.drizzle,
}));

vi.mock("./_core/env", () => ({
  ENV: {
    databaseUrl: "mysql://connection-test",
    ownerOpenId: "",
  },
}));

describe("validação de conexão do banco", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("valida SELECT 1 antes de armazenar a conexão em cache", async () => {
    mocks.execute.mockResolvedValue([{ ok: 1 }]);
    const candidate = { execute: mocks.execute };
    mocks.drizzle.mockReturnValue(candidate);
    const { getDb } = await import("./db");

    await expect(getDb()).resolves.toBe(candidate);
    await expect(getDb()).resolves.toBe(candidate);

    expect(mocks.drizzle).toHaveBeenCalledWith("mysql://connection-test");
    expect(mocks.execute).toHaveBeenCalledTimes(1);
  });

  it("recusa a conexão quando a validação inicial falha", async () => {
    mocks.execute.mockRejectedValue(new Error("connection refused"));
    mocks.drizzle.mockReturnValue({ execute: mocks.execute });
    const { getDb } = await import("./db");

    await expect(getDb()).resolves.toBeNull();
  });
});

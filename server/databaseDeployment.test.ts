import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("estratégia de schema em produção", () => {
  it("valida o schema sem emitir DDL incompatível contra um TiDB existente", () => {
    const packageJsonPath = resolve(process.cwd(), "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.["db:validate"]).toBe("drizzle-kit check");
    expect(packageJson.scripts?.["db:push"]).toBe("pnpm db:validate");
    expect(packageJson.scripts?.["db:migrate"]).toMatch(
      /^tsx scripts\/migrate-baseline\.ts && tsx scripts\/migrate-users\.ts/
    );
  });
});

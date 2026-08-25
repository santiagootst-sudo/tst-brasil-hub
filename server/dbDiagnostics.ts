import type { Express, Request, Response } from "express";
import mysql from "mysql2/promise";

const DIAGNOSTIC_PATH = "/api/internal/db-summary";
const COUNT_TABLES = [
  "users",
  "workspaces",
  "companies",
  "access_requests",
  "sessions",
  "inspections",
] as const;

type DbRow = Record<string, unknown>;

function asRecord(value: unknown): DbRow {
  return value && typeof value === "object" ? (value as DbRow) : {};
}

/**
 * Temporary, read-only production diagnostic. It is inert unless
 * DB_DIAGNOSTICS_TOKEN is configured and always returns aggregate metadata only.
 */
export function registerDbDiagnostics(app: Express) {
  const configuredToken = process.env.DB_DIAGNOSTICS_TOKEN?.trim();
  if (!configuredToken) return;

  app.get(DIAGNOSTIC_PATH, async (req: Request, res: Response) => {
    if (req.get("x-db-diagnostics-token") !== configuredToken) {
      res.status(404).json({ error: "not found" });
      return;
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      res.status(503).json({ error: "database not configured" });
      return;
    }

    let connection: mysql.Connection | undefined;
    try {
      connection = await mysql.createConnection(databaseUrl);
      const [identityRows] = await connection.query(
        "SELECT DATABASE() AS db, @@hostname AS host, @@port AS port"
      );
      const identity = asRecord((identityRows as DbRow[])[0]);

      const [tableRows] = await connection.query(
        "SELECT TABLE_NAME AS tableName FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME"
      );
      const tables = (tableRows as DbRow[])
        .map(row => String(row.tableName ?? ""))
        .filter(Boolean);
      const tableSet = new Set(tables);

      const counts: Record<string, number | null> = {};
      for (const table of COUNT_TABLES) {
        if (!tableSet.has(table)) {
          counts[table] = null;
          continue;
        }
        const [rows] = await connection.query(`SELECT COUNT(*) AS count FROM \`${table}\``);
        const row = asRecord((rows as DbRow[])[0]);
        counts[table] = Number(row.count ?? 0);
      }

      res.json({
        database: String(identity.db ?? ""),
        host: String(identity.host ?? ""),
        port: Number(identity.port ?? 0),
        tableCount: tables.length,
        tables,
        counts,
      });
    } catch (error) {
      console.error("[DB diagnostics] read-only check failed:", error instanceof Error ? error.message : error);
      res.status(503).json({ error: "database check failed" });
    } finally {
      await connection?.end().catch(() => undefined);
    }
  });
}

import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log("[migrate:pgr-ghes] DATABASE_URL não configurada; migração ignorada neste ambiente.");
  process.exit(0);
}

const connection = await mysql.createConnection(databaseUrl);

try {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS pgr_ghe_groups (
      id INT AUTO_INCREMENT PRIMARY KEY,
      workspaceId INT NOT NULL,
      companyId INT NOT NULL,
      pgrProjectId INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      dedupeKey VARCHAR(255) NOT NULL,
      description VARCHAR(1500) NULL,
      suggestedHazardsJson TEXT NULL,
      suggestedMeasuresJson TEXT NULL,
      employeeCount INT NOT NULL DEFAULT 0,
      source ENUM('manual','ai','imported') NOT NULL DEFAULT 'manual',
      createdByUserId INT NOT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY pgr_ghe_project_dedupe_unique (pgrProjectId, dedupeKey),
      INDEX pgr_ghe_workspace_idx (workspaceId),
      INDEX pgr_ghe_company_idx (companyId),
      INDEX pgr_ghe_project_idx (pgrProjectId)
    )
  `);

  console.log("[migrate:pgr-ghes] Tabela de GHEs do PGR verificada.");
} finally {
  await connection.end();
}

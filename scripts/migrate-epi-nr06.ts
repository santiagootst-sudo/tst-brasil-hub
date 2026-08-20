import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.log("[migrate:epi-nr06] DATABASE_URL não configurada; migração ignorada neste ambiente.");
  process.exit(0);
}

const connection = await mysql.createConnection(databaseUrl);

const columns: Array<[string, string]> = [
  ["epi_items", "manufacturer VARCHAR(160) NULL"],
  ["epi_items", "lotNumber VARCHAR(100) NULL"],
  ["epi_items", "caExpiresAt TIMESTAMP NULL"],
  ["epi_items", "equipmentExpiresAt TIMESTAMP NULL"],
  ["epi_items", "protectionDescription VARCHAR(1000) NULL"],
  ["epi_items", "limitations VARCHAR(1000) NULL"],
  ["epi_items", "careInstructions VARCHAR(1500) NULL"],
  ["epi_items", "manualUrl VARCHAR(2048) NULL"],
  ["epi_items", "requiresTraining BOOLEAN NOT NULL DEFAULT FALSE"],
  ["epi_deliveries", "deliveryReason ENUM('initial','scheduled_replacement','damage','loss','expiry','hygiene','other') NOT NULL DEFAULT 'initial'"],
  ["epi_deliveries", "sourceDeliveryId INT NULL"],
  ["epi_deliveries", "lotNumber VARCHAR(100) NULL"],
  ["epi_deliveries", "caNumber VARCHAR(64) NULL"],
  ["epi_deliveries", "manufacturer VARCHAR(160) NULL"],
  ["epi_deliveries", "protectionDescription VARCHAR(1000) NULL"],
  ["epi_deliveries", "limitations VARCHAR(1000) NULL"],
  ["epi_deliveries", "careInstructions VARCHAR(1500) NULL"],
  ["epi_deliveries", "conditionAtDelivery ENUM('new','sanitized','inspected') NOT NULL DEFAULT 'new'"],
  ["epi_deliveries", "orientationTopics VARCHAR(1000) NULL"],
  ["epi_deliveries", "orientationConfirmedAt TIMESTAMP NULL"],
  ["epi_deliveries", "trainingRequired BOOLEAN NOT NULL DEFAULT FALSE"],
  ["epi_deliveries", "trainingCompletedAt TIMESTAMP NULL"],
  ["epi_deliveries", "deliveredByName VARCHAR(255) NULL"],
  ["epi_deliveries", "receiptAcceptedAt TIMESTAMP NULL"],
  ["epi_deliveries", "receiptAcceptanceMethod ENUM('internal_confirmation','biometric','qualified_signature') NOT NULL DEFAULT 'internal_confirmation'"],
];

for (const [table, definition] of columns) {
  const columnName = definition.split(" ")[0];
  const [existing] = await connection.query<mysql.RowDataPacket[]>(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [columnName]);
  if (existing.length) continue;
  await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN ${definition}`);
}

for (const [table, indexName, columnsSql] of [
  ["epi_deliveries", "epi_deliveries_ca_lot_idx", "workspaceId, caNumber, lotNumber"],
  ["epi_deliveries", "epi_deliveries_source_idx", "workspaceId, sourceDeliveryId"],
] as const) {
  const [existing] = await connection.query<mysql.RowDataPacket[]>(`SHOW INDEX FROM \`${table}\` WHERE Key_name = ?`, [indexName]);
  if (!existing.length) await connection.query(`CREATE INDEX \`${indexName}\` ON \`${table}\` (${columnsSql})`);
}

await connection.end();
console.log("[migrate:epi-nr06] Catálogo e entregas de EPI atualizados para rastreabilidade NR-06.");

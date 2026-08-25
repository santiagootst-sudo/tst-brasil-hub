import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.log(
    "[migrate:epi-nr06] DATABASE_URL não configurada; migração ignorada neste ambiente."
  );
  process.exit(0);
}

const connection = await mysql.createConnection(databaseUrl);

// Some production databases were provisioned without the EPI baseline tables.
// Create only missing tables here; existing data and tables are preserved.
const baselineTables = [
  `CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspaceId INT NOT NULL,
    companyId INT NOT NULL,
    departmentId INT NULL,
    jobRoleId INT NULL,
    fullName VARCHAR(255) NOT NULL,
    cpf VARCHAR(24) NULL,
    email VARCHAR(320) NULL,
    status ENUM('active','inactive') NOT NULL DEFAULT 'active',
    hiredAt TIMESTAMP NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX employees_workspace_idx (workspaceId),
    INDEX employees_company_idx (companyId),
    INDEX employees_department_idx (departmentId),
    INDEX employees_job_role_idx (jobRoleId),
    INDEX employees_status_idx (workspaceId, status),
    INDEX employees_workspace_email_idx (workspaceId, email)
  )`,
  `CREATE TABLE IF NOT EXISTS epi_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspaceId INT NOT NULL,
    companyId INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    imageUrl VARCHAR(2048) NULL,
    responsibleName VARCHAR(255) NULL,
    renewalRequested BOOLEAN NOT NULL DEFAULT FALSE,
    caNumber VARCHAR(64) NULL,
    manufacturer VARCHAR(160) NULL,
    lotNumber VARCHAR(100) NULL,
    caExpiresAt TIMESTAMP NULL,
    equipmentExpiresAt TIMESTAMP NULL,
    protectionDescription VARCHAR(1000) NULL,
    limitations VARCHAR(1000) NULL,
    careInstructions VARCHAR(1500) NULL,
    manualUrl VARCHAR(2048) NULL,
    requiresTraining BOOLEAN NOT NULL DEFAULT FALSE,
    stockQuantity INT NOT NULL DEFAULT 0,
    minimumStock INT NOT NULL DEFAULT 0,
    expiresAt TIMESTAMP NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX epi_items_workspace_idx (workspaceId),
    INDEX epi_items_company_idx (companyId),
    INDEX epi_items_expiry_idx (workspaceId, expiresAt)
  )`,
  `CREATE TABLE IF NOT EXISTS epi_requirements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspaceId INT NOT NULL,
    companyId INT NOT NULL,
    jobRoleId INT NOT NULL,
    epiItemId INT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY epi_requirements_role_item_unique (jobRoleId, epiItemId),
    INDEX epi_requirements_workspace_idx (workspaceId),
    INDEX epi_requirements_company_idx (companyId)
  )`,
  `CREATE TABLE IF NOT EXISTS epi_deliveries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspaceId INT NOT NULL,
    companyId INT NOT NULL,
    epiItemId INT NOT NULL,
    employeeId INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    deliveryKind ENUM('initial','replacement') NOT NULL DEFAULT 'initial',
    deliveryReason ENUM('initial','scheduled_replacement','damage','loss','expiry','hygiene','other') NOT NULL DEFAULT 'initial',
    sourceDeliveryId INT NULL,
    deliveredAt TIMESTAMP NOT NULL,
    replacementDueAt TIMESTAMP NULL,
    lotNumber VARCHAR(100) NULL,
    caNumber VARCHAR(64) NULL,
    manufacturer VARCHAR(160) NULL,
    protectionDescription VARCHAR(1000) NULL,
    limitations VARCHAR(1000) NULL,
    careInstructions VARCHAR(1500) NULL,
    conditionAtDelivery ENUM('new','sanitized','inspected') NOT NULL DEFAULT 'new',
    orientationTopics VARCHAR(1000) NULL,
    orientationConfirmedAt TIMESTAMP NULL,
    trainingRequired BOOLEAN NOT NULL DEFAULT FALSE,
    trainingCompletedAt TIMESTAMP NULL,
    deliveredByName VARCHAR(255) NULL,
    receiptAcceptedAt TIMESTAMP NULL,
    receiptAcceptanceMethod ENUM('internal_confirmation','email_otp','biometric','qualified_signature') NOT NULL DEFAULT 'internal_confirmation',
    notes VARCHAR(1000) NULL,
    signedByName VARCHAR(255) NULL,
    digitalSignature VARCHAR(255) NULL,
    returnStatus ENUM('delivered','returned','replaced') NOT NULL DEFAULT 'delivered',
    createdByUserId INT NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX epi_deliveries_workspace_idx (workspaceId),
    INDEX epi_deliveries_company_idx (companyId),
    INDEX epi_deliveries_epi_idx (workspaceId, epiItemId),
    INDEX epi_deliveries_employee_idx (workspaceId, employeeId),
    INDEX epi_deliveries_replacement_idx (workspaceId, replacementDueAt),
    INDEX epi_deliveries_ca_lot_idx (workspaceId, caNumber, lotNumber),
    INDEX epi_deliveries_source_idx (workspaceId, sourceDeliveryId)
  )`,
];

for (const statement of baselineTables) await connection.execute(statement);

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
  [
    "epi_deliveries",
    "deliveryReason ENUM('initial','scheduled_replacement','damage','loss','expiry','hygiene','other') NOT NULL DEFAULT 'initial'",
  ],
  ["epi_deliveries", "sourceDeliveryId INT NULL"],
  ["epi_deliveries", "lotNumber VARCHAR(100) NULL"],
  ["epi_deliveries", "caNumber VARCHAR(64) NULL"],
  ["epi_deliveries", "manufacturer VARCHAR(160) NULL"],
  ["epi_deliveries", "protectionDescription VARCHAR(1000) NULL"],
  ["epi_deliveries", "limitations VARCHAR(1000) NULL"],
  ["epi_deliveries", "careInstructions VARCHAR(1500) NULL"],
  [
    "epi_deliveries",
    "conditionAtDelivery ENUM('new','sanitized','inspected') NOT NULL DEFAULT 'new'",
  ],
  ["epi_deliveries", "orientationTopics VARCHAR(1000) NULL"],
  ["epi_deliveries", "orientationConfirmedAt TIMESTAMP NULL"],
  ["epi_deliveries", "trainingRequired BOOLEAN NOT NULL DEFAULT FALSE"],
  ["epi_deliveries", "trainingCompletedAt TIMESTAMP NULL"],
  ["epi_deliveries", "deliveredByName VARCHAR(255) NULL"],
  ["epi_deliveries", "receiptAcceptedAt TIMESTAMP NULL"],
  [
    "epi_deliveries",
    "receiptAcceptanceMethod ENUM('internal_confirmation','biometric','qualified_signature') NOT NULL DEFAULT 'internal_confirmation'",
  ],
];

for (const [table, definition] of columns) {
  const columnName = definition.split(" ")[0];
  const [existing] = await connection.query<mysql.RowDataPacket[]>(
    `SHOW COLUMNS FROM \`${table}\` LIKE ?`,
    [columnName]
  );
  if (existing.length) continue;
  await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN ${definition}`);
}

for (const [table, indexName, columnsSql] of [
  [
    "epi_deliveries",
    "epi_deliveries_ca_lot_idx",
    "workspaceId, caNumber, lotNumber",
  ],
  [
    "epi_deliveries",
    "epi_deliveries_source_idx",
    "workspaceId, sourceDeliveryId",
  ],
] as const) {
  const [existing] = await connection.query<mysql.RowDataPacket[]>(
    `SHOW INDEX FROM \`${table}\` WHERE Key_name = ?`,
    [indexName]
  );
  if (!existing.length)
    await connection.query(
      `CREATE INDEX \`${indexName}\` ON \`${table}\` (${columnsSql})`
    );
}

await connection.end();
console.log(
  "[migrate:epi-nr06] Catálogo e entregas de EPI atualizados para rastreabilidade NR-06."
);

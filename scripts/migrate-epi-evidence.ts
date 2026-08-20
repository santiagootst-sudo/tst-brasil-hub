import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.log("[migrate:epi-evidence] DATABASE_URL não configurada; migração ignorada neste ambiente.");
  process.exit(0);
}

const connection = await mysql.createConnection(databaseUrl);

async function addColumnIfMissing(table: string, definition: string) {
  const columnName = definition.split(" ")[0]!;
  const [existing] = await connection.query<mysql.RowDataPacket[]>(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [columnName]);
  if (!existing.length) await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN ${definition}`);
}

async function addIndexIfMissing(table: string, indexName: string, columnsSql: string) {
  const [existing] = await connection.query<mysql.RowDataPacket[]>(`SHOW INDEX FROM \`${table}\` WHERE Key_name = ?`, [indexName]);
  if (!existing.length) await connection.query(`CREATE INDEX \`${indexName}\` ON \`${table}\` (${columnsSql})`);
}

await addColumnIfMissing("employees", "email VARCHAR(320) NULL");
await addIndexIfMissing("employees", "employees_workspace_email_idx", "workspaceId, email");

const [receiptMethod] = await connection.query<mysql.RowDataPacket[]>("SHOW COLUMNS FROM `epi_deliveries` LIKE 'receiptAcceptanceMethod'");
if (receiptMethod.length) {
  await connection.query("ALTER TABLE `epi_deliveries` MODIFY COLUMN `receiptAcceptanceMethod` ENUM('internal_confirmation','email_otp','biometric','qualified_signature') NOT NULL DEFAULT 'internal_confirmation'");
}

await connection.query(`CREATE TABLE IF NOT EXISTS epi_delivery_evidence (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspaceId INT NOT NULL,
  companyId INT NOT NULL,
  deliveryId INT NOT NULL UNIQUE,
  employeeId INT NOT NULL,
  recipientEmail VARCHAR(320) NOT NULL,
  status ENUM('draft','sent','viewed','confirmed','expired','revoked','failed') NOT NULL DEFAULT 'draft',
  verificationCode VARCHAR(64) NOT NULL UNIQUE,
  documentHash VARCHAR(64) NOT NULL,
  documentVersion VARCHAR(32) NOT NULL DEFAULT 'nr06-otp-v1',
  snapshotJson TEXT NOT NULL,
  otpHash VARCHAR(255) NOT NULL,
  otpExpiresAt TIMESTAMP NOT NULL,
  otpAttempts INT NOT NULL DEFAULT 0,
  lastSentAt TIMESTAMP NULL,
  lastViewedAt TIMESTAMP NULL,
  confirmedAt TIMESTAMP NULL,
  confirmationIpHash VARCHAR(64) NULL,
  confirmationUserAgent VARCHAR(512) NULL,
  providerMessageId VARCHAR(160) NULL,
  failureReason VARCHAR(500) NULL,
  createdByUserId INT NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX epi_delivery_evidence_workspace_idx (workspaceId, status, createdAt),
  INDEX epi_delivery_evidence_company_idx (companyId, status),
  INDEX epi_delivery_evidence_employee_idx (workspaceId, employeeId)
)`);

await connection.query(`CREATE TABLE IF NOT EXISTS epi_delivery_audit_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  evidenceId INT NOT NULL,
  workspaceId INT NOT NULL,
  companyId INT NOT NULL,
  deliveryId INT NOT NULL,
  eventType ENUM('evidence_created','email_sent','email_failed','link_opened','otp_failed','otp_verified','receipt_confirmed','evidence_expired','evidence_revoked','support_viewed') NOT NULL,
  actorType ENUM('manager','employee','system','support') NOT NULL,
  actorUserId INT NULL,
  description VARCHAR(1000) NOT NULL,
  metadataJson TEXT NULL,
  previousHash VARCHAR(64) NULL,
  eventHash VARCHAR(64) NOT NULL UNIQUE,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX epi_delivery_audit_evidence_idx (evidenceId, createdAt),
  INDEX epi_delivery_audit_workspace_idx (workspaceId, companyId, createdAt)
)`);

await connection.end();
console.log("[migrate:epi-evidence] Estrutura de confirmação OTP e auditoria de entrega de EPI atualizada.");

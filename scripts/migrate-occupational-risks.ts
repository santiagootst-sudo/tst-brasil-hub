import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log(
    "[migrate:occupational-risks] DATABASE_URL não configurada; migração ignorada neste ambiente."
  );
  process.exit(0);
}

const connection = await mysql.createConnection(databaseUrl);

const statements = [
  // These two tables are part of the baseline schema, but some existing TiDB
  // databases were provisioned before the inspection module was introduced.
  // Keep the bootstrap idempotent so this script can repair those databases
  // without replaying the historical Drizzle migration chain.
  `CREATE TABLE IF NOT EXISTS inspections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspaceId INT NOT NULL,
    companyId INT NOT NULL,
    departmentId INT NULL,
    templateId INT NULL,
    occupationalRiskId INT NULL,
    title VARCHAR(255) NOT NULL,
    dueAt TIMESTAMP NULL,
    completedAt TIMESTAMP NULL,
    notes VARCHAR(1500) NULL,
    status ENUM('planned','completed') NOT NULL DEFAULT 'planned',
    createdByUserId INT NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX inspections_workspace_idx (workspaceId),
    INDEX inspections_company_idx (companyId),
    INDEX inspections_status_idx (workspaceId, status),
    INDEX inspections_due_at_idx (workspaceId, dueAt),
    INDEX inspections_occupational_risk_idx (occupationalRiskId)
  )`,
  `CREATE TABLE IF NOT EXISTS action_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspaceId INT NOT NULL,
    companyId INT NOT NULL,
    inspectionId INT NULL,
    occupationalRiskId INT NULL,
    departmentId INT NULL,
    responsibleEmployeeId INT NULL,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(1500) NULL,
    dueAt TIMESTAMP NULL,
    status ENUM('open','in_progress','completed') NOT NULL DEFAULT 'open',
    createdByUserId INT NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX action_items_workspace_idx (workspaceId),
    INDEX action_items_company_idx (companyId),
    INDEX action_items_status_idx (workspaceId, status),
    INDEX action_items_due_at_idx (workspaceId, dueAt),
    INDEX action_items_occupational_risk_idx (occupationalRiskId)
  )`,
  `CREATE TABLE IF NOT EXISTS occupational_risks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspaceId INT NOT NULL,
    companyId INT NOT NULL,
    pgrProjectId INT NULL,
    departmentId INT NULL,
    jobRoleId INT NULL,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(1500) NULL,
    riskGroup ENUM('physical','chemical','biological','ergonomic','accident','psychosocial','other') NOT NULL,
    source ENUM('pgr','inspection','combined') NOT NULL DEFAULT 'pgr',
    inherentProbability INT NOT NULL,
    inherentSeverity INT NOT NULL,
    inherentScore INT NOT NULL,
    residualProbability INT NULL,
    residualSeverity INT NULL,
    residualScore INT NULL,
    situation ENUM('identified','in_treatment','controlled','eliminated') NOT NULL DEFAULT 'identified',
    controls VARCHAR(1500) NULL,
    exposedWorkersCount INT NOT NULL DEFAULT 0,
    identifiedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    controlVerifiedAt TIMESTAMP NULL,
    eliminatedAt TIMESTAMP NULL,
    lastInspectionId INT NULL,
    createdByUserId INT NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX occupational_risks_workspace_idx (workspaceId, situation),
    INDEX occupational_risks_company_idx (companyId, departmentId),
    INDEX occupational_risks_pgr_idx (pgrProjectId)
  )`,
  `CREATE TABLE IF NOT EXISTS occupational_risk_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    occupationalRiskId INT NOT NULL,
    workspaceId INT NOT NULL,
    companyId INT NOT NULL,
    departmentId INT NULL,
    eventType ENUM('identified','treatment_started','control_verified','reduced','eliminated','reopened') NOT NULL,
    previousSituation VARCHAR(64) NULL,
    nextSituation VARCHAR(64) NULL,
    previousScore INT NULL,
    nextScore INT NULL,
    notes VARCHAR(1500) NULL,
    occurredAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdByUserId INT NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX occupational_risk_events_risk_idx (occupationalRiskId, occurredAt),
    INDEX occupational_risk_events_workspace_idx (workspaceId, occurredAt)
  )`,
  `ALTER TABLE inspections ADD COLUMN occupationalRiskId INT NULL`,
  `ALTER TABLE action_items ADD COLUMN occupationalRiskId INT NULL`,
  `CREATE INDEX inspections_occupational_risk_idx ON inspections (occupationalRiskId)`,
  `CREATE INDEX action_items_occupational_risk_idx ON action_items (occupationalRiskId)`,
];

for (const statement of statements) {
  try {
    await connection.execute(statement);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "ER_DUP_FIELDNAME" || code === "ER_DUP_KEYNAME") continue;
    throw error;
  }
}

await connection.end();
console.log(
  "[migrate:occupational-risks] Estrutura de riscos ocupacionais atualizada."
);

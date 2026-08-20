import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log("[migrate:accidents] DATABASE_URL não configurada; migração ignorada neste ambiente.");
  process.exit(0);
}

const connection = await mysql.createConnection(databaseUrl);

const statements = [
  `CREATE TABLE IF NOT EXISTS accident_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    occurrenceId INT NOT NULL,
    workspaceId INT NOT NULL,
    companyId INT NOT NULL,
    departmentId INT NULL,
    employeeId INT NULL,
    occupationalRiskId INT NULL,
    inspectionId INT NULL,
    accidentNature ENUM('typical','commuting','occupational_disease','other') NOT NULL DEFAULT 'typical',
    accidentType VARCHAR(160) NULL,
    injuryAgent VARCHAR(255) NULL,
    esocialAgentCode VARCHAR(64) NULL,
    characterization VARCHAR(160) NULL,
    medicalTreatment VARCHAR(255) NULL,
    daysAway INT NOT NULL DEFAULT 0,
    catNumber VARCHAR(64) NULL,
    severity ENUM('minor','moderate','serious','critical') NOT NULL DEFAULT 'minor',
    immediateActions TEXT NULL,
    immediateCause TEXT NULL,
    rootCause TEXT NULL,
    createdByUserId INT NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY accident_details_occurrence_unique (occurrenceId),
    INDEX accident_details_workspace_idx (workspaceId, severity),
    INDEX accident_details_company_idx (companyId, departmentId),
    INDEX accident_details_risk_idx (occupationalRiskId)
  )`,
  `CREATE TABLE IF NOT EXISTS accident_injuries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    accidentDetailId INT NOT NULL,
    occurrenceId INT NOT NULL,
    workspaceId INT NOT NULL,
    bodyRegion ENUM('head','face','neck','shoulder_left','shoulder_right','chest','abdomen','back','pelvis','arm_left','arm_right','forearm_left','forearm_right','hand_left','hand_right','finger_left','finger_right','thigh_left','thigh_right','knee_left','knee_right','leg_left','leg_right','ankle_left','ankle_right','foot_left','foot_right','other') NOT NULL,
    bodySide ENUM('left','right','center','not_applicable') NOT NULL DEFAULT 'not_applicable',
    lesionType VARCHAR(160) NOT NULL,
    severity ENUM('minor','moderate','serious','critical') NOT NULL DEFAULT 'minor',
    notes VARCHAR(1000) NULL,
    sortOrder INT NOT NULL DEFAULT 0,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX accident_injuries_detail_idx (accidentDetailId, sortOrder),
    INDEX accident_injuries_occurrence_idx (occurrenceId),
    INDEX accident_injuries_workspace_region_idx (workspaceId, bodyRegion)
  )`,
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
console.log("[migrate:accidents] Estrutura de acidentes e lesões atualizada.");

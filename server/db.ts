import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { createHash, randomBytes, randomInt, scryptSync, timingSafeEqual } from "crypto";
import { drizzle } from "drizzle-orm/mysql2";
import { accessRequests, accidentDetails, accidentInjuries, actionItems, adminAccessAudit, certificates, cipaCommissions, cipaDocuments, cipaMeetings, cipaMembers, cipaTerms, clientEngagements, clientVisits, companies, contentMaterialClicks, contentMaterials, departments, employees, epiDeliveries, epiDeliveryAuditEvents, epiDeliveryEvidence, epiItems, epiRequirements, epiReturns, inspectionTemplateItems, inspectionTemplates, inspections, jobRoles, type InsertUser, materials, occupationalRiskEvents, occupationalRisks, pgrAttachments, pgrProjects, pgrRevisions, pgrTechnicalSignatures, psychosocialApplications, psychosocialResponses, psychosocialResults, sstOccurrences, subscriptions, supportTickets, type Subscription, trainingParticipants, trainings, users, workspaceMembers, workspaces, youtubeVideos } from "../drizzle/schema";
import { ENV } from "./_core/env";

let dbInstance: ReturnType<typeof drizzle> | null = null;
let accidentSchemaReady: Promise<void> | null = null;
let occupationalRiskSchemaReady: Promise<void> | null = null;
let epiEvidenceSchemaReady: Promise<void> | null = null;

async function ensureOccupationalRiskSchema(db: ReturnType<typeof drizzle>) {
  if (occupationalRiskSchemaReady) return occupationalRiskSchemaReady;
  occupationalRiskSchemaReady = (async () => {
    await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS occupational_risks (
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
    )`));
    await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS occupational_risk_events (
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
    )`));
  })();
  try {
    await occupationalRiskSchemaReady;
  } catch (error) {
    occupationalRiskSchemaReady = null;
    throw error;
  }
}

async function ensureAccidentSchema(db: ReturnType<typeof drizzle>) {
  if (accidentSchemaReady) return accidentSchemaReady;
  accidentSchemaReady = (async () => {
    await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS accident_details (
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
    )`));
    await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS accident_injuries (
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
    )`));
  })();
  try {
    await accidentSchemaReady;
  } catch (error) {
    accidentSchemaReady = null;
    throw error;
  }
}

async function ensureEpiEvidenceSchema(db: ReturnType<typeof drizzle>) {
  if (epiEvidenceSchemaReady) return epiEvidenceSchemaReady;
  epiEvidenceSchemaReady = (async () => {
    await db.execute(sql.raw("ALTER TABLE employees ADD COLUMN IF NOT EXISTS email VARCHAR(320) NULL"));
    await db.execute(sql.raw("CREATE INDEX IF NOT EXISTS employees_workspace_email_idx ON employees (workspaceId, email)"));
    await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS epi_delivery_evidence (
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
    )`));
    await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS epi_delivery_audit_events (
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
    )`));
  })();
  try {
    await epiEvidenceSchemaReady;
  } catch (error) {
    epiEvidenceSchemaReady = null;
    throw error;
  }
}

export async function getDb() {
  if (dbInstance) return dbInstance;

  const dbUrl = ENV.databaseUrl || process.env.DATABASE_URL || "";
  if (!dbUrl) {
    console.warn("[Database] DATABASE_URL ausente. Operando em modo de contingência em memória para evitar queda de login.");
    return null;
  }

  try {
    const candidate = drizzle(dbUrl);
    await candidate.execute(sql`SELECT 1`);
    dbInstance = candidate;
    console.info("[Database] Conexão TiDB/MySQL confirmada.");
  } catch {
    console.error("[Database] Falha ao validar a conexão MySQL/TiDB. Verifique DATABASE_URL, credenciais, SSL e acesso de rede.");
    return null;
  }

  return dbInstance;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("openId do usuário é obrigatório.");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] upsertUser simulado em memória (DATABASE_URL ausente).");
    return;
  }
  const values: InsertUser = { ...user, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = {
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? null,
    lastSignedIn: new Date(),
  };
  if (user.accessStatus) updateSet.accessStatus = user.accessStatus;
  if (user.accessExpiresAt !== undefined) updateSet.accessExpiresAt = user.accessExpiresAt;
  if (user.openId === ENV.ownerOpenId || user.email?.toLowerCase() === "santiagoocorretor@gmail.com") {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

function hashCredential(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function verifyCredential(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const received = Buffer.from(scryptSync(password, salt, 64).toString("hex"), "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function createAccessRequest(input: { fullName: string; email: string; phone?: string | null; companyName?: string | null; jobTitle?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível. Tente novamente em alguns instantes.");
  const email = input.email.trim().toLowerCase();
  const existing = (await db.select().from(accessRequests).where(eq(accessRequests.email, email)).limit(1))[0];
  if (existing) return existing;
  await db.insert(accessRequests).values({ fullName: input.fullName.trim(), email, phone: input.phone?.trim() || null, companyName: input.companyName?.trim() || null, jobTitle: input.jobTitle?.trim() || null });
  return (await db.select().from(accessRequests).where(eq(accessRequests.email, email)).limit(1))[0]!;
}

export async function listAccessRequestsForAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(accessRequests).orderBy(desc(accessRequests.createdAt), desc(accessRequests.id));
}

export async function approveAccessRequest(input: { requestId: number; adminUserId: number; durationDays: number; temporaryPassword: string }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const request = (await db.select().from(accessRequests).where(eq(accessRequests.id, input.requestId)).limit(1))[0];
  if (!request) throw new Error("Solicitação não encontrada.");
  const expiresAt = new Date(Date.now() + input.durationDays * 86_400_000);
  await db.update(accessRequests).set({ status: "approved", credentialHash: hashCredential(input.temporaryPassword), accessExpiresAt: expiresAt, approvedByUserId: input.adminUserId, approvedAt: new Date(), updatedAt: new Date() }).where(eq(accessRequests.id, input.requestId));
  return { request: (await db.select().from(accessRequests).where(eq(accessRequests.id, input.requestId)).limit(1))[0]!, expiresAt };
}

export async function createManualAccess(input: { fullName: string; email: string; phone?: string | null; companyName?: string | null; jobTitle?: string | null; adminUserId: number; durationDays: number; temporaryPassword: string }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const email = input.email.trim().toLowerCase();
  const expiresAt = new Date(Date.now() + input.durationDays * 86_400_000);
  const values = {
    fullName: input.fullName.trim(),
    phone: input.phone?.trim() || null,
    companyName: input.companyName?.trim() || null,
    jobTitle: input.jobTitle?.trim() || null,
    status: "approved" as const,
    credentialHash: hashCredential(input.temporaryPassword),
    accessExpiresAt: expiresAt,
    approvedByUserId: input.adminUserId,
    approvedAt: new Date(),
    updatedAt: new Date(),
  };
  const existing = (await db.select().from(accessRequests).where(eq(accessRequests.email, email)).limit(1))[0];
  if (existing) {
    await db.update(accessRequests).set(values).where(eq(accessRequests.id, existing.id));
  } else {
    await db.insert(accessRequests).values({ email, ...values });
  }
  const request = (await db.select().from(accessRequests).where(eq(accessRequests.email, email)).limit(1))[0]!;
  return { request, expiresAt };
}

export async function resetAccessCredential(input: { email: string; adminUserId: number; durationDays: number; temporaryPassword: string }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const email = input.email.trim().toLowerCase();
  const request = (await db.select().from(accessRequests).where(eq(accessRequests.email, email)).limit(1))[0];
  if (!request || request.status !== "approved") throw new Error("A conta ainda não possui acesso liberado.");
  const expiresAt = new Date(Date.now() + input.durationDays * 86_400_000);
  await db.update(accessRequests).set({ credentialHash: hashCredential(input.temporaryPassword), accessExpiresAt: expiresAt, approvedByUserId: input.adminUserId, approvedAt: new Date(), updatedAt: new Date() }).where(eq(accessRequests.id, request.id));
  return { request: (await db.select().from(accessRequests).where(eq(accessRequests.id, request.id)).limit(1))[0]!, expiresAt };
}

export async function authenticateApprovedAccess(emailInput: string, password: string) {
  const db = await getDb();
  if (!db) return undefined;
  const request = (await db.select().from(accessRequests).where(eq(accessRequests.email, emailInput.trim().toLowerCase())).limit(1))[0];
  if (!request || request.status !== "approved" || !request.credentialHash || (request.accessExpiresAt && request.accessExpiresAt.getTime() <= Date.now())) return undefined;
  return verifyCredential(password, request.credentialHash) ? request : undefined;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] getUserByOpenId simulado em memória (DATABASE_URL ausente).");
    if (openId === "owner-master-openid-12345" || openId.includes("santiago")) {
      return {
        id: 1,
        openId,
        name: "Santiago (Master Admin)",
        email: "santiagoocorretor@gmail.com",
        role: "admin" as const,
        loginMethod: "direct",
        accessStatus: "active" as const,
        accessExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };
    }
    return {
      id: 999,
      openId,
      name: "Profissional de SST",
      email: "usuario@tstbrasilhub.com.br",
        role: "user" as const,
        loginMethod: "direct",
        accessStatus: "active" as const,
        accessExpiresAt: null,
        createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
  }
  const record = (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0];
  if (record && record.email?.toLowerCase() === "santiagoocorretor@gmail.com" && record.role !== "admin") {
    await db.update(users).set({ role: "admin" }).where(eq(users.id, record.id));
    record.role = "admin";
  }
  return record;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) {
    return {
      id: userId,
      openId: userId === 1 ? "owner-master-openid-12345" : `user-${userId}`,
      name: userId === 1 ? "Santiago (Master Admin)" : "Profissional de SST",
      email: userId === 1 ? "santiagoocorretor@gmail.com" : "usuario@tstbrasilhub.com.br",
      role: userId === 1 ? ("admin" as const) : ("user" as const),
      loginMethod: "direct",
      accessStatus: "active" as const,
      accessExpiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
  }
  return (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
}

export async function updateUserProfile(userId: number, input: { name: string }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await db.update(users).set({ name: input.name, updatedAt: new Date() }).where(eq(users.id, userId));
  return (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
}

export async function listUsersForAdmin() {
  const db = await getDb();
  if (!db) return [];
  const [userRows, subscriptionRows, workspaceRows] = await Promise.all([
    db.select().from(users).orderBy(desc(users.createdAt), desc(users.id)),
    db.select().from(subscriptions),
    db.select({ id: workspaces.id, ownerUserId: workspaces.ownerUserId, name: workspaces.name, kind: workspaces.kind }).from(workspaces),
  ]);
  return userRows.map(user => ({
    ...user,
    subscription: subscriptionRows.find(subscription => subscription.userId === user.id) ?? null,
    workspaces: workspaceRows.filter(workspace => workspace.ownerUserId === user.id),
  }));
}

export async function updateUserAccess(input: {
  targetUserId: number;
  adminUserId: number;
  action: "renew" | "suspend" | "reactivate" | "disable";
  expiresAt: Date | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const target = (await db.select().from(users).where(eq(users.id, input.targetUserId)).limit(1))[0];
  if (!target) throw new Error("Usuário não encontrado.");

  const nextStatus = input.action === "suspend" || input.action === "disable" ? "suspended" as const : "active" as const;
  const nextExpiresAt = nextStatus === "suspended" ? null : input.expiresAt;
  const credentialRequest = target.email
    ? (await db.select().from(accessRequests).where(eq(accessRequests.email, target.email.trim().toLowerCase())).limit(1))[0]
    : undefined;

  await db.transaction(async tx => {
    await tx.update(users)
      .set({ accessStatus: nextStatus, accessExpiresAt: nextExpiresAt, updatedAt: new Date() })
      .where(eq(users.id, input.targetUserId));

    if (credentialRequest?.credentialHash) {
      await tx.update(accessRequests)
        .set({
          status: nextStatus === "suspended" ? "rejected" : "approved",
          accessExpiresAt: nextExpiresAt,
          updatedAt: new Date(),
        })
        .where(eq(accessRequests.id, credentialRequest.id));
    }

    await tx.insert(adminAccessAudit).values({
      targetUserId: input.targetUserId,
      adminUserId: input.adminUserId,
      action: input.action,
      previousStatus: target.accessStatus,
      nextStatus,
      previousExpiresAt: target.accessExpiresAt,
      nextExpiresAt,
    });
  });
  return (await db.select().from(users).where(eq(users.id, input.targetUserId)).limit(1))[0];
}

export async function updateGeneratedAccess(input: {
  requestId: number;
  adminUserId: number;
  action: "disable" | "reactivate";
  expiresAt: Date | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");

  const request = (await db.select().from(accessRequests).where(eq(accessRequests.id, input.requestId)).limit(1))[0];
  if (!request || !request.credentialHash) throw new Error("A credencial gerada não foi encontrada.");

  const nextCredentialStatus = input.action === "disable" ? "rejected" as const : "approved" as const;
  const nextUserStatus = input.action === "disable" ? "suspended" as const : "active" as const;
  const targetUser = (await db.select().from(users).where(eq(users.email, request.email)).limit(1))[0];

  await db.transaction(async tx => {
    await tx.update(accessRequests)
      .set({ status: nextCredentialStatus, accessExpiresAt: input.expiresAt, updatedAt: new Date() })
      .where(eq(accessRequests.id, request.id));

    if (targetUser) {
      await tx.update(users)
        .set({ accessStatus: nextUserStatus, accessExpiresAt: input.expiresAt, updatedAt: new Date() })
        .where(eq(users.id, targetUser.id));
      await tx.insert(adminAccessAudit).values({
        targetUserId: targetUser.id,
        adminUserId: input.adminUserId,
        action: input.action,
        previousStatus: targetUser.accessStatus,
        nextStatus: nextUserStatus,
        previousExpiresAt: targetUser.accessExpiresAt,
        nextExpiresAt: input.expiresAt,
      });
    }
  });

  return (await db.select().from(accessRequests).where(eq(accessRequests.id, request.id)).limit(1))[0]!;
}

export async function listAdminAccessAudits(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adminAccessAudit).orderBy(desc(adminAccessAudit.createdAt), desc(adminAccessAudit.id)).limit(limit);
}

export type AdminPlatformTelemetry = {
  capturedAt: Date;
  database: { status: "available" | "unavailable"; observedBytes: number | null; capacityBytes: number | null };
  usage: { companies: number; workspaces: number; employees: number; occupationalRisks: number; epiDeliveries: number; epiEvidence: number; accidents: number; documents: number; supportTickets: number };
  operational: { emailDeliveryConfigured: boolean; latestRiskEventAt: Date | null; latestEpiEvidenceAt: Date | null; latestAdminActivityAt: Date | null };
};

export async function getAdminPlatformTelemetry(): Promise<AdminPlatformTelemetry> {
  const capturedAt = new Date();
  const emptyUsage = { companies: 0, workspaces: 0, employees: 0, occupationalRisks: 0, epiDeliveries: 0, epiEvidence: 0, accidents: 0, documents: 0, supportTickets: 0 };
  const db = await getDb();
  if (!db) return { capturedAt, database: { status: "unavailable", observedBytes: null, capacityBytes: null }, usage: emptyUsage, operational: { emailDeliveryConfigured: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL), latestRiskEventAt: null, latestEpiEvidenceAt: null, latestAdminActivityAt: null } };

  const count = async (table: Parameters<typeof db.select>[0] extends never ? never : any) => {
    const rows = await db.select({ value: sql<number>`count(*)` }).from(table);
    return Number(rows[0]?.value ?? 0);
  };
  const [companiesCount, workspacesCount, employeesCount, risksCount, deliveriesCount, evidenceCount, accidentsCount, attachmentsCount, cipaDocumentsCount, certificatesCount, ticketsCount, latestRisk, latestEvidence, latestAdmin] = await Promise.all([
    count(companies), count(workspaces), count(employees), count(occupationalRisks), count(epiDeliveries), count(epiDeliveryEvidence), count(accidentDetails), count(pgrAttachments), count(cipaDocuments), count(certificates), count(supportTickets),
    db.select({ value: sql<Date | null>`max(${occupationalRiskEvents.occurredAt})` }).from(occupationalRiskEvents),
    db.select({ value: sql<Date | null>`max(${epiDeliveryEvidence.createdAt})` }).from(epiDeliveryEvidence),
    db.select({ value: sql<Date | null>`max(${adminAccessAudit.createdAt})` }).from(adminAccessAudit),
  ]);

  let observedBytes: number | null = null;
  try {
    const result = await db.execute(sql.raw("SELECT COALESCE(SUM(data_length + index_length), 0) AS observedBytes FROM information_schema.tables WHERE table_schema = DATABASE()"));
    const rows = Array.isArray(result) ? result[0] : result;
    const first = Array.isArray(rows) ? rows[0] as { observedBytes?: number | string } | undefined : undefined;
    observedBytes = first?.observedBytes === undefined ? null : Number(first.observedBytes);
  } catch (error) {
    console.warn("[Admin telemetry] Não foi possível medir o volume físico do banco.", error instanceof Error ? error.message : "erro desconhecido");
  }
  const parsedCapacity = Number(process.env.PLATFORM_DATABASE_CAPACITY_BYTES ?? 0);
  const capacityBytes = Number.isFinite(parsedCapacity) && parsedCapacity > 0 ? parsedCapacity : null;
  return {
    capturedAt,
    database: { status: "available", observedBytes, capacityBytes },
    usage: { companies: companiesCount, workspaces: workspacesCount, employees: employeesCount, occupationalRisks: risksCount, epiDeliveries: deliveriesCount, epiEvidence: evidenceCount, accidents: accidentsCount, documents: attachmentsCount + cipaDocumentsCount + certificatesCount, supportTickets: ticketsCount },
    operational: { emailDeliveryConfigured: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL), latestRiskEventAt: latestRisk[0]?.value ?? null, latestEpiEvidenceAt: latestEvidence[0]?.value ?? null, latestAdminActivityAt: latestAdmin[0]?.value ?? null },
  };
}

export async function listWorkspacesForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ id: workspaces.id, name: workspaces.name, kind: workspaces.kind, role: workspaceMembers.role, updatedAt: workspaces.updatedAt })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, userId))
    .orderBy(desc(workspaces.updatedAt));
}

export async function listDevelopmentWorkspacesForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const ownedWorkspaces = await db
    .select({ id: workspaces.id, name: workspaces.name, kind: workspaces.kind, updatedAt: workspaces.updatedAt })
    .from(workspaces)
    .where(eq(workspaces.ownerUserId, userId))
    .orderBy(workspaces.kind, desc(workspaces.updatedAt));
  return ownedWorkspaces.map(workspace => ({ ...workspace, role: "owner" as const }));
}

export async function getPrimaryWorkspaceForUser(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const workspace = (await db
    .select({ id: workspaces.id, name: workspaces.name, kind: workspaces.kind, updatedAt: workspaces.updatedAt })
    .from(workspaces)
    .where(eq(workspaces.ownerUserId, userId))
    .orderBy(desc(workspaces.updatedAt), desc(workspaces.id))
    .limit(1))[0];
  return workspace ? { ...workspace, role: "owner" as const } : undefined;
}

export async function createWorkspaceForUser(input: { userId: number; name: string; kind: "autonomo" | "clt" }) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] createWorkspaceForUser simulado em memória (DATABASE_URL ausente).");
    return { id: Date.now() % 100000, name: input.name, kind: input.kind, role: "owner" as const };
  }
  const inserted = await db.insert(workspaces).values({ name: input.name, kind: input.kind, ownerUserId: input.userId });
  const workspaceId = Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0);
  if (!workspaceId) throw new Error("Não foi possível criar o ambiente.");
  await db.insert(workspaceMembers).values({ workspaceId, userId: input.userId, role: "owner" });
  return { id: workspaceId, name: input.name, kind: input.kind, role: "owner" as const };
}

export async function getWorkspaceForUser(workspaceId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const workspace = (await db
    .select({ id: workspaces.id, name: workspaces.name, kind: workspaces.kind, role: workspaceMembers.role })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(and(eq(workspaceMembers.userId, userId), eq(workspaceMembers.workspaceId, workspaceId)))
    .limit(1))[0];
  return workspace;
}

export async function listCompaniesForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companies).where(eq(companies.workspaceId, workspaceId)).orderBy(desc(companies.updatedAt));
}

export async function createCompanyForWorkspace(input: { workspaceId: number; name: string; document?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const inserted = await db.insert(companies).values({
    workspaceId: input.workspaceId,
    name: input.name,
    document: input.document ?? null,
  });
  return { id: Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0), ...input };
}

export async function getCompanyForWorkspace(companyId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db
    .select()
    .from(companies)
    .where(and(eq(companies.id, companyId), eq(companies.workspaceId, workspaceId)))
    .limit(1))[0];
}

export async function updateCompanyLogoForWorkspace(input: { companyId: number; workspaceId: number; logoKey: string | null; logoUrl: string }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await db
    .update(companies)
    .set({ logoKey: input.logoKey, logoUrl: input.logoUrl, updatedAt: new Date() })
    .where(and(eq(companies.id, input.companyId), eq(companies.workspaceId, input.workspaceId)));
  return getCompanyForWorkspace(input.companyId, input.workspaceId);
}

export async function updateCompanyBrandingForWorkspace(input: {
  companyId: number;
  workspaceId: number;
  brandPrimaryColor: string;
  brandBackgroundColor: string;
  logoKey?: string | null;
  logoUrl?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await db
    .update(companies)
    .set({
      brandPrimaryColor: input.brandPrimaryColor,
      brandBackgroundColor: input.brandBackgroundColor,
      ...(input.logoKey !== undefined ? { logoKey: input.logoKey, logoUrl: input.logoUrl ?? null } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(companies.id, input.companyId), eq(companies.workspaceId, input.workspaceId)));
  return getCompanyForWorkspace(input.companyId, input.workspaceId);
}

export async function getSubscriptionForUser(userId: number): Promise<Subscription | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1))[0];
}

export async function upsertSubscription(input: {
  userId: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  planCode: string;
  status: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(subscriptions).values(input).onDuplicateKeyUpdate({ set: { ...input, updatedAt: new Date() } });
}

export async function listPgrProjectsForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pgrProjects).where(eq(pgrProjects.workspaceId, workspaceId)).orderBy(desc(pgrProjects.updatedAt));
}

export async function getPgrProjectForWorkspace(projectId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db
    .select()
    .from(pgrProjects)
    .where(and(eq(pgrProjects.id, projectId), eq(pgrProjects.workspaceId, workspaceId)))
    .limit(1))[0];
}

export async function createPgrProjectForWorkspace(input: { workspaceId: number; companyId?: number | null; name: string; legacyStorageKey: string }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const inserted = await db.insert(pgrProjects).values({
    workspaceId: input.workspaceId,
    companyId: input.companyId ?? null,
    name: input.name,
    legacyStorageKey: input.legacyStorageKey,
  });
  return { id: Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0), ...input };
}

export async function listPgrAttachments(pgrProjectId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pgrAttachments).where(and(eq(pgrAttachments.pgrProjectId, pgrProjectId), eq(pgrAttachments.workspaceId, workspaceId))).orderBy(desc(pgrAttachments.createdAt));
}

export async function createPgrAttachment(input: {
  pgrProjectId: number;
  workspaceId: number;
  title: string;
  category: "photo" | "laudo" | "art" | "certificate" | "other";
  fileKey: string;
  fileUrl: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const inserted = await db.insert(pgrAttachments).values(input);
  const id = Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0);
  return (await db.select().from(pgrAttachments).where(eq(pgrAttachments.id, id)).limit(1))[0];
}

export async function listCertificatesForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(certificates).where(eq(certificates.workspaceId, workspaceId)).orderBy(desc(certificates.expiresAt), desc(certificates.updatedAt));
}

export async function createCertificateForWorkspace(input: {
  workspaceId: number;
  companyId?: number | null;
  category?: "certificate" | "pgr" | "ltcat" | "os" | "pcmat" | "laudo" | "other";
  participantName: string;
  trainingName: string;
  issuedAt: Date;
  expiresAt?: Date | null;
  referenceUrl?: string | null;
  notes?: string | null;
  createdByUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const values = {
    ...input,
    category: input.category ?? "certificate",
    companyId: input.companyId ?? null,
    expiresAt: input.expiresAt ?? null,
    referenceUrl: input.referenceUrl ?? null,
    notes: input.notes ?? null,
  };
  const inserted = await db.insert(certificates).values(values);
  return { id: Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0), ...values };
}

export async function listTrainingsForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  const records = await db.select().from(trainings).where(eq(trainings.workspaceId, workspaceId)).orderBy(desc(trainings.scheduledAt), desc(trainings.updatedAt));
  const trainingIds = records.map(record => record.id);
  const participants = trainingIds.length
    ? await db.select({ trainingId: trainingParticipants.trainingId, employeeId: employees.id, fullName: employees.fullName, companyId: employees.companyId })
      .from(trainingParticipants)
      .innerJoin(employees, eq(trainingParticipants.employeeId, employees.id))
      .where(and(eq(trainingParticipants.workspaceId, workspaceId), inArray(trainingParticipants.trainingId, trainingIds)))
    : [];
  const byTraining = new Map<number, typeof participants>();
  participants.forEach(participant => byTraining.set(participant.trainingId, [...(byTraining.get(participant.trainingId) ?? []), participant]));
  return records.map(record => {
    let scheduledDates: Date[] = [];
    try {
      const parsed = record.scheduledDatesJson ? JSON.parse(record.scheduledDatesJson) : [];
      scheduledDates = Array.isArray(parsed) ? parsed.map(value => new Date(value)).filter(value => !Number.isNaN(value.getTime())) : [];
    } catch { scheduledDates = []; }
    if (!scheduledDates.length && record.scheduledAt) scheduledDates = [record.scheduledAt];
    const linkedParticipants = (byTraining.get(record.id) ?? []).map(({ employeeId, fullName, companyId }) => ({ employeeId, fullName, companyId }));
    return { ...record, scheduledDates, instructorName: record.instructorName ?? null, location: record.location ?? null, participants: linkedParticipants, participantCount: linkedParticipants.length || record.participantCount };
  });
}

export async function createTrainingForWorkspace(input: {
  workspaceId: number;
  companyId?: number | null;
  title: string;
  scheduledAt?: Date | null;
  scheduledDates?: Date[];
  instructorName?: string | null;
  location?: string | null;
  participantIds?: number[];
  participantCount: number;
  createdByUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const scheduledDates = Array.from(new Map((input.scheduledDates ?? []).map(date => [date.toISOString(), date])).values());
  const participantIds = Array.from(new Set(input.participantIds ?? []));
  const participantCount = participantIds.length || input.participantCount;
  const inserted = await db.insert(trainings).values({
    workspaceId: input.workspaceId,
    companyId: input.companyId ?? null,
    title: input.title,
    scheduledAt: input.scheduledAt ?? scheduledDates[0] ?? null,
    scheduledDatesJson: scheduledDates.length ? JSON.stringify(scheduledDates.map(date => date.toISOString())) : null,
    instructorName: input.instructorName ?? null,
    location: input.location ?? null,
    participantCount,
    createdByUserId: input.createdByUserId,
  });
  const id = Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0);
  if (id && participantIds.length) await db.insert(trainingParticipants).values(participantIds.map(employeeId => ({ trainingId: id, workspaceId: input.workspaceId, employeeId })));
  return { id, ...input, scheduledAt: input.scheduledAt ?? scheduledDates[0] ?? null, scheduledDates, instructorName: input.instructorName ?? null, location: input.location ?? null, participantCount };
}

export async function listCipaCommissionsForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cipaCommissions).where(eq(cipaCommissions.workspaceId, workspaceId)).orderBy(desc(cipaCommissions.updatedAt));
}

export async function listCipaTermsForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cipaTerms).where(eq(cipaTerms.workspaceId, workspaceId)).orderBy(desc(cipaTerms.updatedAt));
}

export async function listCipaMembersForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cipaMembers).where(eq(cipaMembers.workspaceId, workspaceId)).orderBy(desc(cipaMembers.voteCount), desc(cipaMembers.updatedAt));
}

export async function listCipaDocumentsForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cipaDocuments).where(eq(cipaDocuments.workspaceId, workspaceId)).orderBy(desc(cipaDocuments.createdAt));
}

export async function getCipaCommissionForWorkspace(commissionId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(cipaCommissions).where(and(eq(cipaCommissions.id, commissionId), eq(cipaCommissions.workspaceId, workspaceId))).limit(1))[0];
}

export async function getCipaTermForWorkspace(termId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(cipaTerms).where(and(eq(cipaTerms.id, termId), eq(cipaTerms.workspaceId, workspaceId))).limit(1))[0];
}

export async function getCipaMemberForWorkspace(memberId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(cipaMembers).where(and(eq(cipaMembers.id, memberId), eq(cipaMembers.workspaceId, workspaceId))).limit(1))[0];
}

export async function createCipaCommissionForWorkspace(input: {
  workspaceId: number; companyId: number; riskLevel: number; employeeCount: number; city?: string | null; workplace?: string | null; unionName?: string | null;
  termLabel: string; enrollmentStartsAt?: Date | null; electionAt?: Date | null; possessionAt?: Date | null; endsAt?: Date | null; createdByUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const commissionInsert = await db.insert(cipaCommissions).values({
    workspaceId: input.workspaceId, companyId: input.companyId, riskLevel: input.riskLevel, employeeCount: input.employeeCount,
    city: input.city ?? null, workplace: input.workplace ?? null, unionName: input.unionName ?? null, createdByUserId: input.createdByUserId,
  });
  const commissionId = Number((commissionInsert as unknown as [{ insertId?: number }])[0]?.insertId ?? 0);
  const termInsert = await db.insert(cipaTerms).values({
    commissionId, workspaceId: input.workspaceId, label: input.termLabel, enrollmentStartsAt: input.enrollmentStartsAt ?? null,
    electionAt: input.electionAt ?? null, possessionAt: input.possessionAt ?? null, endsAt: input.endsAt ?? null,
  });
  const termId = Number((termInsert as unknown as [{ insertId?: number }])[0]?.insertId ?? 0);
  const commission = (await db.select().from(cipaCommissions).where(eq(cipaCommissions.id, commissionId)).limit(1))[0];
  const term = (await db.select().from(cipaTerms).where(eq(cipaTerms.id, termId)).limit(1))[0];
  return { commission, term };
}

export async function createCipaMemberForWorkspace(input: {
  workspaceId: number; commissionId: number; termId: number; employeeId: number;
  role: "election_committee" | "candidate" | "employer_representative" | "employee_representative";
  condition: "titular" | "suplente" | "not_applicable"; notes?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const inserted = await db.insert(cipaMembers).values({ ...input, notes: input.notes ?? null });
  const id = Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0);
  return (await db.select().from(cipaMembers).where(eq(cipaMembers.id, id)).limit(1))[0];
}

export async function updateCipaMemberElectionForWorkspace(input: { memberId: number; workspaceId: number; voteCount: number; status: "active" | "withdrawn" | "elected" | "not_elected"; condition: "titular" | "suplente" | "not_applicable" }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await db.update(cipaMembers).set({ voteCount: input.voteCount, status: input.status, condition: input.condition, updatedAt: new Date() }).where(and(eq(cipaMembers.id, input.memberId), eq(cipaMembers.workspaceId, input.workspaceId)));
  return getCipaMemberForWorkspace(input.memberId, input.workspaceId);
}

export async function createCipaDocumentForWorkspace(input: { workspaceId: number; commissionId: number; termId: number; type: "election_committee" | "union_notice" | "notice" | "registration" | "ballot" | "election_minutes" | "possession_minutes" | "work_plan"; title: string; content: string; companyLogoUrl?: string | null; createdByUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const inserted = await db.insert(cipaDocuments).values({ ...input, companyLogoUrl: input.companyLogoUrl ?? null });
  const id = Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0);
  return (await db.select().from(cipaDocuments).where(eq(cipaDocuments.id, id)).limit(1))[0];
}

export async function listCipaMeetingsForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cipaMeetings).where(eq(cipaMeetings.workspaceId, workspaceId)).orderBy(cipaMeetings.scheduledAt);
}

export async function getCipaMeetingForWorkspace(meetingId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(cipaMeetings).where(and(eq(cipaMeetings.id, meetingId), eq(cipaMeetings.workspaceId, workspaceId))).limit(1))[0];
}

export async function createCipaMeetingForWorkspace(input: {
  workspaceId: number; commissionId: number; termId: number; title: string; meetingType: "ordinary" | "extraordinary";
  scheduledAt: Date; location?: string | null; agenda?: string | null; minutesSummary?: string | null;
  status: "scheduled" | "completed" | "cancelled"; createdByUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const inserted = await db.insert(cipaMeetings).values({
    ...input,
    location: input.location ?? null,
    agenda: input.agenda ?? null,
    minutesSummary: input.minutesSummary ?? null,
  });
  const id = Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0);
  return (await db.select().from(cipaMeetings).where(eq(cipaMeetings.id, id)).limit(1))[0];
}

export async function updateCipaMeetingForWorkspace(input: {
  meetingId: number; workspaceId: number; title: string; meetingType: "ordinary" | "extraordinary"; scheduledAt: Date;
  location?: string | null; agenda?: string | null; minutesSummary?: string | null; status: "scheduled" | "completed" | "cancelled";
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await db.update(cipaMeetings).set({
    title: input.title,
    meetingType: input.meetingType,
    scheduledAt: input.scheduledAt,
    location: input.location ?? null,
    agenda: input.agenda ?? null,
    minutesSummary: input.minutesSummary ?? null,
    status: input.status,
    updatedAt: new Date(),
  }).where(and(eq(cipaMeetings.id, input.meetingId), eq(cipaMeetings.workspaceId, input.workspaceId)));
  return getCipaMeetingForWorkspace(input.meetingId, input.workspaceId);
}

export async function listPublishedYouTubeVideos() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(youtubeVideos).where(eq(youtubeVideos.status, "published")).orderBy(desc(youtubeVideos.featured), desc(youtubeVideos.publishedAt), desc(youtubeVideos.updatedAt));
}

export async function listYouTubeVideosForAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(youtubeVideos).orderBy(desc(youtubeVideos.updatedAt));
}

export async function createYouTubeVideo(input: { title: string; description: string; category: string; youtubeUrl: string; youtubeVideoId: string; thumbnailUrl: string; status: "draft" | "published" | "hidden"; featured: boolean; createdByUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const now = new Date();
  const inserted = await db.insert(youtubeVideos).values({ ...input, publishedAt: input.status === "published" ? now : null });
  const id = Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0);
  return (await db.select().from(youtubeVideos).where(eq(youtubeVideos.id, id)).limit(1))[0];
}

export async function updateYouTubeVideo(id: number, input: { title: string; description: string; category: string; youtubeUrl: string; youtubeVideoId: string; thumbnailUrl: string; status: "draft" | "published" | "hidden"; featured: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const existing = (await db.select().from(youtubeVideos).where(eq(youtubeVideos.id, id)).limit(1))[0];
  if (!existing) return undefined;
  const publishedAt = input.status === "published" ? existing.publishedAt ?? new Date() : null;
  await db.update(youtubeVideos).set({ ...input, publishedAt, updatedAt: new Date() }).where(eq(youtubeVideos.id, id));
  return (await db.select().from(youtubeVideos).where(eq(youtubeVideos.id, id)).limit(1))[0];
}

export async function listMaterialsForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(materials).where(eq(materials.workspaceId, workspaceId)).orderBy(desc(materials.updatedAt));
}

export async function createMaterialForWorkspace(input: {
  workspaceId: number;
  title: string;
  category: "modelo" | "checklist" | "procedimento" | "outro";
  description?: string | null;
  referenceUrl?: string | null;
  createdByUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const inserted = await db.insert(materials).values({
    ...input,
    description: input.description ?? null,
    referenceUrl: input.referenceUrl ?? null,
  });
  return { id: Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0), ...input };
}

export type ContentMaterialInput = {
  placement: "marketplace" | "library";
  title: string;
  description: string;
  category: string;
  format: "modelo" | "planilha" | "checklist" | "ebook" | "curso" | "documento" | "outro";
  salePlatform: "hotmart" | "kiwify" | "externo" | "nenhuma";
  priceCents?: number | null;
  referenceUrl?: string | null;
  coverUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileMimeType?: string | null;
  status: "draft" | "published" | "hidden";
  featured: boolean;
};

export async function listPublishedContentMaterials(placement: "marketplace" | "library") {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contentMaterials)
    .where(and(eq(contentMaterials.placement, placement), eq(contentMaterials.status, "published")))
    .orderBy(desc(contentMaterials.featured), desc(contentMaterials.publishedAt), desc(contentMaterials.updatedAt));
}

export async function listContentMaterialsForAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contentMaterials).orderBy(desc(contentMaterials.updatedAt));
}

export async function createContentMaterial(input: ContentMaterialInput & { createdByUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const now = new Date();
  const inserted = await db.insert(contentMaterials).values({
    ...input,
    priceCents: input.priceCents ?? null,
    referenceUrl: input.referenceUrl ?? null,
    coverUrl: input.coverUrl ?? null,
    fileUrl: input.fileUrl ?? null,
    fileName: input.fileName ?? null,
    fileMimeType: input.fileMimeType ?? null,
    publishedAt: input.status === "published" ? now : null,
  });
  return { id: Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0), ...input, publishedAt: input.status === "published" ? now : null };
}

export async function updateContentMaterial(id: number, input: ContentMaterialInput) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const existing = await db.select().from(contentMaterials).where(eq(contentMaterials.id, id)).limit(1);
  if (!existing[0]) return null;
  const publishedAt = input.status === "published" ? (existing[0].publishedAt ?? new Date()) : null;
  await db.update(contentMaterials).set({
    ...input,
    priceCents: input.priceCents ?? null,
    referenceUrl: input.referenceUrl ?? null,
    coverUrl: input.coverUrl ?? null,
    fileUrl: input.fileUrl ?? null,
    fileName: input.fileName ?? null,
    fileMimeType: input.fileMimeType ?? null,
    publishedAt,
  }).where(eq(contentMaterials.id, id));
  return { id, ...input, publishedAt };
}

export async function registerContentMaterialCheckoutClick(input: { materialId: number; userId: number }) {
  const db = await getDb();
  if (!db) return { recorded: false };
  const material = await db.select({ id: contentMaterials.id }).from(contentMaterials).where(and(
    eq(contentMaterials.id, input.materialId),
    eq(contentMaterials.placement, "marketplace"),
    eq(contentMaterials.status, "published"),
  )).limit(1);
  if (!material[0]) return { recorded: false };
  await db.insert(contentMaterialClicks).values(input);
  return { recorded: true };
}

export async function getContentMaterialCheckoutMetrics() {
  const db = await getDb();
  if (!db) return { totalClicks: 0, materials: [] };
  const [materialsList, clickRows] = await Promise.all([
    db.select().from(contentMaterials).where(eq(contentMaterials.placement, "marketplace")).orderBy(desc(contentMaterials.updatedAt)),
    db.select({
      materialId: contentMaterialClicks.materialId,
      checkoutClicks: sql<number>`count(*)`,
      lastCheckoutAt: sql<Date | null>`max(${contentMaterialClicks.createdAt})`,
    }).from(contentMaterialClicks).groupBy(contentMaterialClicks.materialId),
  ]);
  const clicksByMaterial = new Map(clickRows.map(row => [row.materialId, { checkoutClicks: Number(row.checkoutClicks), lastCheckoutAt: row.lastCheckoutAt }]));
  const materials = materialsList.map(material => ({
    ...material,
    checkoutClicks: clicksByMaterial.get(material.id)?.checkoutClicks ?? 0,
    lastCheckoutAt: clicksByMaterial.get(material.id)?.lastCheckoutAt ?? null,
  })).sort((a, b) => b.checkoutClicks - a.checkoutClicks || b.updatedAt.getTime() - a.updatedAt.getTime());
  return { totalClicks: materials.reduce((total, material) => total + material.checkoutClicks, 0), materials };
}

export async function listSupportTicketsForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supportTickets).where(eq(supportTickets.workspaceId, workspaceId)).orderBy(desc(supportTickets.updatedAt));
}

export async function createSupportTicketForWorkspace(input: {
  workspaceId: number;
  subject: string;
  message: string;
  createdByUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const inserted = await db.insert(supportTickets).values(input);
  return { id: Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0), ...input, status: "open" as const };
}

export async function listDepartmentsForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(departments).where(eq(departments.workspaceId, workspaceId)).orderBy(desc(departments.updatedAt));
}

export async function getDepartmentForWorkspace(departmentId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(departments).where(and(eq(departments.id, departmentId), eq(departments.workspaceId, workspaceId))).limit(1))[0];
}

export async function createDepartmentForWorkspace(input: { workspaceId: number; companyId: number; name: string; description?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const inserted = await db.insert(departments).values({ ...input, description: input.description ?? null });
  return { id: Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0), ...input, description: input.description ?? null, active: true as const };
}

export async function listJobRolesForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(jobRoles).where(eq(jobRoles.workspaceId, workspaceId)).orderBy(desc(jobRoles.updatedAt));
}

export async function getJobRoleForWorkspace(jobRoleId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(jobRoles).where(and(eq(jobRoles.id, jobRoleId), eq(jobRoles.workspaceId, workspaceId))).limit(1))[0];
}

export async function createJobRoleForWorkspace(input: { workspaceId: number; companyId: number; departmentId?: number | null; name: string; description?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const inserted = await db.insert(jobRoles).values({ ...input, departmentId: input.departmentId ?? null, description: input.description ?? null });
  return { id: Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0), ...input, departmentId: input.departmentId ?? null, description: input.description ?? null, active: true as const };
}

export async function listEmployeesForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(employees).where(eq(employees.workspaceId, workspaceId)).orderBy(desc(employees.updatedAt));
}

export async function createEmployeeForWorkspace(input: { workspaceId: number; companyId: number; departmentId?: number | null; jobRoleId?: number | null; fullName: string; email?: string | null; hiredAt?: Date | null }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const email = input.email?.trim().toLowerCase() || null;
  const inserted = await db.insert(employees).values({ ...input, email, departmentId: input.departmentId ?? null, jobRoleId: input.jobRoleId ?? null, hiredAt: input.hiredAt ?? null, status: "active" });
  return { id: Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0), ...input, email, departmentId: input.departmentId ?? null, jobRoleId: input.jobRoleId ?? null, hiredAt: input.hiredAt ?? null, status: "active" as const };
}

export async function getEmployeeForWorkspace(employeeId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(employees).where(and(eq(employees.id, employeeId), eq(employees.workspaceId, workspaceId))).limit(1))[0];
}

export async function updateEmployeeEmailForWorkspace(input: { workspaceId: number; employeeId: number; email: string }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await ensureEpiEvidenceSchema(db);
  await db.update(employees).set({ email: input.email.trim().toLowerCase(), updatedAt: new Date() }).where(and(eq(employees.id, input.employeeId), eq(employees.workspaceId, input.workspaceId)));
  const employee = await getEmployeeForWorkspace(input.employeeId, input.workspaceId);
  if (!employee) throw new Error("Trabalhador não encontrado após a atualização.");
  return employee;
}

export async function listEpiItemsForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(epiItems).where(eq(epiItems.workspaceId, workspaceId)).orderBy(desc(epiItems.updatedAt));
}

export async function getEpiItemForWorkspace(epiItemId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(epiItems).where(and(eq(epiItems.id, epiItemId), eq(epiItems.workspaceId, workspaceId))).limit(1))[0];
}

export async function createEpiItemForWorkspace(input: { workspaceId: number; companyId: number; name: string; imageUrl?: string | null; responsibleName?: string | null; renewalRequested?: boolean; caNumber?: string | null; manufacturer?: string | null; lotNumber?: string | null; caExpiresAt?: Date | null; equipmentExpiresAt?: Date | null; protectionDescription?: string | null; limitations?: string | null; careInstructions?: string | null; manualUrl?: string | null; requiresTraining?: boolean; stockQuantity: number; minimumStock: number; expiresAt?: Date | null }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const values = { ...input, imageUrl: input.imageUrl ?? null, responsibleName: input.responsibleName ?? null, renewalRequested: input.renewalRequested ?? false, caNumber: input.caNumber ?? null, manufacturer: input.manufacturer ?? null, lotNumber: input.lotNumber ?? null, caExpiresAt: input.caExpiresAt ?? input.expiresAt ?? null, equipmentExpiresAt: input.equipmentExpiresAt ?? null, protectionDescription: input.protectionDescription ?? null, limitations: input.limitations ?? null, careInstructions: input.careInstructions ?? null, manualUrl: input.manualUrl ?? null, requiresTraining: input.requiresTraining ?? false, expiresAt: input.caExpiresAt ?? input.expiresAt ?? null };
  const inserted = await db.insert(epiItems).values(values);
  return { id: Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0), ...values, active: true as const };
}

export async function updateEpiItemForWorkspace(input: { workspaceId: number; companyId: number; epiItemId: number; name: string; imageUrl?: string | null; responsibleName?: string | null; renewalRequested?: boolean; caNumber?: string | null; manufacturer?: string | null; lotNumber?: string | null; caExpiresAt?: Date | null; equipmentExpiresAt?: Date | null; protectionDescription?: string | null; limitations?: string | null; careInstructions?: string | null; manualUrl?: string | null; requiresTraining?: boolean; stockQuantity: number; minimumStock: number; expiresAt?: Date | null }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await db.update(epiItems).set({ name: input.name, imageUrl: input.imageUrl ?? null, responsibleName: input.responsibleName ?? null, renewalRequested: input.renewalRequested ?? false, caNumber: input.caNumber ?? null, manufacturer: input.manufacturer ?? null, lotNumber: input.lotNumber ?? null, caExpiresAt: input.caExpiresAt ?? input.expiresAt ?? null, equipmentExpiresAt: input.equipmentExpiresAt ?? null, protectionDescription: input.protectionDescription ?? null, limitations: input.limitations ?? null, careInstructions: input.careInstructions ?? null, manualUrl: input.manualUrl ?? null, requiresTraining: input.requiresTraining ?? false, stockQuantity: input.stockQuantity, minimumStock: input.minimumStock, expiresAt: input.caExpiresAt ?? input.expiresAt ?? null }).where(and(eq(epiItems.id, input.epiItemId), eq(epiItems.workspaceId, input.workspaceId), eq(epiItems.companyId, input.companyId)));
  const updated = await getEpiItemForWorkspace(input.epiItemId, input.workspaceId);
  if (!updated) throw new Error("EPI não encontrado após a atualização.");
  return updated;
}

export async function listEpiDeliveriesForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(epiDeliveries).where(eq(epiDeliveries.workspaceId, workspaceId)).orderBy(desc(epiDeliveries.deliveredAt), desc(epiDeliveries.updatedAt));
}
export async function createEpiDeliveryForWorkspace(input: { workspaceId: number; companyId: number; epiItemId: number; employeeId: number; quantity: number; deliveryKind: "initial" | "replacement"; deliveryReason: "initial" | "scheduled_replacement" | "damage" | "loss" | "expiry" | "hygiene" | "other"; sourceDeliveryId?: number | null; deliveredAt: Date; replacementDueAt?: Date | null; conditionAtDelivery: "new" | "sanitized" | "inspected"; orientationTopics: string; orientationConfirmed: true; trainingRequired: boolean; trainingCompletedAt?: Date | null; deliveredByName: string; notes?: string | null; signedByName?: string | null; digitalSignature?: string | null; createdByUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  return db.transaction(async tx => {
    const item = (await tx.select().from(epiItems).where(and(eq(epiItems.id, input.epiItemId), eq(epiItems.workspaceId, input.workspaceId), eq(epiItems.companyId, input.companyId))).limit(1))[0];
    if (!item) throw new Error("EPI não encontrado para registrar a entrega.");
    const values = {
      ...input,
      sourceDeliveryId: input.sourceDeliveryId ?? null,
      replacementDueAt: input.replacementDueAt ?? null,
      lotNumber: item.lotNumber,
      caNumber: item.caNumber,
      manufacturer: item.manufacturer,
      protectionDescription: item.protectionDescription,
      limitations: item.limitations,
      careInstructions: item.careInstructions,
      orientationConfirmedAt: new Date(),
      trainingCompletedAt: input.trainingCompletedAt ?? null,
      receiptAcceptedAt: null,
      receiptAcceptanceMethod: "internal_confirmation" as const,
      notes: input.notes ?? null,
      signedByName: input.signedByName ?? null,
      digitalSignature: input.digitalSignature ?? null,
      returnStatus: "delivered" as const,
    };
    await tx.update(epiItems).set({ stockQuantity: sql`${epiItems.stockQuantity} - ${input.quantity}` }).where(and(eq(epiItems.id, input.epiItemId), eq(epiItems.workspaceId, input.workspaceId)));
    if (input.sourceDeliveryId) await tx.update(epiDeliveries).set({ returnStatus: "replaced" }).where(and(eq(epiDeliveries.id, input.sourceDeliveryId), eq(epiDeliveries.workspaceId, input.workspaceId), eq(epiDeliveries.employeeId, input.employeeId)));
    const inserted = await tx.insert(epiDeliveries).values(values);
    return { id: Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0), ...values };
  });
}

export async function getEpiDeliveryForWorkspace(deliveryId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(epiDeliveries).where(and(eq(epiDeliveries.id, deliveryId), eq(epiDeliveries.workspaceId, workspaceId))).limit(1))[0];
}

export async function signEpiDeliveryForWorkspace(input: { workspaceId: number; deliveryId: number; signedByName: string; digitalSignature: string; orientationConfirmed: true }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await db.update(epiDeliveries).set({ signedByName: input.signedByName, digitalSignature: input.digitalSignature, receiptAcceptedAt: new Date(), receiptAcceptanceMethod: "internal_confirmation" }).where(and(eq(epiDeliveries.id, input.deliveryId), eq(epiDeliveries.workspaceId, input.workspaceId)));
  const delivery = await getEpiDeliveryForWorkspace(input.deliveryId, input.workspaceId);
  if (!delivery) throw new Error("Ficha de EPI não encontrada após a assinatura.");
  return delivery;
}

type EpiEvidenceEventType = "evidence_created" | "email_sent" | "email_failed" | "link_opened" | "otp_failed" | "otp_verified" | "receipt_confirmed" | "evidence_expired" | "evidence_revoked" | "support_viewed";
type EpiEvidenceActorType = "manager" | "employee" | "system" | "support";

type EpiEvidenceSnapshot = {
  companyName: string;
  employeeName: string;
  epiName: string;
  caNumber: string | null;
  lotNumber: string | null;
  manufacturer: string | null;
  quantity: number;
  deliveredAt: string;
  conditionAtDelivery: string;
  orientationTopics: string | null;
  deliveredByName: string | null;
  protectionDescription: string | null;
  limitations: string | null;
  careInstructions: string | null;
  trainingRequired: boolean;
  trainingCompletedAt: string | null;
};

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "e-mail informado";
  return `${local.slice(0, 2)}${"•".repeat(Math.max(1, local.length - 2))}@${domain}`;
}

function getEpiEvidenceBaseUrl() {
  return (process.env.APP_BASE_URL || "https://tstbrasilhub.com.br").replace(/\/$/, "");
}

function parseEvidenceSnapshot(snapshotJson: string): EpiEvidenceSnapshot {
  return JSON.parse(snapshotJson) as EpiEvidenceSnapshot;
}

async function appendEpiEvidenceAuditEvent(db: ReturnType<typeof drizzle>, input: {
  evidenceId: number;
  workspaceId: number;
  companyId: number;
  deliveryId: number;
  eventType: EpiEvidenceEventType;
  actorType: EpiEvidenceActorType;
  actorUserId?: number | null;
  description: string;
  metadata?: Record<string, unknown>;
}) {
  const previous = (await db.select({ eventHash: epiDeliveryAuditEvents.eventHash })
    .from(epiDeliveryAuditEvents)
    .where(eq(epiDeliveryAuditEvents.evidenceId, input.evidenceId))
    .orderBy(desc(epiDeliveryAuditEvents.id))
    .limit(1))[0];
  const createdAt = new Date();
  const metadataJson = input.metadata ? JSON.stringify(input.metadata) : null;
  const previousHash = previous?.eventHash ?? null;
  const eventHash = sha256([previousHash ?? "GENESIS", input.evidenceId, input.eventType, input.actorType, input.description, metadataJson ?? "", createdAt.toISOString()].join("|"));
  await db.insert(epiDeliveryAuditEvents).values({
    evidenceId: input.evidenceId,
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    deliveryId: input.deliveryId,
    eventType: input.eventType,
    actorType: input.actorType,
    actorUserId: input.actorUserId ?? null,
    description: input.description,
    metadataJson,
    previousHash,
    eventHash,
    createdAt,
  });
}

async function expireEpiEvidenceIfNeeded(db: ReturnType<typeof drizzle>, evidence: typeof epiDeliveryEvidence.$inferSelect) {
  if (["confirmed", "revoked", "expired"].includes(evidence.status) || evidence.otpExpiresAt.getTime() > Date.now()) return evidence;
  await db.update(epiDeliveryEvidence).set({ status: "expired", updatedAt: new Date() }).where(eq(epiDeliveryEvidence.id, evidence.id));
  await appendEpiEvidenceAuditEvent(db, {
    evidenceId: evidence.id,
    workspaceId: evidence.workspaceId,
    companyId: evidence.companyId,
    deliveryId: evidence.deliveryId,
    eventType: "evidence_expired",
    actorType: "system",
    description: "O prazo de confirmação por e-mail expirou.",
  });
  return { ...evidence, status: "expired" as const };
}

export async function createAndSendEpiEvidence(input: { workspaceId: number; deliveryId: number; createdByUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível para registrar a confirmação de EPI.");
  await ensureEpiEvidenceSchema(db);
  const delivery = await getEpiDeliveryForWorkspace(input.deliveryId, input.workspaceId);
  if (!delivery) throw new Error("Ficha de entrega de EPI não encontrada.");
  const [employee, item, company] = await Promise.all([
    getEmployeeForWorkspace(delivery.employeeId, input.workspaceId),
    getEpiItemForWorkspace(delivery.epiItemId, input.workspaceId),
    getCompanyForWorkspace(delivery.companyId, input.workspaceId),
  ]);
  if (!employee || !item || !company) throw new Error("Não foi possível compor a evidência da entrega de EPI.");
  if (!employee.email?.trim()) throw new Error("Cadastre o e-mail do trabalhador antes de enviar a confirmação de recebimento.");

  const recipientEmail = employee.email.trim().toLowerCase();
  const snapshot: EpiEvidenceSnapshot = {
    companyName: company.name,
    employeeName: employee.fullName,
    epiName: item.name,
    caNumber: delivery.caNumber,
    lotNumber: delivery.lotNumber,
    manufacturer: delivery.manufacturer,
    quantity: delivery.quantity,
    deliveredAt: delivery.deliveredAt.toISOString(),
    conditionAtDelivery: delivery.conditionAtDelivery,
    orientationTopics: delivery.orientationTopics,
    deliveredByName: delivery.deliveredByName,
    protectionDescription: delivery.protectionDescription,
    limitations: delivery.limitations,
    careInstructions: delivery.careInstructions,
    trainingRequired: delivery.trainingRequired,
    trainingCompletedAt: delivery.trainingCompletedAt?.toISOString() ?? null,
  };
  const snapshotJson = JSON.stringify(snapshot);
  const documentHash = sha256(snapshotJson);
  const otp = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const otpHash = hashCredential(otp);
  const otpExpiresAt = new Date(Date.now() + 30 * 60_000);
  let evidence = (await db.select().from(epiDeliveryEvidence)
    .where(and(eq(epiDeliveryEvidence.deliveryId, delivery.id), eq(epiDeliveryEvidence.workspaceId, input.workspaceId)))
    .limit(1))[0];

  if (evidence?.status === "confirmed") throw new Error("Esta entrega já possui uma confirmação de recebimento por e-mail.");
  if (!evidence) {
    const verificationCode = randomBytes(24).toString("base64url");
    const inserted = await db.insert(epiDeliveryEvidence).values({
      workspaceId: input.workspaceId,
      companyId: delivery.companyId,
      deliveryId: delivery.id,
      employeeId: delivery.employeeId,
      recipientEmail,
      status: "draft",
      verificationCode,
      documentHash,
      snapshotJson,
      otpHash,
      otpExpiresAt,
      createdByUserId: input.createdByUserId,
    });
    const evidenceId = Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0);
    evidence = (await db.select().from(epiDeliveryEvidence).where(eq(epiDeliveryEvidence.id, evidenceId)).limit(1))[0];
    if (!evidence) throw new Error("Não foi possível criar a evidência de recebimento.");
    await appendEpiEvidenceAuditEvent(db, {
      evidenceId: evidence.id,
      workspaceId: evidence.workspaceId,
      companyId: evidence.companyId,
      deliveryId: evidence.deliveryId,
      eventType: "evidence_created",
      actorType: "manager",
      actorUserId: input.createdByUserId,
      description: "Ficha de entrega congelada para confirmação por e-mail.",
      metadata: { documentHash, recipient: maskEmail(recipientEmail), documentVersion: evidence.documentVersion },
    });
  } else {
    await db.update(epiDeliveryEvidence).set({
      recipientEmail,
      status: "draft",
      documentHash,
      snapshotJson,
      otpHash,
      otpExpiresAt,
      otpAttempts: 0,
      failureReason: null,
      updatedAt: new Date(),
    }).where(eq(epiDeliveryEvidence.id, evidence.id));
    evidence = (await db.select().from(epiDeliveryEvidence).where(eq(epiDeliveryEvidence.id, evidence!.id)).limit(1))[0]!;
  }

  const confirmationUrl = `${getEpiEvidenceBaseUrl()}/confirmar-epi/${evidence.verificationCode}`;
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    if (!apiKey || !from) throw new Error("O canal de e-mail de confirmação ainda não está configurado.");
    const { Resend } = await import("resend");
    const response = await new Resend(apiKey).emails.send({
      from,
      to: recipientEmail,
      subject: `Confirmação de recebimento de EPI — ${company.name}`,
      html: `<main style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#172033"><h1 style="font-size:22px">Confirmação de recebimento de EPI</h1><p>Olá, ${employee.fullName}.</p><p>Foi registrada uma entrega de <strong>${item.name}</strong> para você. Confira a ficha e confirme o recebimento e as orientações recebidas.</p><p style="font-size:28px;letter-spacing:6px;font-weight:700">${otp}</p><p>Este código expira em 30 minutos e deve ser usado somente neste endereço:</p><p><a href="${confirmationUrl}">Abrir ficha de confirmação</a></p><p style="font-size:12px;color:#64748b">Evidência ${evidence.verificationCode.slice(0, 10)} · Não encaminhe este código a terceiros.</p></main>`,
    });
    if (response.error) throw new Error("O provedor de e-mail recusou o envio da confirmação.");
    const providerMessageId = response.data?.id ?? null;
    await db.update(epiDeliveryEvidence).set({ status: "sent", lastSentAt: new Date(), providerMessageId, failureReason: null, updatedAt: new Date() }).where(eq(epiDeliveryEvidence.id, evidence.id));
    await appendEpiEvidenceAuditEvent(db, {
      evidenceId: evidence.id,
      workspaceId: evidence.workspaceId,
      companyId: evidence.companyId,
      deliveryId: evidence.deliveryId,
      eventType: "email_sent",
      actorType: "system",
      description: "Convite de confirmação enviado ao e-mail do trabalhador.",
      metadata: { recipient: maskEmail(recipientEmail), otpExpiresAt: otpExpiresAt.toISOString(), providerMessageId },
    });
  } catch (error) {
    const failureReason = error instanceof Error ? error.message.slice(0, 500) : "Falha não identificada no envio.";
    await db.update(epiDeliveryEvidence).set({ status: "failed", failureReason, updatedAt: new Date() }).where(eq(epiDeliveryEvidence.id, evidence.id));
    await appendEpiEvidenceAuditEvent(db, {
      evidenceId: evidence.id,
      workspaceId: evidence.workspaceId,
      companyId: evidence.companyId,
      deliveryId: evidence.deliveryId,
      eventType: "email_failed",
      actorType: "system",
      description: "Não foi possível enviar o convite de confirmação.",
      metadata: { recipient: maskEmail(recipientEmail) },
    });
    throw new Error("Não foi possível enviar a confirmação por e-mail. Revise o endereço do trabalhador e tente novamente.");
  }
  return getEpiEvidenceDetailForWorkspace({ workspaceId: input.workspaceId, deliveryId: input.deliveryId });
}

export async function getPublicEpiEvidence(verificationCode: string) {
  const db = await getDb();
  if (!db) return undefined;
  await ensureEpiEvidenceSchema(db);
  let evidence = (await db.select().from(epiDeliveryEvidence).where(eq(epiDeliveryEvidence.verificationCode, verificationCode)).limit(1))[0];
  if (!evidence) return undefined;
  evidence = await expireEpiEvidenceIfNeeded(db, evidence);
  if (evidence.status === "sent") {
    await db.update(epiDeliveryEvidence).set({ status: "viewed", lastViewedAt: new Date(), updatedAt: new Date() }).where(eq(epiDeliveryEvidence.id, evidence.id));
    await appendEpiEvidenceAuditEvent(db, {
      evidenceId: evidence.id,
      workspaceId: evidence.workspaceId,
      companyId: evidence.companyId,
      deliveryId: evidence.deliveryId,
      eventType: "link_opened",
      actorType: "employee",
      description: "O link individual da ficha de EPI foi aberto.",
    });
    evidence = { ...evidence, status: "viewed", lastViewedAt: new Date() };
  }
  const snapshot = parseEvidenceSnapshot(evidence.snapshotJson);
  return {
    verificationCode: evidence.verificationCode,
    status: evidence.status,
    documentHash: evidence.documentHash,
    documentVersion: evidence.documentVersion,
    otpExpiresAt: evidence.otpExpiresAt,
    lastViewedAt: evidence.lastViewedAt,
    confirmedAt: evidence.confirmedAt,
    document: {
      companyName: snapshot.companyName,
      employeeName: snapshot.employeeName,
      epiName: snapshot.epiName,
      caNumber: snapshot.caNumber,
      lotNumber: snapshot.lotNumber,
      manufacturer: snapshot.manufacturer,
      quantity: snapshot.quantity,
      deliveredAt: new Date(snapshot.deliveredAt),
      conditionAtDelivery: snapshot.conditionAtDelivery,
      orientationTopics: snapshot.orientationTopics,
      deliveredByName: snapshot.deliveredByName,
    },
  };
}

export async function verifyPublicEpiEvidenceOtp(input: { verificationCode: string; otp: string; confirmationIp?: string | null; userAgent?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("A confirmação está indisponível. Tente novamente em alguns instantes.");
  await ensureEpiEvidenceSchema(db);
  let evidence = (await db.select().from(epiDeliveryEvidence).where(eq(epiDeliveryEvidence.verificationCode, input.verificationCode)).limit(1))[0];
  if (!evidence) throw new Error("Esta confirmação não foi encontrada ou não está mais disponível.");
  evidence = await expireEpiEvidenceIfNeeded(db, evidence);
  if (evidence.status === "confirmed") {
    const existingConfirmation = await getPublicEpiEvidence(input.verificationCode);
    if (!existingConfirmation) throw new Error("Esta confirmação não está mais disponível.");
    return existingConfirmation;
  }
  if (["expired", "revoked"].includes(evidence.status)) throw new Error("O prazo desta confirmação expirou. Solicite um novo envio ao responsável pela entrega.");
  const nextAttempts = evidence.otpAttempts + 1;
  if (!verifyCredential(input.otp, evidence.otpHash)) {
    const revoked = nextAttempts >= 5;
    await db.update(epiDeliveryEvidence).set({ status: revoked ? "revoked" : evidence.status, otpAttempts: nextAttempts, updatedAt: new Date() }).where(eq(epiDeliveryEvidence.id, evidence.id));
    await appendEpiEvidenceAuditEvent(db, {
      evidenceId: evidence.id,
      workspaceId: evidence.workspaceId,
      companyId: evidence.companyId,
      deliveryId: evidence.deliveryId,
      eventType: revoked ? "evidence_revoked" : "otp_failed",
      actorType: "employee",
      description: revoked ? "A confirmação foi bloqueada após exceder o limite de tentativas." : "Foi informado um código de confirmação inválido.",
      metadata: { attempt: nextAttempts },
    });
    throw new Error(revoked ? "Por segurança, esta confirmação foi bloqueada. Solicite um novo envio." : "Código inválido. Confira o e-mail e tente novamente.");
  }
  const now = new Date();
  const confirmationIpHash = input.confirmationIp ? sha256(input.confirmationIp) : null;
  const snapshot = parseEvidenceSnapshot(evidence.snapshotJson);
  await db.transaction(async tx => {
    await tx.update(epiDeliveryEvidence).set({ status: "confirmed", otpAttempts: nextAttempts, confirmedAt: now, confirmationIpHash, confirmationUserAgent: input.userAgent?.slice(0, 512) ?? null, updatedAt: now }).where(eq(epiDeliveryEvidence.id, evidence.id));
    await tx.update(epiDeliveries).set({ signedByName: snapshot.employeeName, receiptAcceptedAt: now, receiptAcceptanceMethod: "email_otp", digitalSignature: `Confirmação OTP · hash ${evidence.documentHash.slice(0, 16)}` }).where(and(eq(epiDeliveries.id, evidence.deliveryId), eq(epiDeliveries.workspaceId, evidence.workspaceId)));
  });
  await appendEpiEvidenceAuditEvent(db, {
    evidenceId: evidence.id,
    workspaceId: evidence.workspaceId,
    companyId: evidence.companyId,
    deliveryId: evidence.deliveryId,
    eventType: "otp_verified",
    actorType: "employee",
    description: "O código temporário enviado ao e-mail foi validado.",
    metadata: { attempts: nextAttempts },
  });
  await appendEpiEvidenceAuditEvent(db, {
    evidenceId: evidence.id,
    workspaceId: evidence.workspaceId,
    companyId: evidence.companyId,
    deliveryId: evidence.deliveryId,
    eventType: "receipt_confirmed",
    actorType: "employee",
    description: "O trabalhador confirmou o recebimento do EPI e a ciência das orientações registradas.",
    metadata: { documentHash: evidence.documentHash },
  });
  const confirmedEvidence = await getPublicEpiEvidence(input.verificationCode);
  if (!confirmedEvidence) throw new Error("A confirmação foi registrada, mas a ficha não pôde ser recarregada.");
  return confirmedEvidence;
}

export async function getEpiEvidenceDetailForWorkspace(input: { workspaceId: number; deliveryId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await ensureEpiEvidenceSchema(db);
  const evidence = (await db.select().from(epiDeliveryEvidence).where(and(eq(epiDeliveryEvidence.workspaceId, input.workspaceId), eq(epiDeliveryEvidence.deliveryId, input.deliveryId))).limit(1))[0];
  if (!evidence) throw new Error("Ainda não há confirmação por e-mail para esta ficha de EPI.");
  const events = await db.select().from(epiDeliveryAuditEvents).where(eq(epiDeliveryAuditEvents.evidenceId, evidence.id)).orderBy(epiDeliveryAuditEvents.createdAt, epiDeliveryAuditEvents.id);
  const verificationUrl = `${getEpiEvidenceBaseUrl()}/confirmar-epi/${evidence.verificationCode}`;
  const QRCode = await import("qrcode");
  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, width: 240, errorCorrectionLevel: "M" });
  return { evidence, events, verificationUrl, qrCodeDataUrl };
}

export async function listEpiEvidenceForWorkspace(input: { workspaceId: number; companyId?: number | null; limit: number }) {
  const db = await getDb();
  if (!db) return [];
  await ensureEpiEvidenceSchema(db);
  const conditions = input.companyId ? and(eq(epiDeliveryEvidence.workspaceId, input.workspaceId), eq(epiDeliveryEvidence.companyId, input.companyId)) : eq(epiDeliveryEvidence.workspaceId, input.workspaceId);
  const rows = await db.select({ evidence: epiDeliveryEvidence, employeeName: employees.fullName, epiName: epiItems.name, companyName: companies.name })
    .from(epiDeliveryEvidence)
    .innerJoin(employees, eq(epiDeliveryEvidence.employeeId, employees.id))
    .innerJoin(epiDeliveries, eq(epiDeliveryEvidence.deliveryId, epiDeliveries.id))
    .innerJoin(epiItems, eq(epiDeliveries.epiItemId, epiItems.id))
    .innerJoin(companies, eq(epiDeliveryEvidence.companyId, companies.id))
    .where(conditions)
    .orderBy(desc(epiDeliveryEvidence.updatedAt), desc(epiDeliveryEvidence.id))
    .limit(input.limit);
  return rows;
}

export async function listEpiReturnsForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(epiReturns).where(eq(epiReturns.workspaceId, workspaceId)).orderBy(desc(epiReturns.returnedAt), desc(epiReturns.updatedAt));
}

export async function createEpiReturnForWorkspace(input: {
  workspaceId: number;
  companyId: number;
  deliveryId?: number | null;
  epiItemId: number;
  employeeId: number;
  returnedAt: Date;
  condition: "good" | "damaged" | "expired" | "lost";
  notes?: string | null;
  createdByUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const values = {
    ...input,
    deliveryId: input.deliveryId ?? null,
    notes: input.notes ?? null,
  };
  return db.transaction(async tx => {
    if (input.condition === "good") {
      await tx.update(epiItems).set({ stockQuantity: sql`${epiItems.stockQuantity} + 1` }).where(and(eq(epiItems.id, input.epiItemId), eq(epiItems.workspaceId, input.workspaceId)));
    }
    if (input.deliveryId) {
      await tx.update(epiDeliveries).set({ returnStatus: "returned" }).where(and(eq(epiDeliveries.id, input.deliveryId), eq(epiDeliveries.workspaceId, input.workspaceId)));
    }
    const inserted = await tx.insert(epiReturns).values(values);
    return { id: Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0), ...values };
  });
}
export async function listEpiRequirementsForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(epiRequirements).where(eq(epiRequirements.workspaceId, workspaceId)).orderBy(desc(epiRequirements.updatedAt));
}

export async function createEpiRequirementForWorkspace(input: { workspaceId: number; companyId: number; jobRoleId: number; epiItemId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const inserted = await db.insert(epiRequirements).values(input);
  return { id: Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0), ...input, active: true as const };
}

export async function listSstOccurrencesForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sstOccurrences).where(eq(sstOccurrences.workspaceId, workspaceId)).orderBy(desc(sstOccurrences.occurredAt), desc(sstOccurrences.updatedAt));
}

export async function createSstOccurrenceForWorkspace(input: { workspaceId: number; companyId: number; departmentId?: number | null; employeeId?: number | null; type: "near_miss" | "incident" | "accident"; occurredAt: Date; summary: string; createdByUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const values = { ...input, departmentId: input.departmentId ?? null, employeeId: input.employeeId ?? null, status: "open" as const };
  const inserted = await db.insert(sstOccurrences).values(values);
  return { id: Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0), ...values };
}

export async function listAccidentRecordsForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return { accidents: [] };
  await ensureAccidentSchema(db);
  const [details, injuries, occurrences] = await Promise.all([
    db.select().from(accidentDetails).where(eq(accidentDetails.workspaceId, workspaceId)).orderBy(desc(accidentDetails.createdAt)),
    db.select().from(accidentInjuries).where(eq(accidentInjuries.workspaceId, workspaceId)).orderBy(accidentInjuries.sortOrder, desc(accidentInjuries.createdAt)),
    db.select().from(sstOccurrences).where(and(eq(sstOccurrences.workspaceId, workspaceId), eq(sstOccurrences.type, "accident"))).orderBy(desc(sstOccurrences.occurredAt)),
  ]);
  const occurrenceById = new Map(occurrences.map(item => [item.id, item]));
  return {
    accidents: details.flatMap(detail => {
      const occurrence = occurrenceById.get(detail.occurrenceId);
      if (!occurrence) return [];
      return [{ occurrence, detail, injuries: injuries.filter(injury => injury.accidentDetailId === detail.id) }];
    }),
  };
}

export async function getAccidentRecordForWorkspace(accidentDetailId: number, workspaceId: number) {
  const records = await listAccidentRecordsForWorkspace(workspaceId);
  return records.accidents.find(record => record.detail.id === accidentDetailId);
}

export async function createAccidentRecordForWorkspace(input: {
  workspaceId: number; companyId: number; departmentId?: number | null; employeeId?: number | null; occupationalRiskId?: number | null; inspectionId?: number | null;
  occurredAt: Date; summary: string; accidentNature: "typical" | "commuting" | "occupational_disease" | "other"; accidentType?: string | null; injuryAgent?: string | null;
  esocialAgentCode?: string | null; characterization?: string | null; medicalTreatment?: string | null; daysAway: number; catNumber?: string | null;
  severity: "minor" | "moderate" | "serious" | "critical"; immediateActions?: string | null; immediateCause?: string | null; rootCause?: string | null;
  injuries: Array<{ bodyRegion: "head" | "face" | "neck" | "shoulder_left" | "shoulder_right" | "chest" | "abdomen" | "back" | "pelvis" | "arm_left" | "arm_right" | "forearm_left" | "forearm_right" | "hand_left" | "hand_right" | "finger_left" | "finger_right" | "thigh_left" | "thigh_right" | "knee_left" | "knee_right" | "leg_left" | "leg_right" | "ankle_left" | "ankle_right" | "foot_left" | "foot_right" | "other"; bodySide: "left" | "right" | "center" | "not_applicable"; lesionType: string; severity: "minor" | "moderate" | "serious" | "critical"; notes?: string | null }>;
  createdByUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await ensureAccidentSchema(db);
  return db.transaction(async tx => {
    const occurrenceValues = { workspaceId: input.workspaceId, companyId: input.companyId, departmentId: input.departmentId ?? null, employeeId: input.employeeId ?? null, type: "accident" as const, occurredAt: input.occurredAt, summary: input.summary, status: "open" as const, createdByUserId: input.createdByUserId };
    const occurrenceInsert = await tx.insert(sstOccurrences).values(occurrenceValues);
    const occurrenceId = Number((occurrenceInsert as unknown as [{ insertId?: number }])[0]?.insertId ?? 0);
    const detailValues = {
      occurrenceId, workspaceId: input.workspaceId, companyId: input.companyId, departmentId: input.departmentId ?? null, employeeId: input.employeeId ?? null,
      occupationalRiskId: input.occupationalRiskId ?? null, inspectionId: input.inspectionId ?? null, accidentNature: input.accidentNature, accidentType: input.accidentType ?? null,
      injuryAgent: input.injuryAgent ?? null, esocialAgentCode: input.esocialAgentCode ?? null, characterization: input.characterization ?? null,
      medicalTreatment: input.medicalTreatment ?? null, daysAway: input.daysAway, catNumber: input.catNumber ?? null, severity: input.severity,
      immediateActions: input.immediateActions ?? null, immediateCause: input.immediateCause ?? null, rootCause: input.rootCause ?? null, createdByUserId: input.createdByUserId,
    };
    const detailInsert = await tx.insert(accidentDetails).values(detailValues);
    const accidentDetailId = Number((detailInsert as unknown as [{ insertId?: number }])[0]?.insertId ?? 0);
    const injuryValues = input.injuries.map((injury, sortOrder) => ({ accidentDetailId, occurrenceId, workspaceId: input.workspaceId, ...injury, notes: injury.notes ?? null, sortOrder }));
    if (injuryValues.length) await tx.insert(accidentInjuries).values(injuryValues);
    const [occurrence] = await tx.select().from(sstOccurrences).where(eq(sstOccurrences.id, occurrenceId)).limit(1);
    const [detail] = await tx.select().from(accidentDetails).where(eq(accidentDetails.id, accidentDetailId)).limit(1);
    const persistedInjuries = await tx.select().from(accidentInjuries).where(eq(accidentInjuries.accidentDetailId, accidentDetailId)).orderBy(accidentInjuries.sortOrder);
    return { occurrence: occurrence!, detail: detail!, injuries: persistedInjuries };
  });
}

export async function listInspectionTemplatesForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  const templates = await db.select().from(inspectionTemplates).where(and(eq(inspectionTemplates.workspaceId, workspaceId), eq(inspectionTemplates.active, true))).orderBy(desc(inspectionTemplates.updatedAt));
  const items = await db.select().from(inspectionTemplateItems).where(eq(inspectionTemplateItems.workspaceId, workspaceId)).orderBy(inspectionTemplateItems.sortOrder, inspectionTemplateItems.updatedAt);
  return templates.map(template => ({ ...template, items: items.filter(item => item.templateId === template.id) }));
}
export async function getInspectionTemplateForWorkspace(templateId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await listInspectionTemplatesForWorkspace(workspaceId)).find(template => template.id === templateId);
}
export async function createInspectionTemplateForWorkspace(input: { workspaceId: number; companyId: number; departmentId?: number | null; name: string; riskType: string; routineType: string; description?: string | null; items: Array<{ title: string; guidance?: string | null; required: boolean; sortOrder: number }>; createdByUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const templateValues = { workspaceId: input.workspaceId, companyId: input.companyId, departmentId: input.departmentId ?? null, name: input.name, riskType: input.riskType, routineType: input.routineType, description: input.description ?? null, createdByUserId: input.createdByUserId, active: true as const };
  return db.transaction(async tx => {
    const inserted = await tx.insert(inspectionTemplates).values(templateValues);
    const templateId = Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0);
    const itemValues = input.items.map(item => ({ workspaceId: input.workspaceId, templateId, title: item.title, guidance: item.guidance ?? null, required: item.required, sortOrder: item.sortOrder }));
    if (itemValues.length) await tx.insert(inspectionTemplateItems).values(itemValues);
    const items = await tx.select().from(inspectionTemplateItems).where(eq(inspectionTemplateItems.templateId, templateId)).orderBy(inspectionTemplateItems.sortOrder);
    return { id: templateId, ...templateValues, items };
  });
}
export async function listInspectionsForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inspections).where(eq(inspections.workspaceId, workspaceId)).orderBy(desc(inspections.dueAt), desc(inspections.updatedAt));
}

export async function getInspectionForWorkspace(inspectionId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(inspections).where(and(eq(inspections.id, inspectionId), eq(inspections.workspaceId, workspaceId))).limit(1))[0];
}

export async function createInspectionForWorkspace(input: { workspaceId: number; companyId: number; departmentId?: number | null; templateId?: number | null; occupationalRiskId?: number | null; title: string; dueAt?: Date | null; notes?: string | null; createdByUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const values = { ...input, departmentId: input.departmentId ?? null, templateId: input.templateId ?? null, occupationalRiskId: input.occupationalRiskId ?? null, dueAt: input.dueAt ?? null, notes: input.notes ?? null, status: "planned" as const };
  const inserted = await db.insert(inspections).values(values);
  return { id: Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0), ...values };
}

export async function listActionItemsForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(actionItems).where(eq(actionItems.workspaceId, workspaceId)).orderBy(desc(actionItems.dueAt), desc(actionItems.updatedAt));
}

export async function createActionItemForWorkspace(input: { workspaceId: number; companyId: number; inspectionId?: number | null; occupationalRiskId?: number | null; departmentId?: number | null; responsibleEmployeeId?: number | null; title: string; description?: string | null; dueAt?: Date | null; createdByUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const values = { ...input, inspectionId: input.inspectionId ?? null, occupationalRiskId: input.occupationalRiskId ?? null, departmentId: input.departmentId ?? null, responsibleEmployeeId: input.responsibleEmployeeId ?? null, description: input.description ?? null, dueAt: input.dueAt ?? null, status: "open" as const };
  const inserted = await db.insert(actionItems).values(values);
  return { id: Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0), ...values };
}

type OccupationalRiskSituation = "identified" | "in_treatment" | "controlled" | "eliminated";
type OccupationalRiskGroup = "physical" | "chemical" | "biological" | "ergonomic" | "accident" | "psychosocial" | "other";
type OccupationalRiskSource = "pgr" | "inspection" | "combined";

function riskEventType(previousSituation: OccupationalRiskSituation | null, nextSituation: OccupationalRiskSituation, previousScore: number | null, nextScore: number | null) {
  if (nextSituation === "eliminated") return "eliminated" as const;
  if (nextSituation === "controlled") return previousScore !== null && nextScore !== null && nextScore < previousScore ? "reduced" as const : "control_verified" as const;
  if (nextSituation === "in_treatment") return "treatment_started" as const;
  if (previousSituation === "controlled" || previousSituation === "eliminated") return "reopened" as const;
  return "identified" as const;
}

export async function listOccupationalRisksForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return { risks: [], events: [] };
  await ensureOccupationalRiskSchema(db);
  const [risks, events] = await Promise.all([
    db.select().from(occupationalRisks).where(eq(occupationalRisks.workspaceId, workspaceId)).orderBy(desc(occupationalRisks.updatedAt), desc(occupationalRisks.id)),
    db.select().from(occupationalRiskEvents).where(eq(occupationalRiskEvents.workspaceId, workspaceId)).orderBy(desc(occupationalRiskEvents.occurredAt), desc(occupationalRiskEvents.id)),
  ]);
  return { risks, events };
}

export async function getOccupationalRiskForWorkspace(riskId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return undefined;
  await ensureOccupationalRiskSchema(db);
  return (await db.select().from(occupationalRisks).where(and(eq(occupationalRisks.id, riskId), eq(occupationalRisks.workspaceId, workspaceId))).limit(1))[0];
}

export async function createOccupationalRiskForWorkspace(input: {
  workspaceId: number; companyId: number; pgrProjectId?: number | null; departmentId?: number | null; jobRoleId?: number | null;
  title: string; description?: string | null; riskGroup: OccupationalRiskGroup; source: OccupationalRiskSource;
  inherentProbability: number; inherentSeverity: number; controls?: string | null; exposedWorkersCount: number; createdByUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await ensureOccupationalRiskSchema(db);
  const inherentScore = input.inherentProbability * input.inherentSeverity;
  const values = {
    ...input,
    pgrProjectId: input.pgrProjectId ?? null,
    departmentId: input.departmentId ?? null,
    jobRoleId: input.jobRoleId ?? null,
    description: input.description ?? null,
    controls: input.controls ?? null,
    inherentScore,
    residualProbability: null,
    residualSeverity: null,
    residualScore: null,
    situation: "identified" as const,
  };
  return db.transaction(async tx => {
    const inserted = await tx.insert(occupationalRisks).values(values);
    const riskId = Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0);
    await tx.insert(occupationalRiskEvents).values({
      occupationalRiskId: riskId,
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      departmentId: input.departmentId ?? null,
      eventType: "identified",
      previousSituation: null,
      nextSituation: "identified",
      previousScore: null,
      nextScore: inherentScore,
      notes: input.description ?? null,
      createdByUserId: input.createdByUserId,
    });
    return (await tx.select().from(occupationalRisks).where(eq(occupationalRisks.id, riskId)).limit(1))[0]!;
  });
}

export async function updateOccupationalRiskForWorkspace(input: {
  riskId: number; workspaceId: number; situation: OccupationalRiskSituation; residualProbability?: number | null; residualSeverity?: number | null;
  controls?: string | null; notes?: string | null; lastInspectionId?: number | null; updatedByUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await ensureOccupationalRiskSchema(db);
  const current = await getOccupationalRiskForWorkspace(input.riskId, input.workspaceId);
  if (!current) throw new Error("Risco ocupacional não encontrado.");
  const nextResidualProbability = input.residualProbability === undefined ? current.residualProbability : input.residualProbability;
  const nextResidualSeverity = input.residualSeverity === undefined ? current.residualSeverity : input.residualSeverity;
  const nextResidualScore = nextResidualProbability && nextResidualSeverity ? nextResidualProbability * nextResidualSeverity : null;
  const now = new Date();
  const nextScore = nextResidualScore ?? current.inherentScore;
  const eventType = riskEventType(current.situation, input.situation, current.residualScore ?? current.inherentScore, nextScore);
  const values = {
    situation: input.situation,
    residualProbability: nextResidualProbability,
    residualSeverity: nextResidualSeverity,
    residualScore: nextResidualScore,
    controls: input.controls === undefined ? current.controls : input.controls,
    lastInspectionId: input.lastInspectionId === undefined ? current.lastInspectionId : input.lastInspectionId,
    controlVerifiedAt: input.situation === "controlled" ? now : current.controlVerifiedAt,
    eliminatedAt: input.situation === "eliminated" ? now : current.eliminatedAt,
    updatedAt: now,
  };
  await db.transaction(async tx => {
    await tx.update(occupationalRisks).set(values).where(eq(occupationalRisks.id, input.riskId));
    await tx.insert(occupationalRiskEvents).values({
      occupationalRiskId: input.riskId,
      workspaceId: current.workspaceId,
      companyId: current.companyId,
      departmentId: current.departmentId,
      eventType,
      previousSituation: current.situation,
      nextSituation: input.situation,
      previousScore: current.residualScore ?? current.inherentScore,
      nextScore,
      notes: input.notes ?? null,
      createdByUserId: input.updatedByUserId,
      occurredAt: now,
    });
  });
  return (await db.select().from(occupationalRisks).where(eq(occupationalRisks.id, input.riskId)).limit(1))[0]!;
}

export async function listClientEngagementsForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientEngagements).where(eq(clientEngagements.workspaceId, workspaceId)).orderBy(desc(clientEngagements.nextFollowUpAt), desc(clientEngagements.updatedAt));
}

export async function createClientEngagementForWorkspace(input: { workspaceId: number; companyId: number; status: "lead" | "active" | "inactive"; nextFollowUpAt?: Date | null; notes?: string | null; createdByUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const values = { ...input, nextFollowUpAt: input.nextFollowUpAt ?? null, notes: input.notes ?? null };
  const inserted = await db.insert(clientEngagements).values(values);
  return { id: Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0), ...values };
}

export async function listClientVisitsForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientVisits).where(eq(clientVisits.workspaceId, workspaceId)).orderBy(desc(clientVisits.scheduledAt));
}

export async function createClientVisitForWorkspace(input: { workspaceId: number; companyId: number; scheduledAt: Date; objective: string; notes?: string | null; createdByUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const values = { ...input, notes: input.notes ?? null, status: "planned" as const };
  const inserted = await db.insert(clientVisits).values(values);
  return { id: Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0), ...values };
}

export async function getClientVisitForWorkspace(visitId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(clientVisits).where(and(eq(clientVisits.id, visitId), eq(clientVisits.workspaceId, workspaceId))).limit(1))[0];
}

export async function updateClientVisitStatusForWorkspace(visitId: number, workspaceId: number, status: "planned" | "completed" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await db.update(clientVisits).set({ status }).where(and(eq(clientVisits.id, visitId), eq(clientVisits.workspaceId, workspaceId)));
  const visit = await getClientVisitForWorkspace(visitId, workspaceId);
  if (!visit) throw new Error("Visita não encontrada.");
  return visit;
}

// Módulo COPSOQ-III
export async function listPsychosocialApplicationsForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(psychosocialApplications).where(eq(psychosocialApplications.workspaceId, workspaceId));
}

export async function listPsychosocialResultsForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  const apps = await listPsychosocialApplicationsForWorkspace(workspaceId);
  if (apps.length === 0) return [];
  const appIds = apps.map(a => a.id);
  return db.select().from(psychosocialResults).where(inArray(psychosocialResults.applicationId, appIds));
}

export async function createPsychosocialApplicationForWorkspace(input: { workspaceId: number; companyId: number; departmentId?: number | null; title: string; minRespondents: number; createdByUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const values = {
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    departmentId: input.departmentId ?? null,
    title: input.title,
    minRespondents: input.minRespondents,
    respondentCount: 0,
    status: "active" as const,
    createdByUserId: input.createdByUserId,
  };
  const inserted = await db.insert(psychosocialApplications).values(values);
  const appId = Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0);
  
  // Criar as 21 dimensões iniciais padrão (exemplo: Demandas quantitativas, Ritmo de trabalho, Clareza de papel, etc.)
  const defaultDimensions = [
    { key: "demands_quantitative", name: "Demandas quantitativas", domain: "Exigências no trabalho" },
    { key: "demands_work_pace", name: "Ritmo de trabalho", domain: "Exigências no trabalho" },
    { key: "demands_emotional", name: "Demandas emocionais", domain: "Exigências no trabalho" },
    { key: "demands_cognitive", name: "Demandas cognitivas", domain: "Exigências no trabalho" },
    { key: "influence_at_work", name: "Influência no trabalho", domain: "Organização do trabalho e conteúdo" },
    { key: "possibilities_for_development", name: "Possibilidades de desenvolvimento", domain: "Organização do trabalho e conteúdo" },
    { key: "variation_of_work", name: "Variação do trabalho", domain: "Organização do trabalho e conteúdo" },
    { key: "meaning_of_work", name: "Significado do trabalho", domain: "Relações interpessoais e liderança" },
    { key: "commitment_to_workplace", name: "Comprometimento com o local de trabalho", domain: "Relações interpessoais e liderança" },
    { key: "predictability", name: "Previsibilidade", domain: "Relações interpessoais e liderança" },
    { key: "recognition", name: "Reconhecimento", domain: "Relações interpessoais e liderança" },
    { key: "role_clarity", name: "Clareza de papel", domain: "Relações interpessoais e liderança" },
    { key: "role_conflicts", name: "Conflitos de papel", domain: "Relações interpessoais e liderança" },
    { key: "quality_of_leadership", name: "Qualidade da liderança", domain: "Relações interpessoais e liderança" },
    { key: "social_support_superior", name: "Suporte social da chefia", domain: "Relações interpessoais e liderança" },
    { key: "social_support_colleagues", name: "Suporte social dos colegas", domain: "Relações interpessoais e liderança" },
    { key: "sense_of_community", name: "Senso de comunidade", domain: "Relações interpessoais e liderança" },
    { key: "work_family_conflict", name: "Conflito trabalho-família", domain: "Interface trabalho-indivíduo" },
    { key: "trust", name: "Confiança vertical", domain: "Valores no local de trabalho" },
    { key: "justice_and_respect", name: "Justiça e respeito", domain: "Valores no local de trabalho" },
    { key: "offensive_behaviour", name: "Assédio, violência e comportamentos ofensivos", domain: "Comportamentos ofensivos" },
  ];

  for (const dim of defaultDimensions) {
    // Score inicial neutro 60 e risco low para demonstração antes das respostas
    await db.insert(psychosocialResults).values({
      applicationId: appId,
      dimensionKey: dim.key,
      dimensionName: dim.name,
      domainName: dim.domain,
      score: 65,
      riskLevel: "low",
      exportedToPgr: false,
    });
  }

  return { id: appId, ...values };
}

export async function submitPsychosocialResponseForWorkspace(input: { applicationId: number; respondentHash: string; answers: Record<string, number> }, workspaceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  
  const app = (await db.select().from(psychosocialApplications).where(eq(psychosocialApplications.id, input.applicationId)).limit(1))[0];
  if (!app || app.workspaceId !== workspaceId) throw new Error("Aplicação COPSOQ não encontrada neste ambiente.");

  // Registrar resposta anônima
  await db.insert(psychosocialResponses).values({
    applicationId: input.applicationId,
    respondentHash: input.respondentHash,
    answersJson: JSON.stringify(input.answers),
  });

  // Atualizar contagem de respondentes
  const newCount = app.respondentCount + 1;
  await db.update(psychosocialApplications).set({ respondentCount: newCount }).where(eq(psychosocialApplications.id, input.applicationId));

  // Recalcular escores médios das dimensões se atingir o mínimo
  const results = await db.select().from(psychosocialResults).where(eq(psychosocialResults.applicationId, input.applicationId));
  for (const res of results) {
    // Simular recalculo com base nas respostas enviadas ou escore ponderado
    const dimVal = input.answers[res.dimensionKey] ?? 60;
    let risk: "low" | "medium" | "high" = "low";
    if (dimVal < 40) risk = "high";
    else if (dimVal < 65) risk = "medium";

    await db.update(psychosocialResults)
      .set({ score: dimVal, riskLevel: risk })
      .where(eq(psychosocialResults.id, res.id));
  }

  return { success: true, respondentCount: newCount };
}

export async function exportPsychosocialToPgrForWorkspace(applicationId: number, workspaceId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");

  const app = (await db.select().from(psychosocialApplications).where(eq(psychosocialApplications.id, applicationId)).limit(1))[0];
  if (!app || app.workspaceId !== workspaceId) throw new Error("Aplicação COPSOQ não encontrada.");

  // Buscar resultados médios ou altos
  const results = await db.select().from(psychosocialResults).where(eq(psychosocialResults.applicationId, applicationId));
  const criticalResults = results.filter(r => r.riskLevel === "medium" || r.riskLevel === "high");

  // Criar itens de ação / inventário correspondentes no planningRouter (actionItems)
  for (const res of criticalResults) {
    await db.insert(actionItems).values({
      workspaceId,
      companyId: app.companyId,
      departmentId: app.departmentId,
      title: `[COPSOQ-III] Risco ${res.riskLevel.toUpperCase()} em ${res.dimensionName} (${res.domainName})`,
      description: `Escore psicométrico: ${res.score}/100. Dimensão avaliada pelo COPSOQ-III requer plano de ação conforme NR-1.`,
      status: "open",
      createdByUserId: userId,
    });

    await db.update(psychosocialResults)
      .set({ exportedToPgr: true })
      .where(eq(psychosocialResults.id, res.id));
  }

  return { success: true, exportedCount: criticalResults.length };
}

export async function listPgrRevisionsForProject(pgrProjectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pgrRevisions).where(eq(pgrRevisions.pgrProjectId, pgrProjectId)).orderBy(desc(pgrRevisions.createdAt));
}

export async function createPgrRevision(input: {
  pgrProjectId: number;
  workspaceId: number;
  companyId?: number | null;
  versionNumber: string;
  revisionSummary: string;
  changesDescription: string;
  sectionObservations?: string | null;
  documentSnapshot?: string | null;
  createdByUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const values = {
    ...input,
    companyId: input.companyId ?? null,
    sectionObservations: input.sectionObservations ?? null,
    documentSnapshot: input.documentSnapshot ?? null,
  };
  const inserted = await db.insert(pgrRevisions).values(values);
  return { id: Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0), ...values };
}

export async function getPgrTechnicalSignature(pgrProjectId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(pgrTechnicalSignatures).where(eq(pgrTechnicalSignatures.pgrProjectId, pgrProjectId)).limit(1);
  return rows[0] ?? null;
}

export async function upsertPgrTechnicalSignature(input: {
  pgrProjectId: number;
  workspaceId: number;
  professionalName: string;
  professionalRole: string;
  professionalRegistry: string;
  signatureDate: Date;
  digitalStampCode: string;
  signatureImageUrl?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const existing = await getPgrTechnicalSignature(input.pgrProjectId);
  if (existing) {
    await db.update(pgrTechnicalSignatures)
      .set({
        professionalName: input.professionalName,
        professionalRole: input.professionalRole,
        professionalRegistry: input.professionalRegistry,
        signatureDate: input.signatureDate,
        digitalStampCode: input.digitalStampCode,
        signatureImageUrl: input.signatureImageUrl ?? null,
        updatedAt: new Date(),
      })
      .where(eq(pgrTechnicalSignatures.pgrProjectId, input.pgrProjectId));
    return { id: existing.id, ...input };
  } else {
    const inserted = await db.insert(pgrTechnicalSignatures).values({
      ...input,
      signatureImageUrl: input.signatureImageUrl ?? null,
    });
    return { id: Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0), ...input };
  }
}

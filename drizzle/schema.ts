import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  accessStatus: mysqlEnum("accessStatus", ["active", "suspended"]).default("active").notNull(),
  accessExpiresAt: timestamp("accessExpiresAt"),
  passwordHash: varchar("passwordHash", { length: 255 }),
  passwordResetTokenHash: varchar("passwordResetTokenHash", { length: 128 }),
  passwordResetExpiresAt: timestamp("passwordResetExpiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const accessRequests = mysqlTable("access_requests", {
  id: int("id").autoincrement().primaryKey(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  phone: varchar("phone", { length: 32 }),
  companyName: varchar("companyName", { length: 255 }),
  jobTitle: varchar("jobTitle", { length: 160 }),
  status: mysqlEnum("status", ["requested", "approved", "rejected"]).default("requested").notNull(),
  credentialHash: varchar("credentialHash", { length: 255 }),
  accessExpiresAt: timestamp("accessExpiresAt"),
  approvedByUserId: int("approvedByUserId"),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("access_requests_status_idx").on(table.status, table.createdAt)]);

export const workspaces = mysqlTable("workspaces", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  kind: mysqlEnum("kind", ["autonomo", "clt"]).notNull(),
  ownerUserId: int("ownerUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("workspaces_owner_kind_unique").on(table.ownerUserId, table.kind)]);

export const workspaceMembers = mysqlTable("workspace_members", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "manager", "member"]).default("member").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("workspace_member_unique").on(table.workspaceId, table.userId),
  index("workspace_members_user_idx").on(table.userId),
]);

export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  document: varchar("document", { length: 32 }),
  logoKey: varchar("logoKey", { length: 512 }),
  logoUrl: varchar("logoUrl", { length: 1024 }),
  brandPrimaryColor: varchar("brandPrimaryColor", { length: 7 }),
  brandBackgroundColor: varchar("brandBackgroundColor", { length: 7 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("companies_workspace_idx").on(table.workspaceId)]);

export const clientEngagements = mysqlTable("client_engagements", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  companyId: int("companyId").notNull(),
  status: mysqlEnum("status", ["lead", "active", "inactive"]).default("lead").notNull(),
  nextFollowUpAt: timestamp("nextFollowUpAt"),
  notes: varchar("notes", { length: 1500 }),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("client_engagements_company_unique").on(table.companyId),
  index("client_engagements_workspace_idx").on(table.workspaceId),
  index("client_engagements_status_idx").on(table.workspaceId, table.status),
  index("client_engagements_follow_up_idx").on(table.workspaceId, table.nextFollowUpAt),
]);

export const clientVisits = mysqlTable("client_visits", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  companyId: int("companyId").notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  objective: varchar("objective", { length: 500 }).notNull(),
  notes: varchar("notes", { length: 1500 }),
  status: mysqlEnum("status", ["planned", "completed", "cancelled"]).default("planned").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("client_visits_workspace_idx").on(table.workspaceId),
  index("client_visits_company_idx").on(table.companyId),
  index("client_visits_status_idx").on(table.workspaceId, table.status),
  index("client_visits_scheduled_idx").on(table.workspaceId, table.scheduledAt),
]);

export const departments = mysqlTable("departments", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  companyId: int("companyId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  description: varchar("description", { length: 1000 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("departments_workspace_idx").on(table.workspaceId),
  index("departments_company_idx").on(table.companyId),
  uniqueIndex("departments_company_name_unique").on(table.companyId, table.name),
]);

export const jobRoles = mysqlTable("job_roles", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  companyId: int("companyId").notNull(),
  departmentId: int("departmentId"),
  name: varchar("name", { length: 160 }).notNull(),
  description: varchar("description", { length: 1000 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("job_roles_workspace_idx").on(table.workspaceId),
  index("job_roles_company_idx").on(table.companyId),
  index("job_roles_department_idx").on(table.departmentId),
  uniqueIndex("job_roles_company_department_name_unique").on(table.companyId, table.departmentId, table.name),
]);

export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  companyId: int("companyId").notNull(),
  departmentId: int("departmentId"),
  jobRoleId: int("jobRoleId"),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  cpf: varchar("cpf", { length: 24 }),
  email: varchar("email", { length: 320 }),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  hiredAt: timestamp("hiredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("employees_workspace_idx").on(table.workspaceId),
  index("employees_company_idx").on(table.companyId),
  index("employees_department_idx").on(table.departmentId),
  index("employees_job_role_idx").on(table.jobRoleId),
  index("employees_status_idx").on(table.workspaceId, table.status),
  index("employees_workspace_email_idx").on(table.workspaceId, table.email),
]);

export const epiItems = mysqlTable("epi_items", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  companyId: int("companyId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  imageUrl: varchar("imageUrl", { length: 2048 }),
  responsibleName: varchar("responsibleName", { length: 255 }),
  renewalRequested: boolean("renewalRequested").default(false).notNull(),
  caNumber: varchar("caNumber", { length: 64 }),
  manufacturer: varchar("manufacturer", { length: 160 }),
  lotNumber: varchar("lotNumber", { length: 100 }),
  caExpiresAt: timestamp("caExpiresAt"),
  equipmentExpiresAt: timestamp("equipmentExpiresAt"),
  protectionDescription: varchar("protectionDescription", { length: 1000 }),
  limitations: varchar("limitations", { length: 1000 }),
  careInstructions: varchar("careInstructions", { length: 1500 }),
  manualUrl: varchar("manualUrl", { length: 2048 }),
  requiresTraining: boolean("requiresTraining").default(false).notNull(),
  stockQuantity: int("stockQuantity").default(0).notNull(),
  minimumStock: int("minimumStock").default(0).notNull(),
  expiresAt: timestamp("expiresAt"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("epi_items_workspace_idx").on(table.workspaceId),
  index("epi_items_company_idx").on(table.companyId),
  index("epi_items_expiry_idx").on(table.workspaceId, table.expiresAt),
]);

export const epiRequirements = mysqlTable("epi_requirements", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  companyId: int("companyId").notNull(),
  jobRoleId: int("jobRoleId").notNull(),
  epiItemId: int("epiItemId").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("epi_requirements_role_item_unique").on(table.jobRoleId, table.epiItemId),
  index("epi_requirements_workspace_idx").on(table.workspaceId),
  index("epi_requirements_company_idx").on(table.companyId),
]);

export const epiDeliveries = mysqlTable("epi_deliveries", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  companyId: int("companyId").notNull(),
  epiItemId: int("epiItemId").notNull(),
  employeeId: int("employeeId").notNull(),
  quantity: int("quantity").default(1).notNull(),
  deliveryKind: mysqlEnum("deliveryKind", ["initial", "replacement"]).default("initial").notNull(),
  deliveryReason: mysqlEnum("deliveryReason", ["initial", "scheduled_replacement", "damage", "loss", "expiry", "hygiene", "other"]).default("initial").notNull(),
  sourceDeliveryId: int("sourceDeliveryId"),
  deliveredAt: timestamp("deliveredAt").notNull(),
  replacementDueAt: timestamp("replacementDueAt"),
  lotNumber: varchar("lotNumber", { length: 100 }),
  caNumber: varchar("caNumber", { length: 64 }),
  manufacturer: varchar("manufacturer", { length: 160 }),
  protectionDescription: varchar("protectionDescription", { length: 1000 }),
  limitations: varchar("limitations", { length: 1000 }),
  careInstructions: varchar("careInstructions", { length: 1500 }),
  conditionAtDelivery: mysqlEnum("conditionAtDelivery", ["new", "sanitized", "inspected"]).default("new").notNull(),
  orientationTopics: varchar("orientationTopics", { length: 1000 }),
  orientationConfirmedAt: timestamp("orientationConfirmedAt"),
  trainingRequired: boolean("trainingRequired").default(false).notNull(),
  trainingCompletedAt: timestamp("trainingCompletedAt"),
  deliveredByName: varchar("deliveredByName", { length: 255 }),
  receiptAcceptedAt: timestamp("receiptAcceptedAt"),
  receiptAcceptanceMethod: mysqlEnum("receiptAcceptanceMethod", ["internal_confirmation", "email_otp", "biometric", "qualified_signature"]).default("internal_confirmation").notNull(),
  notes: varchar("notes", { length: 1000 }),
  signedByName: varchar("signedByName", { length: 255 }),
  digitalSignature: varchar("digitalSignature", { length: 255 }),
  returnStatus: mysqlEnum("returnStatus", ["delivered", "returned", "replaced"]).default("delivered").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("epi_deliveries_workspace_idx").on(table.workspaceId),
  index("epi_deliveries_company_idx").on(table.companyId),
  index("epi_deliveries_epi_idx").on(table.workspaceId, table.epiItemId),
  index("epi_deliveries_employee_idx").on(table.workspaceId, table.employeeId),
  index("epi_deliveries_replacement_idx").on(table.workspaceId, table.replacementDueAt),
  index("epi_deliveries_ca_lot_idx").on(table.workspaceId, table.caNumber, table.lotNumber),
  index("epi_deliveries_source_idx").on(table.workspaceId, table.sourceDeliveryId),
]);

export const epiDeliveryEvidence = mysqlTable("epi_delivery_evidence", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  companyId: int("companyId").notNull(),
  deliveryId: int("deliveryId").notNull().unique(),
  employeeId: int("employeeId").notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  status: mysqlEnum("status", ["draft", "sent", "viewed", "confirmed", "expired", "revoked", "failed"]).default("draft").notNull(),
  verificationCode: varchar("verificationCode", { length: 64 }).notNull().unique(),
  documentHash: varchar("documentHash", { length: 64 }).notNull(),
  documentVersion: varchar("documentVersion", { length: 32 }).default("nr06-otp-v1").notNull(),
  snapshotJson: text("snapshotJson").notNull(),
  otpHash: varchar("otpHash", { length: 255 }).notNull(),
  otpExpiresAt: timestamp("otpExpiresAt").notNull(),
  otpAttempts: int("otpAttempts").default(0).notNull(),
  lastSentAt: timestamp("lastSentAt"),
  lastViewedAt: timestamp("lastViewedAt"),
  confirmedAt: timestamp("confirmedAt"),
  confirmationIpHash: varchar("confirmationIpHash", { length: 64 }),
  confirmationUserAgent: varchar("confirmationUserAgent", { length: 512 }),
  providerMessageId: varchar("providerMessageId", { length: 160 }),
  failureReason: varchar("failureReason", { length: 500 }),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("epi_delivery_evidence_verification_code_unique").on(table.verificationCode),
  index("epi_delivery_evidence_workspace_idx").on(table.workspaceId, table.status, table.createdAt),
  index("epi_delivery_evidence_company_idx").on(table.companyId, table.status),
  index("epi_delivery_evidence_employee_idx").on(table.workspaceId, table.employeeId),
]);

export const epiDeliveryAuditEvents = mysqlTable("epi_delivery_audit_events", {
  id: int("id").autoincrement().primaryKey(),
  evidenceId: int("evidenceId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  companyId: int("companyId").notNull(),
  deliveryId: int("deliveryId").notNull(),
  eventType: mysqlEnum("eventType", ["evidence_created", "email_sent", "email_failed", "link_opened", "otp_failed", "otp_verified", "receipt_confirmed", "evidence_expired", "evidence_revoked", "support_viewed"]).notNull(),
  actorType: mysqlEnum("actorType", ["manager", "employee", "system", "support"]).notNull(),
  actorUserId: int("actorUserId"),
  description: varchar("description", { length: 1000 }).notNull(),
  metadataJson: text("metadataJson"),
  previousHash: varchar("previousHash", { length: 64 }),
  eventHash: varchar("eventHash", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("epi_delivery_audit_evidence_idx").on(table.evidenceId, table.createdAt),
  index("epi_delivery_audit_workspace_idx").on(table.workspaceId, table.companyId, table.createdAt),
  uniqueIndex("epi_delivery_audit_event_hash_unique").on(table.eventHash),
]);

export const epiReturns = mysqlTable("epi_returns", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  companyId: int("companyId").notNull(),
  deliveryId: int("deliveryId"),
  epiItemId: int("epiItemId").notNull(),
  employeeId: int("employeeId").notNull(),
  returnedAt: timestamp("returnedAt").notNull(),
  condition: mysqlEnum("condition", ["good", "damaged", "expired", "lost"]).notNull(),
  notes: varchar("notes", { length: 1000 }),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("epi_returns_workspace_idx").on(table.workspaceId),
  index("epi_returns_company_idx").on(table.companyId),
  index("epi_returns_employee_idx").on(table.workspaceId, table.employeeId),
]);
export const sstOccurrences = mysqlTable("sst_occurrences", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  companyId: int("companyId").notNull(),
  departmentId: int("departmentId"),
  employeeId: int("employeeId"),
  type: mysqlEnum("type", ["near_miss", "incident", "accident"]).notNull(),
  occurredAt: timestamp("occurredAt").notNull(),
  summary: varchar("summary", { length: 1000 }).notNull(),
  status: mysqlEnum("status", ["open", "under_review", "closed"]).default("open").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("sst_occurrences_workspace_idx").on(table.workspaceId),
  index("sst_occurrences_company_idx").on(table.companyId),
  index("sst_occurrences_status_idx").on(table.workspaceId, table.status),
  index("sst_occurrences_occurred_at_idx").on(table.workspaceId, table.occurredAt),
]);

export const accidentDetails = mysqlTable("accident_details", {
  id: int("id").autoincrement().primaryKey(),
  occurrenceId: int("occurrenceId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  companyId: int("companyId").notNull(),
  departmentId: int("departmentId"),
  employeeId: int("employeeId"),
  occupationalRiskId: int("occupationalRiskId"),
  inspectionId: int("inspectionId"),
  accidentNature: mysqlEnum("accidentNature", ["typical", "commuting", "occupational_disease", "other"]).default("typical").notNull(),
  accidentType: varchar("accidentType", { length: 160 }),
  injuryAgent: varchar("injuryAgent", { length: 255 }),
  esocialAgentCode: varchar("esocialAgentCode", { length: 64 }),
  characterization: varchar("characterization", { length: 160 }),
  medicalTreatment: varchar("medicalTreatment", { length: 255 }),
  daysAway: int("daysAway").default(0).notNull(),
  catNumber: varchar("catNumber", { length: 64 }),
  severity: mysqlEnum("severity", ["minor", "moderate", "serious", "critical"]).default("minor").notNull(),
  immediateActions: text("immediateActions"),
  immediateCause: text("immediateCause"),
  rootCause: text("rootCause"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("accident_details_occurrence_unique").on(table.occurrenceId),
  index("accident_details_workspace_idx").on(table.workspaceId, table.severity),
  index("accident_details_company_idx").on(table.companyId, table.departmentId),
  index("accident_details_risk_idx").on(table.occupationalRiskId),
]);

export const accidentInjuries = mysqlTable("accident_injuries", {
  id: int("id").autoincrement().primaryKey(),
  accidentDetailId: int("accidentDetailId").notNull(),
  occurrenceId: int("occurrenceId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  bodyRegion: mysqlEnum("bodyRegion", ["head", "face", "neck", "shoulder_left", "shoulder_right", "chest", "abdomen", "back", "pelvis", "arm_left", "arm_right", "forearm_left", "forearm_right", "hand_left", "hand_right", "finger_left", "finger_right", "thigh_left", "thigh_right", "knee_left", "knee_right", "leg_left", "leg_right", "ankle_left", "ankle_right", "foot_left", "foot_right", "other"]).notNull(),
  bodySide: mysqlEnum("bodySide", ["left", "right", "center", "not_applicable"]).default("not_applicable").notNull(),
  lesionType: varchar("lesionType", { length: 160 }).notNull(),
  severity: mysqlEnum("severity", ["minor", "moderate", "serious", "critical"]).default("minor").notNull(),
  notes: varchar("notes", { length: 1000 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("accident_injuries_detail_idx").on(table.accidentDetailId, table.sortOrder),
  index("accident_injuries_occurrence_idx").on(table.occurrenceId),
  index("accident_injuries_workspace_region_idx").on(table.workspaceId, table.bodyRegion),
]);

export const inspectionTemplates = mysqlTable("inspection_templates", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  companyId: int("companyId").notNull(),
  departmentId: int("departmentId"),
  name: varchar("name", { length: 255 }).notNull(),
  riskType: varchar("riskType", { length: 120 }).notNull(),
  routineType: varchar("routineType", { length: 120 }).notNull(),
  description: varchar("description", { length: 1500 }),
  active: boolean("active").default(true).notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("inspection_templates_workspace_idx").on(table.workspaceId),
  index("inspection_templates_company_idx").on(table.companyId),
  index("inspection_templates_department_idx").on(table.departmentId),
  index("inspection_templates_active_idx").on(table.workspaceId, table.active),
]);

export const inspectionTemplateItems = mysqlTable("inspection_template_items", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  templateId: int("templateId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  guidance: varchar("guidance", { length: 1000 }),
  required: boolean("required").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("inspection_template_items_workspace_idx").on(table.workspaceId),
  index("inspection_template_items_template_idx").on(table.templateId, table.sortOrder),
]);

export const occupationalRisks = mysqlTable("occupational_risks", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  companyId: int("companyId").notNull(),
  pgrProjectId: int("pgrProjectId"),
  departmentId: int("departmentId"),
  jobRoleId: int("jobRoleId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: varchar("description", { length: 1500 }),
  riskGroup: mysqlEnum("riskGroup", ["physical", "chemical", "biological", "ergonomic", "accident", "psychosocial", "other"]).notNull(),
  source: mysqlEnum("source", ["pgr", "inspection", "combined"]).default("pgr").notNull(),
  inherentProbability: int("inherentProbability").notNull(),
  inherentSeverity: int("inherentSeverity").notNull(),
  inherentScore: int("inherentScore").notNull(),
  residualProbability: int("residualProbability"),
  residualSeverity: int("residualSeverity"),
  residualScore: int("residualScore"),
  situation: mysqlEnum("situation", ["identified", "in_treatment", "controlled", "eliminated"]).default("identified").notNull(),
  controls: varchar("controls", { length: 1500 }),
  exposedWorkersCount: int("exposedWorkersCount").default(0).notNull(),
  identifiedAt: timestamp("identifiedAt").defaultNow().notNull(),
  controlVerifiedAt: timestamp("controlVerifiedAt"),
  eliminatedAt: timestamp("eliminatedAt"),
  lastInspectionId: int("lastInspectionId"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("occupational_risks_workspace_idx").on(table.workspaceId, table.situation),
  index("occupational_risks_company_idx").on(table.companyId, table.departmentId),
  index("occupational_risks_pgr_idx").on(table.pgrProjectId),
]);

export const occupationalRiskEvents = mysqlTable("occupational_risk_events", {
  id: int("id").autoincrement().primaryKey(),
  occupationalRiskId: int("occupationalRiskId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  companyId: int("companyId").notNull(),
  departmentId: int("departmentId"),
  eventType: mysqlEnum("eventType", ["identified", "treatment_started", "control_verified", "reduced", "eliminated", "reopened"]).notNull(),
  previousSituation: varchar("previousSituation", { length: 64 }),
  nextSituation: varchar("nextSituation", { length: 64 }),
  previousScore: int("previousScore"),
  nextScore: int("nextScore"),
  notes: varchar("notes", { length: 1500 }),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("occupational_risk_events_risk_idx").on(table.occupationalRiskId, table.occurredAt),
  index("occupational_risk_events_workspace_idx").on(table.workspaceId, table.occurredAt),
]);

export const inspections = mysqlTable("inspections", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  companyId: int("companyId").notNull(),
  departmentId: int("departmentId"),
  templateId: int("templateId"),
  occupationalRiskId: int("occupationalRiskId"),
  title: varchar("title", { length: 255 }).notNull(),
  dueAt: timestamp("dueAt"),
  completedAt: timestamp("completedAt"),
  notes: varchar("notes", { length: 1500 }),
  status: mysqlEnum("status", ["planned", "completed"]).default("planned").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("inspections_workspace_idx").on(table.workspaceId),
  index("inspections_company_idx").on(table.companyId),
  index("inspections_status_idx").on(table.workspaceId, table.status),
  index("inspections_due_at_idx").on(table.workspaceId, table.dueAt),
]);

export const actionItems = mysqlTable("action_items", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  companyId: int("companyId").notNull(),
  inspectionId: int("inspectionId"),
  occupationalRiskId: int("occupationalRiskId"),
  departmentId: int("departmentId"),
  responsibleEmployeeId: int("responsibleEmployeeId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: varchar("description", { length: 1500 }),
  dueAt: timestamp("dueAt"),
  status: mysqlEnum("status", ["open", "in_progress", "completed"]).default("open").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("action_items_workspace_idx").on(table.workspaceId),
  index("action_items_company_idx").on(table.companyId),
  index("action_items_status_idx").on(table.workspaceId, table.status),
  index("action_items_due_at_idx").on(table.workspaceId, table.dueAt),
]);

export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  planCode: varchar("planCode", { length: 64 }).notNull(),
  // Cache mínimo do status para proteger a aplicação sem chamada ao provedor em cada tela.
  status: varchar("status", { length: 64 }).notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("subscriptions_customer_idx").on(table.stripeCustomerId)]);

export const adminAccessAudit = mysqlTable("admin_access_audit", {
  id: int("id").autoincrement().primaryKey(),
  targetUserId: int("targetUserId").notNull(),
  adminUserId: int("adminUserId").notNull(),
  action: mysqlEnum("action", ["renew", "suspend", "reactivate", "disable"]).notNull(),
  previousStatus: varchar("previousStatus", { length: 64 }),
  nextStatus: varchar("nextStatus", { length: 64 }),
  previousExpiresAt: timestamp("previousExpiresAt"),
  nextExpiresAt: timestamp("nextExpiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("admin_access_audit_target_idx").on(table.targetUserId, table.createdAt),
  index("admin_access_audit_admin_idx").on(table.adminUserId, table.createdAt),
]);

export const pgrProjects = mysqlTable("pgr_projects", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  companyId: int("companyId"),
  name: varchar("name", { length: 255 }).notNull(),
  legacyStorageKey: varchar("legacyStorageKey", { length: 255 }).notNull().unique(),
  consultancyName: varchar("consultancyName", { length: 255 }),
  consultancyLogoUrl: varchar("consultancyLogoUrl", { length: 2048 }),
  riskMapImageUrl: varchar("riskMapImageUrl", { length: 2048 }),
  visualMatrixImageUrl: varchar("visualMatrixImageUrl", { length: 2048 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("pgr_projects_workspace_idx").on(table.workspaceId)]);

export const pgrRevisions = mysqlTable("pgr_revisions", {
  id: int("id").autoincrement().primaryKey(),
  pgrProjectId: int("pgrProjectId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  companyId: int("companyId"),
  versionNumber: varchar("versionNumber", { length: 32 }).notNull(),
  revisionSummary: text("revisionSummary").notNull(),
  changesDescription: text("changesDescription").notNull(),
  sectionObservations: text("sectionObservations"),
  documentSnapshot: text("documentSnapshot"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("pgr_revisions_project_idx").on(table.pgrProjectId),
  index("pgr_revisions_workspace_idx").on(table.workspaceId),
]);

export const pgrTechnicalSignatures = mysqlTable("pgr_technical_signatures", {
  id: int("id").autoincrement().primaryKey(),
  pgrProjectId: int("pgrProjectId").notNull().unique(),
  workspaceId: int("workspaceId").notNull(),
  professionalName: varchar("professionalName", { length: 255 }).notNull(),
  professionalRole: varchar("professionalRole", { length: 128 }).notNull().default("Técnico em Segurança do Trabalho"),
  professionalRegistry: varchar("professionalRegistry", { length: 64 }).notNull(),
  signatureDate: timestamp("signatureDate").notNull(),
  digitalStampCode: varchar("digitalStampCode", { length: 128 }).notNull(),
  signatureImageUrl: varchar("signatureImageUrl", { length: 2048 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("pgr_signatures_project_idx").on(table.pgrProjectId),
]);

export const pgrAttachments = mysqlTable("pgr_attachments", {
  id: int("id").autoincrement().primaryKey(),
  pgrProjectId: int("pgrProjectId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  title: varchar("title", { length: 128 }).notNull(),
  category: mysqlEnum("category", ["photo", "laudo", "art", "certificate", "other"]).default("photo").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 2048 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("pgr_attachments_project_idx").on(table.pgrProjectId),
  index("pgr_attachments_workspace_idx").on(table.workspaceId),
]);

export const certificates = mysqlTable("certificates", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  companyId: int("companyId"),
  category: mysqlEnum("category", ["certificate", "pgr", "ltcat", "os", "pcmat", "laudo", "other"]).default("certificate").notNull(),
  participantName: varchar("participantName", { length: 255 }).notNull(),
  trainingName: varchar("trainingName", { length: 255 }).notNull(),
  issuedAt: timestamp("issuedAt").notNull(),
  expiresAt: timestamp("expiresAt"),
  referenceUrl: varchar("referenceUrl", { length: 2048 }),
  notes: varchar("notes", { length: 1500 }),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("certificates_workspace_idx").on(table.workspaceId),
  index("certificates_company_idx").on(table.companyId),
  index("certificates_category_idx").on(table.workspaceId, table.category),
]);

export const trainings = mysqlTable("trainings", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  companyId: int("companyId"),
  title: varchar("title", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["planned", "completed"]).default("planned").notNull(),
  scheduledAt: timestamp("scheduledAt"),
  scheduledDatesJson: text("scheduledDatesJson"),
  instructorName: varchar("instructorName", { length: 255 }),
  location: varchar("location", { length: 255 }),
  participantCount: int("participantCount").default(0).notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("trainings_workspace_idx").on(table.workspaceId),
  index("trainings_company_idx").on(table.companyId),
]);

export const trainingParticipants = mysqlTable("training_participants", {
  id: int("id").autoincrement().primaryKey(),
  trainingId: int("trainingId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  employeeId: int("employeeId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("training_participants_training_employee_unique").on(table.trainingId, table.employeeId),
  index("training_participants_workspace_idx").on(table.workspaceId, table.trainingId),
  index("training_participants_employee_idx").on(table.workspaceId, table.employeeId),
]);

export const cipaCommissions = mysqlTable("cipa_commissions", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  companyId: int("companyId").notNull(),
  status: mysqlEnum("status", ["planning", "election", "active", "archived"]).default("planning").notNull(),
  riskLevel: int("riskLevel").notNull(),
  employeeCount: int("employeeCount").notNull(),
  city: varchar("city", { length: 160 }),
  workplace: varchar("workplace", { length: 255 }),
  unionName: varchar("unionName", { length: 255 }),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("cipa_commissions_workspace_company_unique").on(table.workspaceId, table.companyId),
  index("cipa_commissions_workspace_idx").on(table.workspaceId, table.status),
  index("cipa_commissions_company_idx").on(table.companyId),
]);

export const cipaTerms = mysqlTable("cipa_terms", {
  id: int("id").autoincrement().primaryKey(),
  commissionId: int("commissionId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  label: varchar("label", { length: 64 }).notNull(),
  enrollmentStartsAt: timestamp("enrollmentStartsAt"),
  electionAt: timestamp("electionAt"),
  possessionAt: timestamp("possessionAt"),
  endsAt: timestamp("endsAt"),
  status: mysqlEnum("status", ["planning", "election", "active", "closed"]).default("planning").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("cipa_terms_commission_label_unique").on(table.commissionId, table.label),
  index("cipa_terms_workspace_idx").on(table.workspaceId, table.status),
  index("cipa_terms_commission_idx").on(table.commissionId, table.updatedAt),
]);

export const cipaMembers = mysqlTable("cipa_members", {
  id: int("id").autoincrement().primaryKey(),
  commissionId: int("commissionId").notNull(),
  termId: int("termId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  employeeId: int("employeeId").notNull(),
  role: mysqlEnum("role", ["election_committee", "candidate", "employer_representative", "employee_representative"]).notNull(),
  condition: mysqlEnum("condition", ["titular", "suplente", "not_applicable"]).default("not_applicable").notNull(),
  voteCount: int("voteCount").default(0).notNull(),
  status: mysqlEnum("status", ["active", "withdrawn", "elected", "not_elected"]).default("active").notNull(),
  notes: varchar("notes", { length: 1000 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("cipa_members_term_employee_role_unique").on(table.termId, table.employeeId, table.role),
  index("cipa_members_term_idx").on(table.termId, table.role, table.status),
  index("cipa_members_workspace_idx").on(table.workspaceId, table.employeeId),
]);

export const cipaDocuments = mysqlTable("cipa_documents", {
  id: int("id").autoincrement().primaryKey(),
  commissionId: int("commissionId").notNull(),
  termId: int("termId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  type: mysqlEnum("type", ["election_committee", "union_notice", "notice", "registration", "ballot", "election_minutes", "possession_minutes", "work_plan"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  companyLogoUrl: varchar("companyLogoUrl", { length: 2048 }),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("cipa_documents_term_idx").on(table.termId, table.createdAt),
  index("cipa_documents_workspace_idx").on(table.workspaceId, table.type),
]);

export const cipaMeetings = mysqlTable("cipa_meetings", {
  id: int("id").autoincrement().primaryKey(),
  commissionId: int("commissionId").notNull(),
  termId: int("termId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  meetingType: mysqlEnum("meetingType", ["ordinary", "extraordinary"]).default("ordinary").notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  location: varchar("location", { length: 255 }),
  agenda: varchar("agenda", { length: 2000 }),
  minutesSummary: varchar("minutesSummary", { length: 4000 }),
  status: mysqlEnum("status", ["scheduled", "completed", "cancelled"]).default("scheduled").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("cipa_meetings_term_schedule_idx").on(table.termId, table.scheduledAt),
  index("cipa_meetings_workspace_schedule_idx").on(table.workspaceId, table.scheduledAt),
]);

export const youtubeVideos = mysqlTable("youtube_videos", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: varchar("description", { length: 1500 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  youtubeUrl: varchar("youtubeUrl", { length: 2048 }).notNull(),
  youtubeVideoId: varchar("youtubeVideoId", { length: 32 }).notNull(),
  thumbnailUrl: varchar("thumbnailUrl", { length: 2048 }).notNull(),
  status: mysqlEnum("status", ["draft", "published", "hidden"]).default("draft").notNull(),
  featured: boolean("featured").default(false).notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("youtube_videos_video_id_unique").on(table.youtubeVideoId),
  index("youtube_videos_public_idx").on(table.status, table.featured, table.publishedAt),
  index("youtube_videos_updated_idx").on(table.updatedAt),
]);

export const materials = mysqlTable("materials", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["modelo", "checklist", "procedimento", "outro"]).default("outro").notNull(),
  description: varchar("description", { length: 1500 }),
  referenceUrl: varchar("referenceUrl", { length: 2048 }),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("materials_workspace_idx").on(table.workspaceId)]);

export const contentMaterials = mysqlTable("content_materials", {
  id: int("id").autoincrement().primaryKey(),
  placement: mysqlEnum("placement", ["marketplace", "library"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: varchar("description", { length: 1500 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  format: mysqlEnum("format", ["modelo", "planilha", "checklist", "ebook", "curso", "documento", "outro"]).default("outro").notNull(),
  salePlatform: mysqlEnum("salePlatform", ["hotmart", "kiwify", "externo", "nenhuma"]).default("nenhuma").notNull(),
  priceCents: int("priceCents"),
  referenceUrl: varchar("referenceUrl", { length: 2048 }),
  coverUrl: varchar("coverUrl", { length: 2048 }),
  fileUrl: varchar("fileUrl", { length: 2048 }),
  fileName: varchar("fileName", { length: 255 }),
  fileMimeType: varchar("fileMimeType", { length: 120 }),
  status: mysqlEnum("status", ["draft", "published", "hidden"]).default("draft").notNull(),
  featured: boolean("featured").default(false).notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("content_materials_public_idx").on(table.placement, table.status, table.featured),
  index("content_materials_updated_idx").on(table.updatedAt),
]);

export const contentMaterialClicks = mysqlTable("content_material_clicks", {
  id: int("id").autoincrement().primaryKey(),
  materialId: int("materialId").notNull(),
  userId: int("userId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("content_material_clicks_material_created_idx").on(table.materialId, table.createdAt),
  index("content_material_clicks_user_created_idx").on(table.userId, table.createdAt),
]);

export const supportTickets = mysqlTable("support_tickets", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: varchar("message", { length: 2000 }).notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "resolved"]).default("open").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("support_tickets_workspace_idx").on(table.workspaceId)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type AdminAccessAudit = typeof adminAccessAudit.$inferSelect;
export type Workspace = typeof workspaces.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type OccupationalRisk = typeof occupationalRisks.$inferSelect;
export type OccupationalRiskEvent = typeof occupationalRiskEvents.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
export type Training = typeof trainings.$inferSelect;
export type Material = typeof materials.$inferSelect;
export type ContentMaterial = typeof contentMaterials.$inferSelect;
export type CipaMeeting = typeof cipaMeetings.$inferSelect;
export type YouTubeVideo = typeof youtubeVideos.$inferSelect;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type JobRole = typeof jobRoles.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type EpiItem = typeof epiItems.$inferSelect;
export type EpiRequirement = typeof epiRequirements.$inferSelect;
export type EpiDelivery = typeof epiDeliveries.$inferSelect;
export type SstOccurrence = typeof sstOccurrences.$inferSelect;
export type InspectionTemplate = typeof inspectionTemplates.$inferSelect;
export type InspectionTemplateItem = typeof inspectionTemplateItems.$inferSelect;
export type Inspection = typeof inspections.$inferSelect;
export type ActionItem = typeof actionItems.$inferSelect;
export type ClientEngagement = typeof clientEngagements.$inferSelect;
export type ClientVisit = typeof clientVisits.$inferSelect;
export type CipaCommission = typeof cipaCommissions.$inferSelect;
export type CipaTerm = typeof cipaTerms.$inferSelect;
export type CipaMember = typeof cipaMembers.$inferSelect;
export type CipaDocumentRecord = typeof cipaDocuments.$inferSelect;

// Módulo COPSOQ-III (Avaliação de Riscos Psicossociais - NR-1)
export const psychosocialApplications = mysqlTable("psychosocial_applications", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  companyId: int("companyId").notNull(),
  departmentId: int("departmentId"),
  title: varchar("title", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["draft", "active", "completed"]).default("active").notNull(),
  minRespondents: int("minRespondents").default(10).notNull(),
  respondentCount: int("respondentCount").default(0).notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("psychosocial_applications_workspace_idx").on(table.workspaceId),
  index("psychosocial_applications_company_idx").on(table.companyId),
]);

export const psychosocialResponses = mysqlTable("psychosocial_responses", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull(),
  // Hash anônimo para auditoria de unicidade sem expor identificidade do respondente
  respondentHash: varchar("respondentHash", { length: 128 }).notNull(),
  answersJson: varchar("answersJson", { length: 4000 }).notNull(), // Armazena mapa de questões e escores
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("psychosocial_responses_app_idx").on(table.applicationId),
]);

export const psychosocialResults = mysqlTable("psychosocial_results", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull(),
  dimensionKey: varchar("dimensionKey", { length: 64 }).notNull(), // ex: "demands_quantitative", "harassment_sexual"
  dimensionName: varchar("dimensionName", { length: 255 }).notNull(),
  domainName: varchar("domainName", { length: 255 }).notNull(),
  score: int("score").notNull(), // Média normalizada 0-100
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high"]).notNull(),
  exportedToPgr: boolean("exportedToPgr").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("psychosocial_results_app_idx").on(table.applicationId),
  index("psychosocial_results_risk_idx").on(table.applicationId, table.riskLevel),
]);

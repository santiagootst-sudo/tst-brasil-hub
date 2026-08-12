import { boolean, index, int, mysqlEnum, mysqlTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  accessStatus: mysqlEnum("accessStatus", ["active", "suspended"]).default("active").notNull(),
  accessExpiresAt: timestamp("accessExpiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

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
]);

export const epiItems = mysqlTable("epi_items", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  companyId: int("companyId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  caNumber: varchar("caNumber", { length: 64 }),
  manufacturer: varchar("manufacturer", { length: 160 }),
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
  deliveredAt: timestamp("deliveredAt").notNull(),
  replacementDueAt: timestamp("replacementDueAt"),
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

export const inspections = mysqlTable("inspections", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  companyId: int("companyId").notNull(),
  departmentId: int("departmentId"),
  templateId: int("templateId"),
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("pgr_projects_workspace_idx").on(table.workspaceId)]);

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
  participantCount: int("participantCount").default(0).notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("trainings_workspace_idx").on(table.workspaceId),
  index("trainings_company_idx").on(table.companyId),
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
export type Certificate = typeof certificates.$inferSelect;
export type Training = typeof trainings.$inferSelect;
export type Material = typeof materials.$inferSelect;
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

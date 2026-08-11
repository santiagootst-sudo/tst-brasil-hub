import { boolean, index, int, mysqlEnum, mysqlTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
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
}, table => [index("workspaces_owner_idx").on(table.ownerUserId)]);

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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("companies_workspace_idx").on(table.workspaceId)]);

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
  participantName: varchar("participantName", { length: 255 }).notNull(),
  trainingName: varchar("trainingName", { length: 255 }).notNull(),
  issuedAt: timestamp("issuedAt").notNull(),
  expiresAt: timestamp("expiresAt"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("certificates_workspace_idx").on(table.workspaceId),
  index("certificates_company_idx").on(table.companyId),
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

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Workspace = typeof workspaces.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
export type Training = typeof trainings.$inferSelect;

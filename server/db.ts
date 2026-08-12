import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { certificates, companies, departments, employees, epiItems, epiRequirements, jobRoles, type InsertUser, materials, pgrProjects, sstOccurrences, subscriptions, supportTickets, type Subscription, trainings, users, workspaceMembers, workspaces } from "../drizzle/schema";
import { ENV } from "./_core/env";

let dbInstance: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!dbInstance && ENV.databaseUrl) {
    try {
      dbInstance = drizzle(ENV.databaseUrl);
    } catch (error) {
      console.warn("[Database] Falha ao conectar", error);
    }
  }
  return dbInstance;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("openId do usuário é obrigatório.");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { ...user, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = {
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? null,
    lastSignedIn: new Date(),
  };
  if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0];
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

export async function createWorkspaceForUser(input: { userId: number; name: string; kind: "autonomo" | "clt" }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const inserted = await db.insert(workspaces).values({ name: input.name, kind: input.kind, ownerUserId: input.userId });
  const workspaceId = Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0);
  if (!workspaceId) throw new Error("Não foi possível criar o ambiente.");
  await db.insert(workspaceMembers).values({ workspaceId, userId: input.userId, role: "owner" });
  return { id: workspaceId, name: input.name, kind: input.kind, role: "owner" as const };
}

export async function getWorkspaceForUser(workspaceId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db
    .select({ id: workspaces.id, name: workspaces.name, kind: workspaces.kind, role: workspaceMembers.role })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(and(eq(workspaceMembers.userId, userId), eq(workspaceMembers.workspaceId, workspaceId)))
    .limit(1))[0];
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

export async function updateCompanyLogoForWorkspace(input: { companyId: number; workspaceId: number; logoKey: string; logoUrl: string }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await db
    .update(companies)
    .set({ logoKey: input.logoKey, logoUrl: input.logoUrl, updatedAt: new Date() })
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

export async function listCertificatesForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(certificates).where(eq(certificates.workspaceId, workspaceId)).orderBy(desc(certificates.expiresAt), desc(certificates.updatedAt));
}

export async function createCertificateForWorkspace(input: {
  workspaceId: number;
  companyId?: number | null;
  participantName: string;
  trainingName: string;
  issuedAt: Date;
  expiresAt?: Date | null;
  createdByUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const inserted = await db.insert(certificates).values({
    ...input,
    companyId: input.companyId ?? null,
    expiresAt: input.expiresAt ?? null,
  });
  return { id: Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0), ...input };
}

export async function listTrainingsForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trainings).where(eq(trainings.workspaceId, workspaceId)).orderBy(desc(trainings.scheduledAt), desc(trainings.updatedAt));
}

export async function createTrainingForWorkspace(input: {
  workspaceId: number;
  companyId?: number | null;
  title: string;
  scheduledAt?: Date | null;
  participantCount: number;
  createdByUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const inserted = await db.insert(trainings).values({
    ...input,
    companyId: input.companyId ?? null,
    scheduledAt: input.scheduledAt ?? null,
  });
  return { id: Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0), ...input };
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

export async function createEmployeeForWorkspace(input: { workspaceId: number; companyId: number; departmentId?: number | null; jobRoleId?: number | null; fullName: string; hiredAt?: Date | null }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const inserted = await db.insert(employees).values({ ...input, departmentId: input.departmentId ?? null, jobRoleId: input.jobRoleId ?? null, hiredAt: input.hiredAt ?? null, status: "active" });
  return { id: Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0), ...input, departmentId: input.departmentId ?? null, jobRoleId: input.jobRoleId ?? null, hiredAt: input.hiredAt ?? null, status: "active" as const };
}

export async function getEmployeeForWorkspace(employeeId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(employees).where(and(eq(employees.id, employeeId), eq(employees.workspaceId, workspaceId))).limit(1))[0];
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

export async function createEpiItemForWorkspace(input: { workspaceId: number; companyId: number; name: string; caNumber?: string | null; manufacturer?: string | null; stockQuantity: number; minimumStock: number; expiresAt?: Date | null }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const values = { ...input, caNumber: input.caNumber ?? null, manufacturer: input.manufacturer ?? null, expiresAt: input.expiresAt ?? null };
  const inserted = await db.insert(epiItems).values(values);
  return { id: Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0), ...values, active: true as const };
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

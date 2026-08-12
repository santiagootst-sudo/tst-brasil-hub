import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { actionItems, adminAccessAudit, certificates, clientEngagements, clientVisits, companies, departments, employees, epiDeliveries, epiItems, epiRequirements, epiReturns, inspectionTemplateItems, inspectionTemplates, inspections, jobRoles, type InsertUser, materials, pgrProjects, sstOccurrences, subscriptions, supportTickets, type Subscription, trainings, users, workspaceMembers, workspaces } from "../drizzle/schema";
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

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
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

  const nextStatus = input.action === "suspend" || input.action === "disable" ? "suspended" : "active";
  const nextExpiresAt = nextStatus === "suspended" ? null : input.expiresAt;
  await db.transaction(async tx => {
    await tx.update(users)
      .set({ accessStatus: nextStatus, accessExpiresAt: nextExpiresAt, updatedAt: new Date() })
      .where(eq(users.id, input.targetUserId));
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

export async function listAdminAccessAudits(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adminAccessAudit).orderBy(desc(adminAccessAudit.createdAt), desc(adminAccessAudit.id)).limit(limit);
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

export async function listEpiDeliveriesForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(epiDeliveries).where(eq(epiDeliveries.workspaceId, workspaceId)).orderBy(desc(epiDeliveries.deliveredAt), desc(epiDeliveries.updatedAt));
}
export async function createEpiDeliveryForWorkspace(input: { workspaceId: number; companyId: number; epiItemId: number; employeeId: number; quantity: number; deliveryKind: "initial" | "replacement"; deliveredAt: Date; replacementDueAt?: Date | null; notes?: string | null; signedByName?: string | null; digitalSignature?: string | null; createdByUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const values = {
    ...input,
    replacementDueAt: input.replacementDueAt ?? null,
    notes: input.notes ?? null,
    signedByName: input.signedByName ?? "Responsável SST",
    digitalSignature: input.digitalSignature ?? `TST-ACEITE-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    returnStatus: "delivered" as const,
  };
  return db.transaction(async tx => {
    await tx.update(epiItems).set({ stockQuantity: sql`${epiItems.stockQuantity} - ${input.quantity}` }).where(and(eq(epiItems.id, input.epiItemId), eq(epiItems.workspaceId, input.workspaceId)));
    const inserted = await tx.insert(epiDeliveries).values(values);
    return { id: Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0), ...values };
  });
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

export async function createInspectionForWorkspace(input: { workspaceId: number; companyId: number; departmentId?: number | null; templateId?: number | null; title: string; dueAt?: Date | null; notes?: string | null; createdByUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const values = { ...input, departmentId: input.departmentId ?? null, templateId: input.templateId ?? null, dueAt: input.dueAt ?? null, notes: input.notes ?? null, status: "planned" as const };
  const inserted = await db.insert(inspections).values(values);
  return { id: Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0), ...values };
}

export async function listActionItemsForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(actionItems).where(eq(actionItems.workspaceId, workspaceId)).orderBy(desc(actionItems.dueAt), desc(actionItems.updatedAt));
}

export async function createActionItemForWorkspace(input: { workspaceId: number; companyId: number; inspectionId?: number | null; departmentId?: number | null; responsibleEmployeeId?: number | null; title: string; description?: string | null; dueAt?: Date | null; createdByUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const values = { ...input, inspectionId: input.inspectionId ?? null, departmentId: input.departmentId ?? null, responsibleEmployeeId: input.responsibleEmployeeId ?? null, description: input.description ?? null, dueAt: input.dueAt ?? null, status: "open" as const };
  const inserted = await db.insert(actionItems).values(values);
  return { id: Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId ?? 0), ...values };
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

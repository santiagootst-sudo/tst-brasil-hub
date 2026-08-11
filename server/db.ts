import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { certificates, companies, type InsertUser, pgrProjects, subscriptions, type Subscription, trainings, users, workspaceMembers, workspaces } from "../drizzle/schema";
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

import { z } from "zod";

export const workspaceIdInput = z.object({ workspaceId: z.number().int().positive() });

export const workspaceInput = z.object({
  name: z.string().trim().min(2).max(160),
  kind: z.enum(["autonomo", "clt"]),
});

export const createCompanyInput = workspaceIdInput.extend({
  name: z.string().trim().min(2).max(255),
  document: z.string().trim().max(32).optional(),
});

export const createPgrProjectInput = workspaceIdInput.extend({
  companyId: z.number().int().positive().optional(),
  name: z.string().trim().min(2).max(255),
});

export const createCertificateInput = workspaceIdInput.extend({
  companyId: z.number().int().positive().optional(),
  participantName: z.string().trim().min(2).max(255),
  trainingName: z.string().trim().min(2).max(255),
  issuedAt: z.coerce.date(),
  expiresAt: z.coerce.date().nullable().optional(),
});

export const createTrainingInput = workspaceIdInput.extend({
  companyId: z.number().int().positive().optional(),
  title: z.string().trim().min(2).max(255),
  scheduledAt: z.coerce.date().nullable().optional(),
  participantCount: z.number().int().min(0).max(100_000).default(0),
});

export const materialCategories = ["modelo", "checklist", "procedimento", "outro"] as const;

export const createMaterialInput = workspaceIdInput.extend({
  title: z.string().trim().min(2).max(255),
  category: z.enum(materialCategories),
  description: z.string().trim().max(1500).nullable().optional(),
  referenceUrl: z.string().trim().url().max(2048).nullable().optional(),
});

export const createSupportTicketInput = workspaceIdInput.extend({
  subject: z.string().trim().min(2).max(255),
  message: z.string().trim().min(10).max(2000),
});

export const checkoutInput = z.object({ planCode: z.enum(["pgr_pro", "autonomo", "empresa"]) });

export const workspaceKindSchema = z.enum(["autonomo", "clt"]);
export const workspaceRoleSchema = z.enum(["owner", "manager", "member"]);
export const materialCategorySchema = z.enum(materialCategories);
export const supportTicketStatusSchema = z.enum(["open", "in_progress", "resolved"]);

export const workspaceSummarySchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  kind: workspaceKindSchema,
  role: workspaceRoleSchema,
  updatedAt: z.date(),
});

export const companySchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  name: z.string(),
  document: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const pgrProjectSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive().nullable(),
  name: z.string(),
  legacyStorageKey: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const workspaceDetailSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  kind: workspaceKindSchema,
  role: workspaceRoleSchema,
  companies: z.array(companySchema),
  pgrProjects: z.array(pgrProjectSchema),
});

export const certificateSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive().nullable(),
  participantName: z.string(),
  trainingName: z.string(),
  issuedAt: z.date(),
  expiresAt: z.date().nullable(),
  createdByUserId: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const trainingSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive().nullable(),
  title: z.string(),
  status: z.enum(["planned", "completed"]),
  scheduledAt: z.date().nullable(),
  participantCount: z.number().int().nonnegative(),
  createdByUserId: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const materialSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  title: z.string(),
  category: materialCategorySchema,
  description: z.string().nullable(),
  referenceUrl: z.string().nullable(),
  createdByUserId: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const supportTicketSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  subject: z.string(),
  message: z.string(),
  status: supportTicketStatusSchema,
  createdByUserId: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const subscriptionSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  stripeCustomerId: z.string().nullable(),
  stripeSubscriptionId: z.string().nullable(),
  stripePriceId: z.string().nullable(),
  planCode: z.string(),
  status: z.string(),
  currentPeriodEnd: z.date().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  updatedAt: z.date(),
});

export const subscriptionPlanSchema = z.object({
  code: z.enum(["pgr_pro", "autonomo", "empresa"]),
  name: z.string(),
  audience: z.string(),
  displayPrice: z.string(),
  lookupKey: z.string(),
  featured: z.boolean(),
  features: z.array(z.string()),
  checkoutReady: z.boolean(),
});

export const billingStatusSchema = z.object({
  subscription: subscriptionSchema.nullable(),
  plan: z.object({ code: z.string(), name: z.string(), displayPrice: z.string() }).nullable(),
  hasPaidAccess: z.boolean(),
});

export const workspaceCreatedSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  kind: workspaceKindSchema,
  role: workspaceRoleSchema,
});

export const companyCreatedSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  name: z.string(),
  document: z.string().nullable().optional(),
});

export const pgrProjectCreatedSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive().nullable().optional(),
  name: z.string(),
  legacyStorageKey: z.string().min(1),
});

export const certificateCreatedSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive().nullable().optional(),
  participantName: z.string(),
  trainingName: z.string(),
  issuedAt: z.date(),
  expiresAt: z.date().nullable().optional(),
  createdByUserId: z.number().int().positive(),
});

export const trainingCreatedSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive().nullable().optional(),
  title: z.string(),
  scheduledAt: z.date().nullable().optional(),
  participantCount: z.number().int().nonnegative(),
  createdByUserId: z.number().int().positive(),
});

export const materialCreatedSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  title: z.string(),
  category: materialCategorySchema,
  description: z.string().nullable().optional(),
  referenceUrl: z.string().nullable().optional(),
  createdByUserId: z.number().int().positive(),
});

export const supportTicketCreatedSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  subject: z.string(),
  message: z.string(),
  createdByUserId: z.number().int().positive(),
  status: z.literal("open"),
});

export const checkoutSessionSchema = z.object({ url: z.string().url() });
export const billingPortalSessionSchema = z.object({ url: z.string().url() });

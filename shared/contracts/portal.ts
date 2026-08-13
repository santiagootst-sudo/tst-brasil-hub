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

export const createDepartmentInput = workspaceIdInput.extend({
  companyId: z.number().int().positive(),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1000).nullable().optional(),
});

export const createJobRoleInput = workspaceIdInput.extend({
  companyId: z.number().int().positive(),
  departmentId: z.number().int().positive().nullable().optional(),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1000).nullable().optional(),
});

export const createEmployeeInput = workspaceIdInput.extend({
  companyId: z.number().int().positive(),
  departmentId: z.number().int().positive().nullable().optional(),
  jobRoleId: z.number().int().positive().nullable().optional(),
  fullName: z.string().trim().min(2).max(255),
  hiredAt: z.coerce.date().nullable().optional(),
});

export const uploadCompanyLogoInput = workspaceIdInput.extend({
  companyId: z.number().int().positive(),
  dataUrl: z.string().min(32).max(3_500_000),
});

export const updateCompanyBrandingInput = workspaceIdInput.extend({
  companyId: z.number().int().positive(),
  brandPrimaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  brandBackgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  logoDataUrl: z.string().min(32).max(3_500_000).nullable().optional(),
});

export const createPgrProjectInput = workspaceIdInput.extend({
  companyId: z.number().int().positive().optional(),
  name: z.string().trim().min(2).max(255),
  consultancyName: z.string().trim().max(255).nullable().optional(),
  consultancyLogoUrl: z.string().max(2048).nullable().optional(),
  riskMapImageUrl: z.string().max(2048).nullable().optional(),
  visualMatrixImageUrl: z.string().max(2048).nullable().optional(),
});

export const suggestPgrGhesInput = workspaceIdInput.extend({
  projectId: z.number().int().positive(),
  activityDescription: z.string().trim().min(3, "Informe a atividade econômica ou o ramo da empresa.").max(1000),
});

export const pgrGheSuggestionSchema = z.object({
  gheName: z.string(),
  description: z.string(),
  suggestedHazards: z.array(z.string()),
  suggestedMeasures: z.array(z.string()),
});

export const suggestPgrGhesOutput = z.object({
  success: z.boolean(),
  activityDescription: z.string(),
  suggestions: z.array(pgrGheSuggestionSchema),
});

export const uploadPgrAttachmentInput = workspaceIdInput.extend({
  projectId: z.number().int().positive(),
  title: z.string().trim().min(2, "Informe o título do laudo ou foto.").max(128),
  category: z.enum(["photo", "laudo", "art", "certificate", "other"]).default("photo"),
  dataUrl: z.string().min(15, "Envie o arquivo codificado em base64."),
});

export const pgrAttachmentSchema = z.object({
  id: z.number().int().positive(),
  pgrProjectId: z.number().int().positive(),
  title: z.string(),
  category: z.string(),
  fileKey: z.string(),
  fileUrl: z.string(),
  createdAt: z.date(),
});

export const certificateCategories = ["certificate", "pgr", "ltcat", "os", "pcmat", "laudo", "other"] as const;
export const certificateCategorySchema = z.enum(certificateCategories);

export const createCertificateInput = workspaceIdInput.extend({
  companyId: z.number().int().positive().optional(),
  category: certificateCategorySchema.default("certificate"),
  participantName: z.string().trim().min(2).max(255),
  trainingName: z.string().trim().min(2).max(255),
  issuedAt: z.coerce.date(),
  expiresAt: z.coerce.date().nullable().optional(),
  referenceUrl: z.string().trim().url().max(2048).nullable().optional(),
  notes: z.string().trim().max(1500).nullable().optional(),
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
export const employeeStatusSchema = z.enum(["active", "inactive"]);

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
  logoKey: z.string().nullable(),
  logoUrl: z.string().nullable(),
  brandPrimaryColor: z.string().nullable(),
  brandBackgroundColor: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const departmentSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  name: z.string(),
  description: z.string().nullable(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const jobRoleSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  departmentId: z.number().int().positive().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const employeeSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  departmentId: z.number().int().positive().nullable(),
  jobRoleId: z.number().int().positive().nullable(),
  fullName: z.string(),
  status: employeeStatusSchema,
  hiredAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const organizationSnapshotSchema = z.object({
  departments: z.array(departmentSchema),
  jobRoles: z.array(jobRoleSchema),
  employees: z.array(employeeSchema),
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
  category: certificateCategorySchema,
  participantName: z.string(),
  trainingName: z.string(),
  issuedAt: z.date(),
  expiresAt: z.date().nullable(),
  referenceUrl: z.string().nullable(),
  notes: z.string().nullable(),
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

export const companyLogoUpdatedSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  logoKey: z.string(),
  logoUrl: z.string(),
});

export const companyBrandingUpdatedSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  logoKey: z.string().nullable(),
  logoUrl: z.string().nullable(),
  brandPrimaryColor: z.string().nullable(),
  brandBackgroundColor: z.string().nullable(),
});

export const departmentCreatedSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  name: z.string(),
  description: z.string().nullable(),
  active: z.literal(true),
});

export const jobRoleCreatedSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  departmentId: z.number().int().positive().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  active: z.literal(true),
});

export const employeeCreatedSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  departmentId: z.number().int().positive().nullable(),
  jobRoleId: z.number().int().positive().nullable(),
  fullName: z.string(),
  status: z.literal("active"),
  hiredAt: z.date().nullable(),
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
  category: certificateCategorySchema,
  participantName: z.string(),
  trainingName: z.string(),
  issuedAt: z.date(),
  expiresAt: z.date().nullable().optional(),
  referenceUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
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

export const sstOccurrenceTypes = ["near_miss", "incident", "accident"] as const;
export const sstOccurrenceStatuses = ["open", "under_review", "closed"] as const;
export const sstOccurrenceTypeSchema = z.enum(sstOccurrenceTypes);
export const sstOccurrenceStatusSchema = z.enum(sstOccurrenceStatuses);

export const createEpiItemInput = workspaceIdInput.extend({
  companyId: z.number().int().positive(),
  name: z.string().trim().min(2).max(255),
  caNumber: z.string().trim().max(64).nullable().optional(),
  manufacturer: z.string().trim().max(160).nullable().optional(),
  stockQuantity: z.number().int().min(0).max(1_000_000).default(0),
  minimumStock: z.number().int().min(0).max(1_000_000).default(0),
  expiresAt: z.coerce.date().nullable().optional(),
});

export const createEpiDeliveryInput = workspaceIdInput.extend({
  companyId: z.number().int().positive(),
  epiItemId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  quantity: z.number().int().positive().max(1000).default(1),
  deliveryKind: z.enum(["initial", "replacement"]).default("initial"),
  deliveredAt: z.coerce.date(),
  replacementDueAt: z.coerce.date().nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
  signedByName: z.string().trim().min(2).max(255).nullable().optional(),
  digitalSignature: z.string().trim().max(255).nullable().optional(),
});

export const createEpiReturnInput = workspaceIdInput.extend({
  companyId: z.number().int().positive(),
  deliveryId: z.number().int().positive().nullable().optional(),
  epiItemId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  returnedAt: z.coerce.date(),
  condition: z.enum(["good", "damaged", "expired", "lost"]),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const createEpiRequirementInput = workspaceIdInput.extend({
  companyId: z.number().int().positive(),
  jobRoleId: z.number().int().positive(),
  epiItemId: z.number().int().positive(),
});

export const createSstOccurrenceInput = workspaceIdInput.extend({
  companyId: z.number().int().positive(),
  departmentId: z.number().int().positive().nullable().optional(),
  employeeId: z.number().int().positive().nullable().optional(),
  type: sstOccurrenceTypeSchema,
  occurredAt: z.coerce.date(),
  summary: z.string().trim().min(10).max(1000),
});

export const epiItemSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  name: z.string(),
  caNumber: z.string().nullable(),
  manufacturer: z.string().nullable(),
  stockQuantity: z.number().int().nonnegative(),
  minimumStock: z.number().int().nonnegative(),
  expiresAt: z.date().nullable(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const epiDeliverySchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  epiItemId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  deliveryKind: z.enum(["initial", "replacement"]),
  deliveredAt: z.date(),
  replacementDueAt: z.date().nullable(),
  notes: z.string().nullable(),
  signedByName: z.string().nullable(),
  digitalSignature: z.string().nullable(),
  returnStatus: z.enum(["delivered", "returned", "replaced"]),
  createdByUserId: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const epiReturnSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  deliveryId: z.number().int().positive().nullable(),
  epiItemId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  returnedAt: z.date(),
  condition: z.enum(["good", "damaged", "expired", "lost"]),
  notes: z.string().nullable(),
  createdByUserId: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const epiRequirementSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  jobRoleId: z.number().int().positive(),
  epiItemId: z.number().int().positive(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const sstOccurrenceSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  departmentId: z.number().int().positive().nullable(),
  employeeId: z.number().int().positive().nullable(),
  type: sstOccurrenceTypeSchema,
  occurredAt: z.date(),
  summary: z.string(),
  status: sstOccurrenceStatusSchema,
  createdByUserId: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const operationalSafetySnapshotSchema = z.object({
  epiItems: z.array(epiItemSchema),
  epiRequirements: z.array(epiRequirementSchema),
  epiDeliveries: z.array(epiDeliverySchema),
  epiReturns: z.array(epiReturnSchema),
  occurrences: z.array(sstOccurrenceSchema),
});

export const epiReturnCreatedSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  deliveryId: z.number().int().positive().nullable(),
  epiItemId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  returnedAt: z.date(),
  condition: z.enum(["good", "damaged", "expired", "lost"]),
  notes: z.string().nullable(),
  createdByUserId: z.number().int().positive(),
});

export const epiItemCreatedSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  name: z.string(),
  caNumber: z.string().nullable(),
  manufacturer: z.string().nullable(),
  stockQuantity: z.number().int().nonnegative(),
  minimumStock: z.number().int().nonnegative(),
  expiresAt: z.date().nullable(),
  active: z.literal(true),
});

export const epiDeliveryCreatedSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  epiItemId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  deliveryKind: z.enum(["initial", "replacement"]),
  deliveredAt: z.date(),
  replacementDueAt: z.date().nullable(),
  notes: z.string().nullable(),
  createdByUserId: z.number().int().positive(),
});

export const epiRequirementCreatedSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  jobRoleId: z.number().int().positive(),
  epiItemId: z.number().int().positive(),
  active: z.literal(true),
});

export const sstOccurrenceCreatedSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  departmentId: z.number().int().positive().nullable(),
  employeeId: z.number().int().positive().nullable(),
  type: sstOccurrenceTypeSchema,
  occurredAt: z.date(),
  summary: z.string(),
  status: z.literal("open"),
  createdByUserId: z.number().int().positive(),
});

export const inspectionStatuses = ["planned", "completed"] as const;
export const actionItemStatuses = ["open", "in_progress", "completed"] as const;
export const inspectionStatusSchema = z.enum(inspectionStatuses);
export const actionItemStatusSchema = z.enum(actionItemStatuses);

export const createInspectionTemplateInput = workspaceIdInput.extend({
  companyId: z.number().int().positive(),
  departmentId: z.number().int().positive().nullable().optional(),
  name: z.string().trim().min(3).max(255),
  riskType: z.string().trim().min(2).max(120),
  routineType: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1500).nullable().optional(),
  items: z.array(z.object({
    title: z.string().trim().min(2).max(255),
    guidance: z.string().trim().max(1000).nullable().optional(),
    required: z.boolean().default(true),
    sortOrder: z.number().int().min(0).default(0),
  })).min(1).max(100),
});

export const createInspectionInput = workspaceIdInput.extend({
  companyId: z.number().int().positive(),
  departmentId: z.number().int().positive().nullable().optional(),
  templateId: z.number().int().positive().nullable().optional(),
  title: z.string().trim().min(3).max(255),
  dueAt: z.coerce.date().nullable().optional(),
  notes: z.string().trim().max(1500).nullable().optional(),
});

export const createActionItemInput = workspaceIdInput.extend({
  companyId: z.number().int().positive(),
  inspectionId: z.number().int().positive().nullable().optional(),
  departmentId: z.number().int().positive().nullable().optional(),
  responsibleEmployeeId: z.number().int().positive().nullable().optional(),
  title: z.string().trim().min(3).max(255),
  description: z.string().trim().max(1500).nullable().optional(),
  dueAt: z.coerce.date().nullable().optional(),
});

export const inspectionTemplateItemSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  templateId: z.number().int().positive(),
  title: z.string(),
  guidance: z.string().nullable(),
  required: z.boolean(),
  sortOrder: z.number().int().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const inspectionTemplateSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  departmentId: z.number().int().positive().nullable(),
  name: z.string(),
  riskType: z.string(),
  routineType: z.string(),
  description: z.string().nullable(),
  active: z.boolean(),
  createdByUserId: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
  items: z.array(inspectionTemplateItemSchema),
});

export const inspectionSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  departmentId: z.number().int().positive().nullable(),
  templateId: z.number().int().positive().nullable(),
  title: z.string(),
  dueAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  notes: z.string().nullable(),
  status: inspectionStatusSchema,
  createdByUserId: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const actionItemSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  inspectionId: z.number().int().positive().nullable(),
  departmentId: z.number().int().positive().nullable(),
  responsibleEmployeeId: z.number().int().positive().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  dueAt: z.date().nullable(),
  status: actionItemStatusSchema,
  createdByUserId: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const planningSnapshotSchema = z.object({
  inspections: z.array(inspectionSchema),
  actionItems: z.array(actionItemSchema),
  templates: z.array(inspectionTemplateSchema),
});

export const inspectionTemplateCreatedSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  departmentId: z.number().int().positive().nullable(),
  name: z.string(),
  riskType: z.string(),
  routineType: z.string(),
  description: z.string().nullable(),
  active: z.literal(true),
  createdByUserId: z.number().int().positive(),
  items: z.array(inspectionTemplateItemSchema),
});

export const inspectionCreatedSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  departmentId: z.number().int().positive().nullable(),
  templateId: z.number().int().positive().nullable(),
  title: z.string(),
  dueAt: z.date().nullable(),
  notes: z.string().nullable(),
  status: z.literal("planned"),
  createdByUserId: z.number().int().positive(),
});

export const actionItemCreatedSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  inspectionId: z.number().int().positive().nullable(),
  departmentId: z.number().int().positive().nullable(),
  responsibleEmployeeId: z.number().int().positive().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  dueAt: z.date().nullable(),
  status: z.literal("open"),
  createdByUserId: z.number().int().positive(),
});

export const clientEngagementStatuses = ["lead", "active", "inactive"] as const;
export const clientVisitStatuses = ["planned", "completed", "cancelled"] as const;
export const clientEngagementStatusSchema = z.enum(clientEngagementStatuses);
export const clientVisitStatusSchema = z.enum(clientVisitStatuses);

export const createClientEngagementInput = workspaceIdInput.extend({
  companyId: z.number().int().positive(),
  status: clientEngagementStatusSchema.default("lead"),
  nextFollowUpAt: z.coerce.date().nullable().optional(),
  notes: z.string().trim().max(1500).nullable().optional(),
});

export const createClientVisitInput = workspaceIdInput.extend({
  companyId: z.number().int().positive(),
  scheduledAt: z.coerce.date(),
  objective: z.string().trim().min(3).max(500),
  notes: z.string().trim().max(1500).nullable().optional(),
});

export const updateClientVisitStatusInput = workspaceIdInput.extend({
  visitId: z.number().int().positive(),
  status: clientVisitStatusSchema,
});

export const clientEngagementSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  status: clientEngagementStatusSchema,
  nextFollowUpAt: z.date().nullable(),
  notes: z.string().nullable(),
  createdByUserId: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const clientVisitSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  scheduledAt: z.date(),
  objective: z.string(),
  notes: z.string().nullable(),
  status: clientVisitStatusSchema,
  createdByUserId: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const commercialSnapshotSchema = z.object({
  engagements: z.array(clientEngagementSchema),
  visits: z.array(clientVisitSchema),
});

export const clientEngagementCreatedSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  status: clientEngagementStatusSchema,
  nextFollowUpAt: z.date().nullable(),
  notes: z.string().nullable(),
  createdByUserId: z.number().int().positive(),
});

export const clientVisitCreatedSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  scheduledAt: z.date(),
  objective: z.string(),
  notes: z.string().nullable(),
  status: z.literal("planned"),
  createdByUserId: z.number().int().positive(),
});

export const clientVisitUpdatedSchema = clientVisitSchema;

// Módulo COPSOQ-III (Avaliação de Riscos Psicossociais)
export const psychosocialRiskLevelSchema = z.enum(["low", "medium", "high"]);
export const psychosocialAppStatusSchema = z.enum(["draft", "active", "completed"]);

export const createPsychosocialApplicationInput = workspaceIdInput.extend({
  companyId: z.number().int().positive(),
  departmentId: z.number().int().positive().nullable().optional(),
  title: z.string().trim().min(3).max(255),
  minRespondents: z.number().int().min(1).default(10),
});

export const submitPsychosocialResponseInput = z.object({
  applicationId: z.number().int().positive(),
  respondentHash: z.string().min(8).max(128),
  answers: z.record(z.string(), z.number().int().min(0).max(100)),
});

export const psychosocialApplicationSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  departmentId: z.number().int().positive().nullable(),
  title: z.string(),
  status: psychosocialAppStatusSchema,
  minRespondents: z.number().int(),
  respondentCount: z.number().int(),
  createdByUserId: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const psychosocialResultSchema = z.object({
  id: z.number().int().positive(),
  applicationId: z.number().int().positive(),
  dimensionKey: z.string(),
  dimensionName: z.string(),
  domainName: z.string(),
  score: z.number().int(),
  riskLevel: psychosocialRiskLevelSchema,
  exportedToPgr: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const psychosocialSnapshotSchema = z.object({
  applications: z.array(psychosocialApplicationSchema),
  results: z.array(psychosocialResultSchema),
});

export const exportPsychosocialToPgrInput = workspaceIdInput.extend({
  applicationId: z.number().int().positive(),
});

export const createPgrRevisionInput = workspaceIdInput.extend({
  pgrProjectId: z.number().int().positive(),
  companyId: z.number().int().positive().optional(),
  versionNumber: z.string().trim().min(1).max(32),
  revisionSummary: z.string().trim().min(2).max(1500),
  changesDescription: z.string().trim().min(2).max(3000),
  sectionObservations: z.record(z.string(), z.string()).optional(),
  documentSnapshot: z.string().optional(),
});

export const upsertPgrTechnicalSignatureInput = workspaceIdInput.extend({
  pgrProjectId: z.number().int().positive(),
  professionalName: z.string().trim().min(2).max(255),
  professionalRole: z.string().trim().min(2).max(128).default("Técnico em Segurança do Trabalho"),
  professionalRegistry: z.string().trim().min(2).max(64),
  signatureDate: z.coerce.date(),
  digitalStampCode: z.string().trim().min(2).max(128),
  signatureImageUrl: z.string().trim().url().max(2048).nullable().optional(),
});

export const pgrRevisionSchema = z.object({
  id: z.number().int().positive(),
  pgrProjectId: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive().nullable(),
  versionNumber: z.string(),
  revisionSummary: z.string(),
  changesDescription: z.string(),
  sectionObservations: z.string().nullable(),
  documentSnapshot: z.string().nullable(),
  createdByUserId: z.number().int().positive(),
  createdAt: z.date(),
});

export const pgrTechnicalSignatureSchema = z.object({
  id: z.number().int().positive(),
  pgrProjectId: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  professionalName: z.string(),
  professionalRole: z.string(),
  professionalRegistry: z.string(),
  signatureDate: z.date(),
  digitalStampCode: z.string(),
  signatureImageUrl: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

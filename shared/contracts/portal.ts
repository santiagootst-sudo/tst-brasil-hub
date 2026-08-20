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
  email: z.string().trim().email().max(320).nullable().optional(),
  hiredAt: z.coerce.date().nullable().optional(),
});

export const updateEmployeeEmailInput = workspaceIdInput.extend({
  employeeId: z.number().int().positive(),
  email: z.string().trim().email().max(320),
});

export const uploadCompanyLogoInput = workspaceIdInput.extend({
  companyId: z.number().int().positive(),
  dataUrl: z.string().min(32).max(3_500_000).optional(),
  remoteUrl: z.string().url().max(2048).optional(),
}).refine(input => Boolean(input.dataUrl || input.remoteUrl), { message: "Envie a imagem do logo." });

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
  dataUrl: z.string().min(15, "Envie o arquivo codificado em base64.").optional(),
  remoteUrl: z.string().url("O endereço do arquivo técnico é inválido.").max(2048).optional(),
}).refine(input => Boolean(input.dataUrl || input.remoteUrl), { message: "Envie o arquivo técnico do PGR." });

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
  scheduledDates: z.array(z.coerce.date()).max(30).optional(),
  instructorName: z.string().trim().min(2).max(255).nullable().optional(),
  location: z.string().trim().min(2).max(255).nullable().optional(),
  participantIds: z.array(z.number().int().positive()).max(500).optional(),
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

export const billingPlanCodes = ["mensal", "trimestral", "anual"] as const;
export const billingPlanCodeSchema = z.enum(billingPlanCodes);
export const billingCycleSchema = z.enum(["mensal", "trimestral", "anual"]);

export const checkoutInput = z.object({ planCode: billingPlanCodeSchema });

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
  email: z.string().nullable(),
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
  scheduledDates: z.array(z.date()).default([]),
  instructorName: z.string().nullable(),
  location: z.string().nullable(),
  participantCount: z.number().int().nonnegative(),
  participants: z.array(z.object({ employeeId: z.number().int().positive(), fullName: z.string(), companyId: z.number().int().positive() })).default([]),
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
  code: billingPlanCodeSchema,
  name: z.string(),
  audience: z.string(),
  billingCycle: billingCycleSchema,
  displayPrice: z.string(),
  recurringDisplayPrice: z.string(),
  promotionDisplayPrice: z.string(),
  initialPriceCents: z.number().int().nonnegative(),
  recurringPriceCents: z.number().int().nonnegative(),
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
  logoKey: z.string().nullable(),
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
  email: z.string().nullable(),
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
  scheduledDates: z.array(z.date()).optional(),
  instructorName: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
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

export const accidentNatures = ["typical", "commuting", "occupational_disease", "other"] as const;
export const accidentSeverities = ["minor", "moderate", "serious", "critical"] as const;
export const bodySides = ["left", "right", "center", "not_applicable"] as const;
export const bodyRegions = ["head", "face", "neck", "shoulder_left", "shoulder_right", "chest", "abdomen", "back", "pelvis", "arm_left", "arm_right", "forearm_left", "forearm_right", "hand_left", "hand_right", "finger_left", "finger_right", "thigh_left", "thigh_right", "knee_left", "knee_right", "leg_left", "leg_right", "ankle_left", "ankle_right", "foot_left", "foot_right", "other"] as const;
export const accidentNatureSchema = z.enum(accidentNatures);
export const accidentSeveritySchema = z.enum(accidentSeverities);
export const bodySideSchema = z.enum(bodySides);
export const bodyRegionSchema = z.enum(bodyRegions);

export const createEpiItemInput = workspaceIdInput.extend({
  companyId: z.number().int().positive(),
  name: z.string().trim().min(2).max(255),
  imageUrl: z.string().url().max(2048).nullable().optional(),
  responsibleName: z.string().trim().min(2).max(255).nullable().optional(),
  renewalRequested: z.boolean().default(false),
  caNumber: z.string().trim().max(64).nullable().optional(),
  manufacturer: z.string().trim().max(160).nullable().optional(),
  lotNumber: z.string().trim().max(100).nullable().optional(),
  caExpiresAt: z.coerce.date().nullable().optional(),
  equipmentExpiresAt: z.coerce.date().nullable().optional(),
  protectionDescription: z.string().trim().max(1000).nullable().optional(),
  limitations: z.string().trim().max(1000).nullable().optional(),
  careInstructions: z.string().trim().max(1500).nullable().optional(),
  manualUrl: z.string().url().max(2048).nullable().optional(),
  requiresTraining: z.boolean().default(false),
  stockQuantity: z.number().int().min(0).max(1_000_000).default(0),
  minimumStock: z.number().int().min(0).max(1_000_000).default(0),
  expiresAt: z.coerce.date().nullable().optional(),
});

export const updateEpiItemInput = createEpiItemInput.extend({
  epiItemId: z.number().int().positive(),
});

export const createEpiDeliveryInput = workspaceIdInput.extend({
  companyId: z.number().int().positive(),
  epiItemId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  quantity: z.number().int().positive().max(1000).default(1),
  deliveryKind: z.enum(["initial", "replacement"]).default("initial"),
  deliveryReason: z.enum(["initial", "scheduled_replacement", "damage", "loss", "expiry", "hygiene", "other"]).default("initial"),
  sourceDeliveryId: z.number().int().positive().nullable().optional(),
  deliveredAt: z.coerce.date(),
  replacementDueAt: z.coerce.date().nullable().optional(),
  conditionAtDelivery: z.enum(["new", "sanitized", "inspected"]).default("new"),
  orientationTopics: z.string().trim().min(20).max(1000),
  orientationConfirmed: z.literal(true),
  trainingRequired: z.boolean().default(false),
  trainingCompletedAt: z.coerce.date().nullable().optional(),
  deliveredByName: z.string().trim().min(2).max(255),
  notes: z.string().trim().max(1000).nullable().optional(),
  signedByName: z.string().trim().min(2).max(255).nullable().optional(),
  digitalSignature: z.string().trim().max(255).nullable().optional(),
});

export const signEpiDeliveryInput = workspaceIdInput.extend({
  deliveryId: z.number().int().positive(),
  signedByName: z.string().trim().min(2).max(255),
  digitalSignature: z.string().trim().min(8).max(255),
  orientationConfirmed: z.literal(true),
});

export const sendEpiEvidenceInput = workspaceIdInput.extend({
  deliveryId: z.number().int().positive(),
});

export const epiEvidencePublicInput = z.object({
  verificationCode: z.string().trim().min(20).max(64),
});

export const verifyEpiEvidenceOtpInput = epiEvidencePublicInput.extend({
  otp: z.string().trim().regex(/^\d{6}$/, "Informe o código de 6 dígitos enviado ao seu e-mail."),
  receiptConfirmed: z.literal(true),
});

export const epiEvidenceDetailInput = workspaceIdInput.extend({
  deliveryId: z.number().int().positive(),
});

export const listEpiEvidenceInput = workspaceIdInput.extend({
  companyId: z.number().int().positive().nullable().optional(),
  limit: z.number().int().min(1).max(500).default(100),
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

export const accidentInjuryInput = z.object({
  bodyRegion: bodyRegionSchema,
  bodySide: bodySideSchema.default("not_applicable"),
  lesionType: z.string().trim().min(2).max(160),
  severity: accidentSeveritySchema,
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const createAccidentInput = workspaceIdInput.extend({
  companyId: z.number().int().positive(),
  departmentId: z.number().int().positive().nullable().optional(),
  employeeId: z.number().int().positive().nullable().optional(),
  occupationalRiskId: z.number().int().positive().nullable().optional(),
  inspectionId: z.number().int().positive().nullable().optional(),
  occurredAt: z.coerce.date(),
  summary: z.string().trim().min(10).max(1000),
  accidentNature: accidentNatureSchema.default("typical"),
  accidentType: z.string().trim().max(160).nullable().optional(),
  injuryAgent: z.string().trim().max(255).nullable().optional(),
  esocialAgentCode: z.string().trim().max(64).nullable().optional(),
  characterization: z.string().trim().max(160).nullable().optional(),
  medicalTreatment: z.string().trim().max(255).nullable().optional(),
  daysAway: z.number().int().min(0).max(3650).default(0),
  catNumber: z.string().trim().max(64).nullable().optional(),
  severity: accidentSeveritySchema.default("minor"),
  immediateActions: z.string().trim().max(5000).nullable().optional(),
  immediateCause: z.string().trim().max(5000).nullable().optional(),
  rootCause: z.string().trim().max(5000).nullable().optional(),
  injuries: z.array(accidentInjuryInput).min(1).max(12),
});

export const epiItemSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  name: z.string(),
  imageUrl: z.string().nullable(),
  responsibleName: z.string().nullable(),
  renewalRequested: z.boolean(),
  caNumber: z.string().nullable(),
  manufacturer: z.string().nullable(),
  lotNumber: z.string().nullable(),
  caExpiresAt: z.date().nullable(),
  equipmentExpiresAt: z.date().nullable(),
  protectionDescription: z.string().nullable(),
  limitations: z.string().nullable(),
  careInstructions: z.string().nullable(),
  manualUrl: z.string().nullable(),
  requiresTraining: z.boolean(),
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
  deliveryReason: z.enum(["initial", "scheduled_replacement", "damage", "loss", "expiry", "hygiene", "other"]),
  sourceDeliveryId: z.number().int().positive().nullable(),
  deliveredAt: z.date(),
  replacementDueAt: z.date().nullable(),
  lotNumber: z.string().nullable(),
  caNumber: z.string().nullable(),
  manufacturer: z.string().nullable(),
  protectionDescription: z.string().nullable(),
  limitations: z.string().nullable(),
  careInstructions: z.string().nullable(),
  conditionAtDelivery: z.enum(["new", "sanitized", "inspected"]),
  orientationTopics: z.string().nullable(),
  orientationConfirmedAt: z.date().nullable(),
  trainingRequired: z.boolean(),
  trainingCompletedAt: z.date().nullable(),
  deliveredByName: z.string().nullable(),
  receiptAcceptedAt: z.date().nullable(),
  receiptAcceptanceMethod: z.enum(["internal_confirmation", "email_otp", "biometric", "qualified_signature"]),
  notes: z.string().nullable(),
  signedByName: z.string().nullable(),
  digitalSignature: z.string().nullable(),
  returnStatus: z.enum(["delivered", "returned", "replaced"]),
  createdByUserId: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const epiDeliveryEvidenceStatusSchema = z.enum(["draft", "sent", "viewed", "confirmed", "expired", "revoked", "failed"]);
export const epiDeliveryAuditEventTypeSchema = z.enum(["evidence_created", "email_sent", "email_failed", "link_opened", "otp_failed", "otp_verified", "receipt_confirmed", "evidence_expired", "evidence_revoked", "support_viewed"]);

export const epiDeliveryEvidenceSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  deliveryId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  recipientEmail: z.string(),
  status: epiDeliveryEvidenceStatusSchema,
  verificationCode: z.string(),
  documentHash: z.string().length(64),
  documentVersion: z.string(),
  snapshotJson: z.string(),
  otpExpiresAt: z.date(),
  otpAttempts: z.number().int().nonnegative(),
  lastSentAt: z.date().nullable(),
  lastViewedAt: z.date().nullable(),
  confirmedAt: z.date().nullable(),
  providerMessageId: z.string().nullable(),
  failureReason: z.string().nullable(),
  createdByUserId: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const epiDeliveryAuditEventSchema = z.object({
  id: z.number().int().positive(),
  evidenceId: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  deliveryId: z.number().int().positive(),
  eventType: epiDeliveryAuditEventTypeSchema,
  actorType: z.enum(["manager", "employee", "system", "support"]),
  actorUserId: z.number().int().positive().nullable(),
  description: z.string(),
  metadataJson: z.string().nullable(),
  previousHash: z.string().length(64).nullable(),
  eventHash: z.string().length(64),
  createdAt: z.date(),
});

export const epiEvidencePublicSchema = z.object({
  verificationCode: z.string(),
  status: epiDeliveryEvidenceStatusSchema,
  documentHash: z.string().length(64),
  documentVersion: z.string(),
  otpExpiresAt: z.date(),
  lastViewedAt: z.date().nullable(),
  confirmedAt: z.date().nullable(),
  document: z.object({
    companyName: z.string(),
    employeeName: z.string(),
    epiName: z.string(),
    caNumber: z.string().nullable(),
    lotNumber: z.string().nullable(),
    manufacturer: z.string().nullable(),
    quantity: z.number().int().positive(),
    deliveredAt: z.date(),
    conditionAtDelivery: z.string(),
    orientationTopics: z.string().nullable(),
    deliveredByName: z.string().nullable(),
  }),
});

export const epiEvidenceDetailSchema = z.object({
  evidence: epiDeliveryEvidenceSchema,
  events: z.array(epiDeliveryAuditEventSchema),
  verificationUrl: z.string().url(),
  qrCodeDataUrl: z.string(),
});

export const epiEvidenceListItemSchema = z.object({
  evidence: epiDeliveryEvidenceSchema,
  employeeName: z.string(),
  epiName: z.string(),
  companyName: z.string(),
});

export const epiEvidenceSnapshotSchema = z.object({
  items: z.array(epiEvidenceListItemSchema),
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

export const accidentInjurySchema = z.object({
  id: z.number().int().positive(),
  accidentDetailId: z.number().int().positive(),
  occurrenceId: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  bodyRegion: bodyRegionSchema,
  bodySide: bodySideSchema,
  lesionType: z.string(),
  severity: accidentSeveritySchema,
  notes: z.string().nullable(),
  sortOrder: z.number().int().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const accidentDetailSchema = z.object({
  id: z.number().int().positive(),
  occurrenceId: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  departmentId: z.number().int().positive().nullable(),
  employeeId: z.number().int().positive().nullable(),
  occupationalRiskId: z.number().int().positive().nullable(),
  inspectionId: z.number().int().positive().nullable(),
  accidentNature: accidentNatureSchema,
  accidentType: z.string().nullable(),
  injuryAgent: z.string().nullable(),
  esocialAgentCode: z.string().nullable(),
  characterization: z.string().nullable(),
  medicalTreatment: z.string().nullable(),
  daysAway: z.number().int().nonnegative(),
  catNumber: z.string().nullable(),
  severity: accidentSeveritySchema,
  immediateActions: z.string().nullable(),
  immediateCause: z.string().nullable(),
  rootCause: z.string().nullable(),
  createdByUserId: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const accidentRecordSchema = z.object({
  occurrence: sstOccurrenceSchema,
  detail: accidentDetailSchema,
  injuries: z.array(accidentInjurySchema),
});

export const accidentSnapshotSchema = z.object({
  accidents: z.array(accidentRecordSchema),
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
  imageUrl: z.string().nullable(),
  responsibleName: z.string().nullable(),
  renewalRequested: z.boolean(),
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
  occupationalRiskId: z.number().int().positive().nullable().optional(),
  title: z.string().trim().min(3).max(255),
  dueAt: z.coerce.date().nullable().optional(),
  notes: z.string().trim().max(1500).nullable().optional(),
});

export const createActionItemInput = workspaceIdInput.extend({
  companyId: z.number().int().positive(),
  inspectionId: z.number().int().positive().nullable().optional(),
  occupationalRiskId: z.number().int().positive().nullable().optional(),
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
  occupationalRiskId: z.number().int().positive().nullable(),
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
  occupationalRiskId: z.number().int().positive().nullable(),
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
  occupationalRiskId: z.number().int().positive().nullable(),
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
  occupationalRiskId: z.number().int().positive().nullable(),
  departmentId: z.number().int().positive().nullable(),
  responsibleEmployeeId: z.number().int().positive().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  dueAt: z.date().nullable(),
  status: z.literal("open"),
  createdByUserId: z.number().int().positive(),
});

export const occupationalRiskGroups = ["physical", "chemical", "biological", "ergonomic", "accident", "psychosocial", "other"] as const;
export const occupationalRiskSources = ["pgr", "inspection", "combined"] as const;
export const occupationalRiskSituations = ["identified", "in_treatment", "controlled", "eliminated"] as const;
export const occupationalRiskGroupSchema = z.enum(occupationalRiskGroups);
export const occupationalRiskSourceSchema = z.enum(occupationalRiskSources);
export const occupationalRiskSituationSchema = z.enum(occupationalRiskSituations);

const riskScoreInput = z.number().int().min(1).max(5);

export const createOccupationalRiskInput = workspaceIdInput.extend({
  companyId: z.number().int().positive(),
  pgrProjectId: z.number().int().positive().nullable().optional(),
  departmentId: z.number().int().positive().nullable().optional(),
  jobRoleId: z.number().int().positive().nullable().optional(),
  title: z.string().trim().min(3).max(255),
  description: z.string().trim().max(1500).nullable().optional(),
  riskGroup: occupationalRiskGroupSchema,
  source: occupationalRiskSourceSchema.default("pgr"),
  inherentProbability: riskScoreInput,
  inherentSeverity: riskScoreInput,
  controls: z.string().trim().max(1500).nullable().optional(),
  exposedWorkersCount: z.number().int().min(0).max(100000).default(0),
});

export const updateOccupationalRiskInput = workspaceIdInput.extend({
  riskId: z.number().int().positive(),
  situation: occupationalRiskSituationSchema,
  residualProbability: riskScoreInput.nullable().optional(),
  residualSeverity: riskScoreInput.nullable().optional(),
  controls: z.string().trim().max(1500).nullable().optional(),
  notes: z.string().trim().max(1500).nullable().optional(),
  lastInspectionId: z.number().int().positive().nullable().optional(),
});

export const occupationalRiskSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  pgrProjectId: z.number().int().positive().nullable(),
  departmentId: z.number().int().positive().nullable(),
  jobRoleId: z.number().int().positive().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  riskGroup: occupationalRiskGroupSchema,
  source: occupationalRiskSourceSchema,
  inherentProbability: z.number().int(),
  inherentSeverity: z.number().int(),
  inherentScore: z.number().int(),
  residualProbability: z.number().int().nullable(),
  residualSeverity: z.number().int().nullable(),
  residualScore: z.number().int().nullable(),
  situation: occupationalRiskSituationSchema,
  controls: z.string().nullable(),
  exposedWorkersCount: z.number().int(),
  identifiedAt: z.date(),
  controlVerifiedAt: z.date().nullable(),
  eliminatedAt: z.date().nullable(),
  lastInspectionId: z.number().int().positive().nullable(),
  createdByUserId: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const occupationalRiskEventSchema = z.object({
  id: z.number().int().positive(),
  occupationalRiskId: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  departmentId: z.number().int().positive().nullable(),
  eventType: z.enum(["identified", "treatment_started", "control_verified", "reduced", "eliminated", "reopened"]),
  previousSituation: z.string().nullable(),
  nextSituation: z.string().nullable(),
  previousScore: z.number().int().nullable(),
  nextScore: z.number().int().nullable(),
  notes: z.string().nullable(),
  occurredAt: z.date(),
  createdByUserId: z.number().int().positive(),
  createdAt: z.date(),
});

export const occupationalRiskSnapshotSchema = z.object({
  risks: z.array(occupationalRiskSchema),
  events: z.array(occupationalRiskEventSchema),
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

export const cipaCommissionStatusSchema = z.enum(["planning", "election", "active", "archived"]);
export const cipaTermStatusSchema = z.enum(["planning", "election", "active", "closed"]);
export const cipaMemberRoleSchema = z.enum(["election_committee", "candidate", "employer_representative", "employee_representative"]);
export const cipaMemberConditionSchema = z.enum(["titular", "suplente", "not_applicable"]);
export const cipaMemberStatusSchema = z.enum(["active", "withdrawn", "elected", "not_elected"]);
export const cipaDocumentTypeSchema = z.enum(["election_committee", "union_notice", "notice", "registration", "ballot", "election_minutes", "possession_minutes", "work_plan"]);
export const cipaMeetingTypeSchema = z.enum(["ordinary", "extraordinary"]);
export const cipaMeetingStatusSchema = z.enum(["scheduled", "completed", "cancelled"]);

export const createCipaCommissionInput = workspaceIdInput.extend({
  companyId: z.number().int().positive(),
  riskLevel: z.number().int().min(1).max(4),
  employeeCount: z.number().int().min(0).max(100_000),
  city: z.string().trim().max(160).nullable().optional(),
  workplace: z.string().trim().max(255).nullable().optional(),
  unionName: z.string().trim().max(255).nullable().optional(),
  termLabel: z.string().trim().min(4).max(64),
  enrollmentStartsAt: z.coerce.date().nullable().optional(),
  electionAt: z.coerce.date().nullable().optional(),
  possessionAt: z.coerce.date().nullable().optional(),
  endsAt: z.coerce.date().nullable().optional(),
});

export const createCipaMemberInput = workspaceIdInput.extend({
  commissionId: z.number().int().positive(),
  termId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  role: cipaMemberRoleSchema,
  condition: cipaMemberConditionSchema.default("not_applicable"),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const updateCipaMemberElectionInput = workspaceIdInput.extend({
  memberId: z.number().int().positive(),
  voteCount: z.number().int().min(0).max(1_000_000),
  status: cipaMemberStatusSchema,
  condition: cipaMemberConditionSchema,
});

export const createCipaDocumentInput = workspaceIdInput.extend({
  commissionId: z.number().int().positive(),
  termId: z.number().int().positive(),
  type: cipaDocumentTypeSchema,
  title: z.string().trim().min(3).max(255),
  content: z.string().trim().min(10).max(30_000),
});

const cipaMeetingInputFields = {
  title: z.string().trim().min(3).max(255),
  meetingType: cipaMeetingTypeSchema.default("ordinary"),
  scheduledAt: z.coerce.date(),
  location: z.string().trim().max(255).nullable().optional(),
  agenda: z.string().trim().max(2000).nullable().optional(),
  minutesSummary: z.string().trim().max(4000).nullable().optional(),
  status: cipaMeetingStatusSchema.default("scheduled"),
};

export const createCipaMeetingInput = workspaceIdInput.extend({
  commissionId: z.number().int().positive(),
  termId: z.number().int().positive(),
  ...cipaMeetingInputFields,
});

export const updateCipaMeetingInput = workspaceIdInput.extend({
  meetingId: z.number().int().positive(),
  ...cipaMeetingInputFields,
});

export const cipaCommissionSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  status: cipaCommissionStatusSchema,
  riskLevel: z.number().int().min(1).max(4),
  employeeCount: z.number().int().nonnegative(),
  city: z.string().nullable(),
  workplace: z.string().nullable(),
  unionName: z.string().nullable(),
  createdByUserId: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const cipaTermSchema = z.object({
  id: z.number().int().positive(),
  commissionId: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  label: z.string(),
  enrollmentStartsAt: z.date().nullable(),
  electionAt: z.date().nullable(),
  possessionAt: z.date().nullable(),
  endsAt: z.date().nullable(),
  status: cipaTermStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const cipaMemberSchema = z.object({
  id: z.number().int().positive(),
  commissionId: z.number().int().positive(),
  termId: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  role: cipaMemberRoleSchema,
  condition: cipaMemberConditionSchema,
  voteCount: z.number().int().nonnegative(),
  status: cipaMemberStatusSchema,
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const cipaDocumentSchema = z.object({
  id: z.number().int().positive(),
  commissionId: z.number().int().positive(),
  termId: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  type: cipaDocumentTypeSchema,
  title: z.string(),
  content: z.string(),
  companyLogoUrl: z.string().nullable(),
  createdByUserId: z.number().int().positive(),
  createdAt: z.date(),
});

export const cipaMeetingSchema = z.object({
  id: z.number().int().positive(),
  commissionId: z.number().int().positive(),
  termId: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  title: z.string(),
  meetingType: cipaMeetingTypeSchema,
  scheduledAt: z.date(),
  location: z.string().nullable(),
  agenda: z.string().nullable(),
  minutesSummary: z.string().nullable(),
  status: cipaMeetingStatusSchema,
  createdByUserId: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const cipaSnapshotSchema = z.object({
  companies: z.array(companySchema),
  employees: z.array(employeeSchema),
  commissions: z.array(cipaCommissionSchema),
  terms: z.array(cipaTermSchema),
  members: z.array(cipaMemberSchema),
  documents: z.array(cipaDocumentSchema),
  meetings: z.array(cipaMeetingSchema),
});

export const cipaCommissionCreatedSchema = z.object({
  commission: cipaCommissionSchema,
  term: cipaTermSchema,
});

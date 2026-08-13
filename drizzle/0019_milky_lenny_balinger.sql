CREATE TABLE `action_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`companyId` int NOT NULL,
	`inspectionId` int,
	`departmentId` int,
	`responsibleEmployeeId` int,
	`title` varchar(255) NOT NULL,
	`description` varchar(1500),
	`dueAt` timestamp,
	`status` enum('open','in_progress','completed') NOT NULL DEFAULT 'open',
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `action_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_access_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`targetUserId` int NOT NULL,
	`adminUserId` int NOT NULL,
	`action` enum('renew','suspend','reactivate','disable') NOT NULL,
	`previousStatus` varchar(64),
	`nextStatus` varchar(64),
	`previousExpiresAt` timestamp,
	`nextExpiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_access_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`companyId` int,
	`category` enum('certificate','pgr','ltcat','os','pcmat','laudo','other') NOT NULL DEFAULT 'certificate',
	`participantName` varchar(255) NOT NULL,
	`trainingName` varchar(255) NOT NULL,
	`issuedAt` timestamp NOT NULL,
	`expiresAt` timestamp,
	`referenceUrl` varchar(2048),
	`notes` varchar(1500),
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `certificates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_engagements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`companyId` int NOT NULL,
	`status` enum('lead','active','inactive') NOT NULL DEFAULT 'lead',
	`nextFollowUpAt` timestamp,
	`notes` varchar(1500),
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_engagements_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_engagements_company_unique` UNIQUE(`companyId`)
);
--> statement-breakpoint
CREATE TABLE `client_visits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`companyId` int NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`objective` varchar(500) NOT NULL,
	`notes` varchar(1500),
	`status` enum('planned','completed','cancelled') NOT NULL DEFAULT 'planned',
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_visits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`document` varchar(32),
	`logoKey` varchar(512),
	`logoUrl` varchar(1024),
	`brandPrimaryColor` varchar(7),
	`brandBackgroundColor` varchar(7),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`companyId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` varchar(1000),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `departments_id` PRIMARY KEY(`id`),
	CONSTRAINT `departments_company_name_unique` UNIQUE(`companyId`,`name`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`companyId` int NOT NULL,
	`departmentId` int,
	`jobRoleId` int,
	`fullName` varchar(255) NOT NULL,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`hiredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `epi_deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`companyId` int NOT NULL,
	`epiItemId` int NOT NULL,
	`employeeId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`deliveryKind` enum('initial','replacement') NOT NULL DEFAULT 'initial',
	`deliveredAt` timestamp NOT NULL,
	`replacementDueAt` timestamp,
	`notes` varchar(1000),
	`signedByName` varchar(255),
	`digitalSignature` varchar(255),
	`returnStatus` enum('delivered','returned','replaced') NOT NULL DEFAULT 'delivered',
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `epi_deliveries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `epi_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`companyId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`caNumber` varchar(64),
	`manufacturer` varchar(160),
	`stockQuantity` int NOT NULL DEFAULT 0,
	`minimumStock` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `epi_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `epi_requirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`companyId` int NOT NULL,
	`jobRoleId` int NOT NULL,
	`epiItemId` int NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `epi_requirements_id` PRIMARY KEY(`id`),
	CONSTRAINT `epi_requirements_role_item_unique` UNIQUE(`jobRoleId`,`epiItemId`)
);
--> statement-breakpoint
CREATE TABLE `epi_returns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`companyId` int NOT NULL,
	`deliveryId` int,
	`epiItemId` int NOT NULL,
	`employeeId` int NOT NULL,
	`returnedAt` timestamp NOT NULL,
	`condition` enum('good','damaged','expired','lost') NOT NULL,
	`notes` varchar(1000),
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `epi_returns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inspection_template_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`templateId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`guidance` varchar(1000),
	`required` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inspection_template_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inspection_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`companyId` int NOT NULL,
	`departmentId` int,
	`name` varchar(255) NOT NULL,
	`riskType` varchar(120) NOT NULL,
	`routineType` varchar(120) NOT NULL,
	`description` varchar(1500),
	`active` boolean NOT NULL DEFAULT true,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inspection_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inspections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`companyId` int NOT NULL,
	`departmentId` int,
	`templateId` int,
	`title` varchar(255) NOT NULL,
	`dueAt` timestamp,
	`completedAt` timestamp,
	`notes` varchar(1500),
	`status` enum('planned','completed') NOT NULL DEFAULT 'planned',
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inspections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`companyId` int NOT NULL,
	`departmentId` int,
	`name` varchar(160) NOT NULL,
	`description` varchar(1000),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `job_roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `job_roles_company_department_name_unique` UNIQUE(`companyId`,`departmentId`,`name`)
);
--> statement-breakpoint
CREATE TABLE `materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` enum('modelo','checklist','procedimento','outro') NOT NULL DEFAULT 'outro',
	`description` varchar(1500),
	`referenceUrl` varchar(2048),
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `materials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pgr_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`companyId` int,
	`name` varchar(255) NOT NULL,
	`legacyStorageKey` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pgr_projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `pgr_projects_legacyStorageKey_unique` UNIQUE(`legacyStorageKey`)
);
--> statement-breakpoint
CREATE TABLE `pgr_revisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pgrProjectId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`companyId` int,
	`versionNumber` varchar(32) NOT NULL,
	`revisionSummary` text NOT NULL,
	`changesDescription` text NOT NULL,
	`sectionObservations` text,
	`documentSnapshot` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pgr_revisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pgr_technical_signatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pgrProjectId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`professionalName` varchar(255) NOT NULL,
	`professionalRole` varchar(128) NOT NULL DEFAULT 'Técnico em Segurança do Trabalho',
	`professionalRegistry` varchar(64) NOT NULL,
	`signatureDate` timestamp NOT NULL,
	`digitalStampCode` varchar(128) NOT NULL,
	`signatureImageUrl` varchar(2048),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pgr_technical_signatures_id` PRIMARY KEY(`id`),
	CONSTRAINT `pgr_technical_signatures_pgrProjectId_unique` UNIQUE(`pgrProjectId`)
);
--> statement-breakpoint
CREATE TABLE `psychosocial_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`companyId` int NOT NULL,
	`departmentId` int,
	`title` varchar(255) NOT NULL,
	`status` enum('draft','active','completed') NOT NULL DEFAULT 'active',
	`minRespondents` int NOT NULL DEFAULT 10,
	`respondentCount` int NOT NULL DEFAULT 0,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `psychosocial_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `psychosocial_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`respondentHash` varchar(128) NOT NULL,
	`answersJson` varchar(4000) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `psychosocial_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `psychosocial_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`dimensionKey` varchar(64) NOT NULL,
	`dimensionName` varchar(255) NOT NULL,
	`domainName` varchar(255) NOT NULL,
	`score` int NOT NULL,
	`riskLevel` enum('low','medium','high') NOT NULL,
	`exportedToPgr` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `psychosocial_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sst_occurrences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`companyId` int NOT NULL,
	`departmentId` int,
	`employeeId` int,
	`type` enum('near_miss','incident','accident') NOT NULL,
	`occurredAt` timestamp NOT NULL,
	`summary` varchar(1000) NOT NULL,
	`status` enum('open','under_review','closed') NOT NULL DEFAULT 'open',
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sst_occurrences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripeCustomerId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`stripePriceId` varchar(255),
	`planCode` varchar(64) NOT NULL,
	`status` varchar(64) NOT NULL,
	`currentPeriodEnd` timestamp,
	`cancelAtPeriodEnd` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `support_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`subject` varchar(255) NOT NULL,
	`message` varchar(2000) NOT NULL,
	`status` enum('open','in_progress','resolved') NOT NULL DEFAULT 'open',
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `support_tickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trainings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`companyId` int,
	`title` varchar(255) NOT NULL,
	`status` enum('planned','completed') NOT NULL DEFAULT 'planned',
	`scheduledAt` timestamp,
	`participantCount` int NOT NULL DEFAULT 0,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trainings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workspace_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','manager','member') NOT NULL DEFAULT 'member',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workspace_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspace_member_unique` UNIQUE(`workspaceId`,`userId`)
);
--> statement-breakpoint
CREATE INDEX `action_items_workspace_idx` ON `action_items` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `action_items_company_idx` ON `action_items` (`companyId`);--> statement-breakpoint
CREATE INDEX `action_items_status_idx` ON `action_items` (`workspaceId`,`status`);--> statement-breakpoint
CREATE INDEX `action_items_due_at_idx` ON `action_items` (`workspaceId`,`dueAt`);--> statement-breakpoint
CREATE INDEX `admin_access_audit_target_idx` ON `admin_access_audit` (`targetUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `admin_access_audit_admin_idx` ON `admin_access_audit` (`adminUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `certificates_workspace_idx` ON `certificates` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `certificates_company_idx` ON `certificates` (`companyId`);--> statement-breakpoint
CREATE INDEX `certificates_category_idx` ON `certificates` (`workspaceId`,`category`);--> statement-breakpoint
CREATE INDEX `client_engagements_workspace_idx` ON `client_engagements` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `client_engagements_status_idx` ON `client_engagements` (`workspaceId`,`status`);--> statement-breakpoint
CREATE INDEX `client_engagements_follow_up_idx` ON `client_engagements` (`workspaceId`,`nextFollowUpAt`);--> statement-breakpoint
CREATE INDEX `client_visits_workspace_idx` ON `client_visits` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `client_visits_company_idx` ON `client_visits` (`companyId`);--> statement-breakpoint
CREATE INDEX `client_visits_status_idx` ON `client_visits` (`workspaceId`,`status`);--> statement-breakpoint
CREATE INDEX `client_visits_scheduled_idx` ON `client_visits` (`workspaceId`,`scheduledAt`);--> statement-breakpoint
CREATE INDEX `companies_workspace_idx` ON `companies` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `departments_workspace_idx` ON `departments` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `departments_company_idx` ON `departments` (`companyId`);--> statement-breakpoint
CREATE INDEX `employees_workspace_idx` ON `employees` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `employees_company_idx` ON `employees` (`companyId`);--> statement-breakpoint
CREATE INDEX `employees_department_idx` ON `employees` (`departmentId`);--> statement-breakpoint
CREATE INDEX `employees_job_role_idx` ON `employees` (`jobRoleId`);--> statement-breakpoint
CREATE INDEX `employees_status_idx` ON `employees` (`workspaceId`,`status`);--> statement-breakpoint
CREATE INDEX `epi_deliveries_workspace_idx` ON `epi_deliveries` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `epi_deliveries_company_idx` ON `epi_deliveries` (`companyId`);--> statement-breakpoint
CREATE INDEX `epi_deliveries_epi_idx` ON `epi_deliveries` (`workspaceId`,`epiItemId`);--> statement-breakpoint
CREATE INDEX `epi_deliveries_employee_idx` ON `epi_deliveries` (`workspaceId`,`employeeId`);--> statement-breakpoint
CREATE INDEX `epi_deliveries_replacement_idx` ON `epi_deliveries` (`workspaceId`,`replacementDueAt`);--> statement-breakpoint
CREATE INDEX `epi_items_workspace_idx` ON `epi_items` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `epi_items_company_idx` ON `epi_items` (`companyId`);--> statement-breakpoint
CREATE INDEX `epi_items_expiry_idx` ON `epi_items` (`workspaceId`,`expiresAt`);--> statement-breakpoint
CREATE INDEX `epi_requirements_workspace_idx` ON `epi_requirements` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `epi_requirements_company_idx` ON `epi_requirements` (`companyId`);--> statement-breakpoint
CREATE INDEX `epi_returns_workspace_idx` ON `epi_returns` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `epi_returns_company_idx` ON `epi_returns` (`companyId`);--> statement-breakpoint
CREATE INDEX `epi_returns_employee_idx` ON `epi_returns` (`workspaceId`,`employeeId`);--> statement-breakpoint
CREATE INDEX `inspection_template_items_workspace_idx` ON `inspection_template_items` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `inspection_template_items_template_idx` ON `inspection_template_items` (`templateId`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `inspection_templates_workspace_idx` ON `inspection_templates` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `inspection_templates_company_idx` ON `inspection_templates` (`companyId`);--> statement-breakpoint
CREATE INDEX `inspection_templates_department_idx` ON `inspection_templates` (`departmentId`);--> statement-breakpoint
CREATE INDEX `inspection_templates_active_idx` ON `inspection_templates` (`workspaceId`,`active`);--> statement-breakpoint
CREATE INDEX `inspections_workspace_idx` ON `inspections` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `inspections_company_idx` ON `inspections` (`companyId`);--> statement-breakpoint
CREATE INDEX `inspections_status_idx` ON `inspections` (`workspaceId`,`status`);--> statement-breakpoint
CREATE INDEX `inspections_due_at_idx` ON `inspections` (`workspaceId`,`dueAt`);--> statement-breakpoint
CREATE INDEX `job_roles_workspace_idx` ON `job_roles` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `job_roles_company_idx` ON `job_roles` (`companyId`);--> statement-breakpoint
CREATE INDEX `job_roles_department_idx` ON `job_roles` (`departmentId`);--> statement-breakpoint
CREATE INDEX `materials_workspace_idx` ON `materials` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `pgr_projects_workspace_idx` ON `pgr_projects` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `pgr_revisions_project_idx` ON `pgr_revisions` (`pgrProjectId`);--> statement-breakpoint
CREATE INDEX `pgr_revisions_workspace_idx` ON `pgr_revisions` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `pgr_signatures_project_idx` ON `pgr_technical_signatures` (`pgrProjectId`);--> statement-breakpoint
CREATE INDEX `psychosocial_applications_workspace_idx` ON `psychosocial_applications` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `psychosocial_applications_company_idx` ON `psychosocial_applications` (`companyId`);--> statement-breakpoint
CREATE INDEX `psychosocial_responses_app_idx` ON `psychosocial_responses` (`applicationId`);--> statement-breakpoint
CREATE INDEX `psychosocial_results_app_idx` ON `psychosocial_results` (`applicationId`);--> statement-breakpoint
CREATE INDEX `psychosocial_results_risk_idx` ON `psychosocial_results` (`applicationId`,`riskLevel`);--> statement-breakpoint
CREATE INDEX `sst_occurrences_workspace_idx` ON `sst_occurrences` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `sst_occurrences_company_idx` ON `sst_occurrences` (`companyId`);--> statement-breakpoint
CREATE INDEX `sst_occurrences_status_idx` ON `sst_occurrences` (`workspaceId`,`status`);--> statement-breakpoint
CREATE INDEX `sst_occurrences_occurred_at_idx` ON `sst_occurrences` (`workspaceId`,`occurredAt`);--> statement-breakpoint
CREATE INDEX `subscriptions_customer_idx` ON `subscriptions` (`stripeCustomerId`);--> statement-breakpoint
CREATE INDEX `support_tickets_workspace_idx` ON `support_tickets` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `trainings_workspace_idx` ON `trainings` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `trainings_company_idx` ON `trainings` (`companyId`);--> statement-breakpoint
CREATE INDEX `workspace_members_user_idx` ON `workspace_members` (`userId`);
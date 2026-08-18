CREATE TABLE `cipa_commissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`companyId` int NOT NULL,
	`status` enum('planning','election','active','archived') NOT NULL DEFAULT 'planning',
	`riskLevel` int NOT NULL,
	`employeeCount` int NOT NULL,
	`city` varchar(160),
	`workplace` varchar(255),
	`unionName` varchar(255),
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cipa_commissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `cipa_commissions_workspace_company_unique` UNIQUE(`workspaceId`,`companyId`)
);
--> statement-breakpoint
CREATE TABLE `cipa_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`commissionId` int NOT NULL,
	`termId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`type` enum('election_committee','union_notice','notice','registration','ballot','election_minutes','possession_minutes','work_plan') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`companyLogoUrl` varchar(2048),
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cipa_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cipa_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`commissionId` int NOT NULL,
	`termId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`employeeId` int NOT NULL,
	`role` enum('election_committee','candidate','employer_representative','employee_representative') NOT NULL,
	`condition` enum('titular','suplente','not_applicable') NOT NULL DEFAULT 'not_applicable',
	`voteCount` int NOT NULL DEFAULT 0,
	`status` enum('active','withdrawn','elected','not_elected') NOT NULL DEFAULT 'active',
	`notes` varchar(1000),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cipa_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `cipa_members_term_employee_role_unique` UNIQUE(`termId`,`employeeId`,`role`)
);
--> statement-breakpoint
CREATE TABLE `cipa_terms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`commissionId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`label` varchar(64) NOT NULL,
	`enrollmentStartsAt` timestamp,
	`electionAt` timestamp,
	`possessionAt` timestamp,
	`endsAt` timestamp,
	`status` enum('planning','election','active','closed') NOT NULL DEFAULT 'planning',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cipa_terms_id` PRIMARY KEY(`id`),
	CONSTRAINT `cipa_terms_commission_label_unique` UNIQUE(`commissionId`,`label`)
);
--> statement-breakpoint
CREATE INDEX `cipa_commissions_workspace_idx` ON `cipa_commissions` (`workspaceId`,`status`);--> statement-breakpoint
CREATE INDEX `cipa_commissions_company_idx` ON `cipa_commissions` (`companyId`);--> statement-breakpoint
CREATE INDEX `cipa_documents_term_idx` ON `cipa_documents` (`termId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `cipa_documents_workspace_idx` ON `cipa_documents` (`workspaceId`,`type`);--> statement-breakpoint
CREATE INDEX `cipa_members_term_idx` ON `cipa_members` (`termId`,`role`,`status`);--> statement-breakpoint
CREATE INDEX `cipa_members_workspace_idx` ON `cipa_members` (`workspaceId`,`employeeId`);--> statement-breakpoint
CREATE INDEX `cipa_terms_workspace_idx` ON `cipa_terms` (`workspaceId`,`status`);--> statement-breakpoint
CREATE INDEX `cipa_terms_commission_idx` ON `cipa_terms` (`commissionId`,`updatedAt`);
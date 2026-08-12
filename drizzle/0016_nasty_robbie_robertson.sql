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
CREATE INDEX `psychosocial_applications_workspace_idx` ON `psychosocial_applications` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `psychosocial_applications_company_idx` ON `psychosocial_applications` (`companyId`);--> statement-breakpoint
CREATE INDEX `psychosocial_responses_app_idx` ON `psychosocial_responses` (`applicationId`);--> statement-breakpoint
CREATE INDEX `psychosocial_results_app_idx` ON `psychosocial_results` (`applicationId`);--> statement-breakpoint
CREATE INDEX `psychosocial_results_risk_idx` ON `psychosocial_results` (`applicationId`,`riskLevel`);
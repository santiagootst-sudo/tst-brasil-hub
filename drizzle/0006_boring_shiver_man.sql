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
CREATE INDEX `epi_items_workspace_idx` ON `epi_items` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `epi_items_company_idx` ON `epi_items` (`companyId`);--> statement-breakpoint
CREATE INDEX `epi_items_expiry_idx` ON `epi_items` (`workspaceId`,`expiresAt`);--> statement-breakpoint
CREATE INDEX `epi_requirements_workspace_idx` ON `epi_requirements` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `epi_requirements_company_idx` ON `epi_requirements` (`companyId`);--> statement-breakpoint
CREATE INDEX `sst_occurrences_workspace_idx` ON `sst_occurrences` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `sst_occurrences_company_idx` ON `sst_occurrences` (`companyId`);--> statement-breakpoint
CREATE INDEX `sst_occurrences_status_idx` ON `sst_occurrences` (`workspaceId`,`status`);--> statement-breakpoint
CREATE INDEX `sst_occurrences_occurred_at_idx` ON `sst_occurrences` (`workspaceId`,`occurredAt`);
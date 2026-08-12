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
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `epi_deliveries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `epi_deliveries_workspace_idx` ON `epi_deliveries` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `epi_deliveries_company_idx` ON `epi_deliveries` (`companyId`);--> statement-breakpoint
CREATE INDEX `epi_deliveries_epi_idx` ON `epi_deliveries` (`workspaceId`,`epiItemId`);--> statement-breakpoint
CREATE INDEX `epi_deliveries_employee_idx` ON `epi_deliveries` (`workspaceId`,`employeeId`);--> statement-breakpoint
CREATE INDEX `epi_deliveries_replacement_idx` ON `epi_deliveries` (`workspaceId`,`replacementDueAt`);
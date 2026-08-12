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
ALTER TABLE `epi_deliveries` ADD `signedByName` varchar(255);--> statement-breakpoint
ALTER TABLE `epi_deliveries` ADD `digitalSignature` varchar(255);--> statement-breakpoint
ALTER TABLE `epi_deliveries` ADD `returnStatus` enum('delivered','returned','replaced') DEFAULT 'delivered' NOT NULL;--> statement-breakpoint
CREATE INDEX `epi_returns_workspace_idx` ON `epi_returns` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `epi_returns_company_idx` ON `epi_returns` (`companyId`);--> statement-breakpoint
CREATE INDEX `epi_returns_employee_idx` ON `epi_returns` (`workspaceId`,`employeeId`);
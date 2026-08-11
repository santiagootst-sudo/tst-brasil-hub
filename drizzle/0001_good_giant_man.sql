CREATE TABLE `certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`companyId` int,
	`participantName` varchar(255) NOT NULL,
	`trainingName` varchar(255) NOT NULL,
	`issuedAt` timestamp NOT NULL,
	`expiresAt` timestamp,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `certificates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `certificates_workspace_idx` ON `certificates` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `certificates_company_idx` ON `certificates` (`companyId`);
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
CREATE INDEX `trainings_workspace_idx` ON `trainings` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `trainings_company_idx` ON `trainings` (`companyId`);
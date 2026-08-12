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
CREATE TABLE `inspections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`companyId` int NOT NULL,
	`departmentId` int,
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
CREATE INDEX `action_items_workspace_idx` ON `action_items` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `action_items_company_idx` ON `action_items` (`companyId`);--> statement-breakpoint
CREATE INDEX `action_items_status_idx` ON `action_items` (`workspaceId`,`status`);--> statement-breakpoint
CREATE INDEX `action_items_due_at_idx` ON `action_items` (`workspaceId`,`dueAt`);--> statement-breakpoint
CREATE INDEX `inspections_workspace_idx` ON `inspections` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `inspections_company_idx` ON `inspections` (`companyId`);--> statement-breakpoint
CREATE INDEX `inspections_status_idx` ON `inspections` (`workspaceId`,`status`);--> statement-breakpoint
CREATE INDEX `inspections_due_at_idx` ON `inspections` (`workspaceId`,`dueAt`);
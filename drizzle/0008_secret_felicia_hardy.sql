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
CREATE INDEX `client_engagements_workspace_idx` ON `client_engagements` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `client_engagements_status_idx` ON `client_engagements` (`workspaceId`,`status`);--> statement-breakpoint
CREATE INDEX `client_engagements_follow_up_idx` ON `client_engagements` (`workspaceId`,`nextFollowUpAt`);--> statement-breakpoint
CREATE INDEX `client_visits_workspace_idx` ON `client_visits` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `client_visits_company_idx` ON `client_visits` (`companyId`);--> statement-breakpoint
CREATE INDEX `client_visits_status_idx` ON `client_visits` (`workspaceId`,`status`);--> statement-breakpoint
CREATE INDEX `client_visits_scheduled_idx` ON `client_visits` (`workspaceId`,`scheduledAt`);
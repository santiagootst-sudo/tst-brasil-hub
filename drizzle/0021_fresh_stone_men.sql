CREATE TABLE `pgr_attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pgrProjectId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`title` varchar(128) NOT NULL,
	`category` enum('photo','laudo','art','certificate','other') NOT NULL DEFAULT 'photo',
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` varchar(2048) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pgr_attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `pgr_attachments_project_idx` ON `pgr_attachments` (`pgrProjectId`);--> statement-breakpoint
CREATE INDEX `pgr_attachments_workspace_idx` ON `pgr_attachments` (`workspaceId`);
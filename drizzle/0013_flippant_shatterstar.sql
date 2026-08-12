CREATE TABLE `inspection_template_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`templateId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`guidance` varchar(1000),
	`required` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inspection_template_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inspection_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`companyId` int NOT NULL,
	`departmentId` int,
	`name` varchar(255) NOT NULL,
	`riskType` varchar(120) NOT NULL,
	`routineType` varchar(120) NOT NULL,
	`description` varchar(1500),
	`active` boolean NOT NULL DEFAULT true,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inspection_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `inspections` ADD `templateId` int;--> statement-breakpoint
CREATE INDEX `inspection_template_items_workspace_idx` ON `inspection_template_items` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `inspection_template_items_template_idx` ON `inspection_template_items` (`templateId`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `inspection_templates_workspace_idx` ON `inspection_templates` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `inspection_templates_company_idx` ON `inspection_templates` (`companyId`);--> statement-breakpoint
CREATE INDEX `inspection_templates_department_idx` ON `inspection_templates` (`departmentId`);--> statement-breakpoint
CREATE INDEX `inspection_templates_active_idx` ON `inspection_templates` (`workspaceId`,`active`);
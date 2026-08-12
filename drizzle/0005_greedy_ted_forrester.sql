CREATE TABLE `departments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`companyId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` varchar(1000),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `departments_id` PRIMARY KEY(`id`),
	CONSTRAINT `departments_company_name_unique` UNIQUE(`companyId`,`name`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`companyId` int NOT NULL,
	`departmentId` int,
	`jobRoleId` int,
	`fullName` varchar(255) NOT NULL,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`hiredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`companyId` int NOT NULL,
	`departmentId` int,
	`name` varchar(160) NOT NULL,
	`description` varchar(1000),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `job_roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `job_roles_company_department_name_unique` UNIQUE(`companyId`,`departmentId`,`name`)
);
--> statement-breakpoint
CREATE INDEX `departments_workspace_idx` ON `departments` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `departments_company_idx` ON `departments` (`companyId`);--> statement-breakpoint
CREATE INDEX `employees_workspace_idx` ON `employees` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `employees_company_idx` ON `employees` (`companyId`);--> statement-breakpoint
CREATE INDEX `employees_department_idx` ON `employees` (`departmentId`);--> statement-breakpoint
CREATE INDEX `employees_job_role_idx` ON `employees` (`jobRoleId`);--> statement-breakpoint
CREATE INDEX `employees_status_idx` ON `employees` (`workspaceId`,`status`);--> statement-breakpoint
CREATE INDEX `job_roles_workspace_idx` ON `job_roles` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `job_roles_company_idx` ON `job_roles` (`companyId`);--> statement-breakpoint
CREATE INDEX `job_roles_department_idx` ON `job_roles` (`departmentId`);
CREATE TABLE `training_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainingId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`employeeId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `training_participants_id` PRIMARY KEY(`id`),
	CONSTRAINT `training_participants_training_employee_unique` UNIQUE(`trainingId`,`employeeId`)
);
--> statement-breakpoint
ALTER TABLE `trainings` ADD `scheduledDatesJson` text;--> statement-breakpoint
ALTER TABLE `trainings` ADD `instructorName` varchar(255);--> statement-breakpoint
ALTER TABLE `trainings` ADD `location` varchar(255);--> statement-breakpoint
CREATE INDEX `training_participants_workspace_idx` ON `training_participants` (`workspaceId`,`trainingId`);--> statement-breakpoint
CREATE INDEX `training_participants_employee_idx` ON `training_participants` (`workspaceId`,`employeeId`);
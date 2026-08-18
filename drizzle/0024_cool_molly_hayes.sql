CREATE TABLE `content_material_clicks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`materialId` int NOT NULL,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_material_clicks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `content_materials` ADD `fileUrl` varchar(2048);--> statement-breakpoint
ALTER TABLE `content_materials` ADD `fileName` varchar(255);--> statement-breakpoint
ALTER TABLE `content_materials` ADD `fileMimeType` varchar(120);--> statement-breakpoint
CREATE INDEX `content_material_clicks_material_created_idx` ON `content_material_clicks` (`materialId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `content_material_clicks_user_created_idx` ON `content_material_clicks` (`userId`,`createdAt`);
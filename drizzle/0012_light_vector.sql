ALTER TABLE `certificates` ADD `category` enum('certificate','pgr','ltcat','os','pcmat','laudo','other') DEFAULT 'certificate' NOT NULL;--> statement-breakpoint
ALTER TABLE `certificates` ADD `referenceUrl` varchar(2048);--> statement-breakpoint
ALTER TABLE `certificates` ADD `notes` varchar(1500);--> statement-breakpoint
CREATE INDEX `certificates_category_idx` ON `certificates` (`workspaceId`,`category`);
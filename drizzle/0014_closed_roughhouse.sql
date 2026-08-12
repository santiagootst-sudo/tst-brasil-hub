CREATE TABLE `admin_access_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`targetUserId` int NOT NULL,
	`adminUserId` int NOT NULL,
	`action` enum('renew','suspend','reactivate','disable') NOT NULL,
	`previousStatus` varchar(64),
	`nextStatus` varchar(64),
	`previousExpiresAt` timestamp,
	`nextExpiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_access_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `accessStatus` enum('active','suspended') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `accessExpiresAt` timestamp;--> statement-breakpoint
CREATE INDEX `admin_access_audit_target_idx` ON `admin_access_audit` (`targetUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `admin_access_audit_admin_idx` ON `admin_access_audit` (`adminUserId`,`createdAt`);
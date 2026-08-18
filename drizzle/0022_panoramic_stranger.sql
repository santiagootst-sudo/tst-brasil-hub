CREATE TABLE `access_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(32),
	`companyName` varchar(255),
	`jobTitle` varchar(160),
	`status` enum('requested','approved','rejected') NOT NULL DEFAULT 'requested',
	`credentialHash` varchar(255),
	`accessExpiresAt` timestamp,
	`approvedByUserId` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `access_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `access_requests_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE INDEX `access_requests_status_idx` ON `access_requests` (`status`,`createdAt`);
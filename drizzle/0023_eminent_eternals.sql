CREATE TABLE `content_materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`placement` enum('marketplace','library') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` varchar(1500) NOT NULL,
	`category` varchar(100) NOT NULL,
	`format` enum('modelo','planilha','checklist','ebook','curso','documento','outro') NOT NULL DEFAULT 'outro',
	`salePlatform` enum('hotmart','kiwify','externo','nenhuma') NOT NULL DEFAULT 'nenhuma',
	`priceCents` int,
	`referenceUrl` varchar(2048),
	`coverUrl` varchar(2048),
	`status` enum('draft','published','hidden') NOT NULL DEFAULT 'draft',
	`featured` boolean NOT NULL DEFAULT false,
	`createdByUserId` int NOT NULL,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_materials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `content_materials_public_idx` ON `content_materials` (`placement`,`status`,`featured`);--> statement-breakpoint
CREATE INDEX `content_materials_updated_idx` ON `content_materials` (`updatedAt`);
ALTER TABLE `epi_items` ADD `responsibleName` varchar(255);--> statement-breakpoint
ALTER TABLE `epi_items` ADD `renewalRequested` boolean DEFAULT false NOT NULL;
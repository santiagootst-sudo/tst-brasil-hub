DROP INDEX `workspaces_owner_idx` ON `workspaces`;--> statement-breakpoint
ALTER TABLE `workspaces` ADD CONSTRAINT `workspaces_owner_unique` UNIQUE(`ownerUserId`);
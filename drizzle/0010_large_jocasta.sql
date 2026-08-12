ALTER TABLE `workspaces` DROP INDEX `workspaces_owner_unique`;--> statement-breakpoint
ALTER TABLE `workspaces` DROP INDEX `workspaces_owner_unique`;
ALTER TABLE `workspaces` ADD CONSTRAINT `workspaces_owner_kind_unique` UNIQUE(`ownerUserId`,`kind`);

CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`document` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pgr_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`companyId` int,
	`name` varchar(255) NOT NULL,
	`legacyStorageKey` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pgr_projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `pgr_projects_legacyStorageKey_unique` UNIQUE(`legacyStorageKey`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripeCustomerId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`stripePriceId` varchar(255),
	`planCode` varchar(64) NOT NULL,
	`status` varchar(64) NOT NULL,
	`currentPeriodEnd` timestamp,
	`cancelAtPeriodEnd` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` varchar(255),
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `workspace_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','manager','member') NOT NULL DEFAULT 'member',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workspace_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspace_member_unique` UNIQUE(`workspaceId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`kind` enum('autonomo','clt') NOT NULL,
	`ownerUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaces_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `companies_workspace_idx` ON `companies` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `pgr_projects_workspace_idx` ON `pgr_projects` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `subscriptions_customer_idx` ON `subscriptions` (`stripeCustomerId`);--> statement-breakpoint
CREATE INDEX `workspace_members_user_idx` ON `workspace_members` (`userId`);--> statement-breakpoint
CREATE INDEX `workspaces_owner_idx` ON `workspaces` (`ownerUserId`);
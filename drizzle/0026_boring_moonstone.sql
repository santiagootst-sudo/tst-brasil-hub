CREATE TABLE `cipa_meetings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`commissionId` int NOT NULL,
	`termId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`meetingType` enum('ordinary','extraordinary') NOT NULL DEFAULT 'ordinary',
	`scheduledAt` timestamp NOT NULL,
	`location` varchar(255),
	`agenda` varchar(2000),
	`minutesSummary` varchar(4000),
	`status` enum('scheduled','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cipa_meetings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `youtube_videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` varchar(1500) NOT NULL,
	`category` varchar(100) NOT NULL,
	`youtubeUrl` varchar(2048) NOT NULL,
	`youtubeVideoId` varchar(32) NOT NULL,
	`thumbnailUrl` varchar(2048) NOT NULL,
	`status` enum('draft','published','hidden') NOT NULL DEFAULT 'draft',
	`featured` boolean NOT NULL DEFAULT false,
	`createdByUserId` int NOT NULL,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `youtube_videos_id` PRIMARY KEY(`id`),
	CONSTRAINT `youtube_videos_video_id_unique` UNIQUE(`youtubeVideoId`)
);
--> statement-breakpoint
CREATE INDEX `cipa_meetings_term_schedule_idx` ON `cipa_meetings` (`termId`,`scheduledAt`);--> statement-breakpoint
CREATE INDEX `cipa_meetings_workspace_schedule_idx` ON `cipa_meetings` (`workspaceId`,`scheduledAt`);--> statement-breakpoint
CREATE INDEX `youtube_videos_public_idx` ON `youtube_videos` (`status`,`featured`,`publishedAt`);--> statement-breakpoint
CREATE INDEX `youtube_videos_updated_idx` ON `youtube_videos` (`updatedAt`);
CREATE TABLE `user_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`progress` text NOT NULL,
	`xp` int NOT NULL DEFAULT 0,
	`streak` int NOT NULL DEFAULT 0,
	`dailyDone` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_progress_openId_unique` UNIQUE(`openId`)
);

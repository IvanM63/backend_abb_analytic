-- AlterTable
ALTER TABLE `servers` ADD COLUMN `cur_activity_monitoring` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `max_activity_monitoring` INTEGER NOT NULL DEFAULT 0;

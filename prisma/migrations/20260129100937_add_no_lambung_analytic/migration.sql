/*
  Warnings:

  - You are about to drop the column `cur_activity_monitoring` on the `servers` table. All the data in the column will be lost.
  - You are about to drop the column `max_activity_monitoring` on the `servers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `servers` DROP COLUMN `cur_activity_monitoring`,
    DROP COLUMN `max_activity_monitoring`,
    ADD COLUMN `cur_nomor_lambung` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `max_nomor_lambung` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `nomor_lambung` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `primary_analytics_id` INTEGER NOT NULL,
    `cctv_id` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `avg_speed` DOUBLE NOT NULL,
    `max_speed` DOUBLE NOT NULL,
    `no_lambung` VARCHAR(191) NOT NULL,
    `capture_img` TEXT NULL,
    `datetime_send` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `nomor_lambung` ADD CONSTRAINT `nomor_lambung_primary_analytics_id_fkey` FOREIGN KEY (`primary_analytics_id`) REFERENCES `primary_analytics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nomor_lambung` ADD CONSTRAINT `nomor_lambung_cctv_id_fkey` FOREIGN KEY (`cctv_id`) REFERENCES `cctv`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

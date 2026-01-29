-- AlterTable
ALTER TABLE `servers` ADD COLUMN `cur_ppe_detection` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `max_ppe_detection` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `ppe_detection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `primary_analytics_id` INTEGER NOT NULL,
    `cctv_id` INTEGER NOT NULL,
    `object_id` INTEGER NULL,
    `vest` BOOLEAN NULL,
    `helmet` BOOLEAN NULL,
    `mask` BOOLEAN NULL,
    `gloves` BOOLEAN NULL,
    `goggles` BOOLEAN NULL,
    `capture_person` VARCHAR(191) NULL,
    `datetime_send` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ppe_detection` ADD CONSTRAINT `ppe_detection_primary_analytics_id_fkey` FOREIGN KEY (`primary_analytics_id`) REFERENCES `primary_analytics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ppe_detection` ADD CONSTRAINT `ppe_detection_cctv_id_fkey` FOREIGN KEY (`cctv_id`) REFERENCES `cctv`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

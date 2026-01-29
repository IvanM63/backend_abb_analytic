-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `permissions_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cctv` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `cctv_name` VARCHAR(191) NOT NULL,
    `ip_cctv` VARCHAR(191) NULL,
    `ip_server` VARCHAR(191) NULL,
    `rtsp` VARCHAR(191) NOT NULL,
    `embed` VARCHAR(191) NULL,
    `latitude` VARCHAR(191) NULL,
    `longitude` VARCHAR(191) NULL,
    `type_streaming` ENUM('embed', 'm3u8') NULL,
    `is_active` BOOLEAN NOT NULL,
    `polygon_img` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `servers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ip` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `max_activity_monitoring` INTEGER NOT NULL DEFAULT 0,
    `cur_activity_monitoring` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `servers_ip_key`(`ip`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `primary_analytics` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `servers_id` INTEGER NULL,
    `type_analytic_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sub_analytics` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `primary_analytic_id` INTEGER NOT NULL,
    `sub_type_analytic_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `type_analytic` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `type_analytic_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sub_type_analytic` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `model_has_values` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `model_id` INTEGER NOT NULL,
    `model_type` VARCHAR(191) NOT NULL,
    `value_name` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `model_has_polygons` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL DEFAULT 'receptionist',
    `cctv_id` INTEGER NOT NULL,
    `model_id` INTEGER NOT NULL,
    `model_type` VARCHAR(191) NOT NULL,
    `polygon` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `model_has_embeds` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cctv_id` INTEGER NOT NULL,
    `model_id` INTEGER NOT NULL,
    `embed` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `weapon_detection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `primary_analytics_id` INTEGER NOT NULL,
    `cctv_id` INTEGER NOT NULL,
    `weapon_type` VARCHAR(191) NOT NULL,
    `capture_img` TEXT NULL,
    `confidence` DOUBLE NOT NULL,
    `datetime_send` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `animal_population` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `primary_analytics_id` INTEGER NOT NULL,
    `cctv_id` INTEGER NOT NULL,
    `total` INTEGER NOT NULL,
    `normal` INTEGER NOT NULL,
    `sick` INTEGER NOT NULL,
    `dead` INTEGER NOT NULL,
    `datetime_send` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_monitoring` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `primary_analytics_id` INTEGER NOT NULL,
    `cctv_id` INTEGER NOT NULL,
    `capture_img` TEXT NULL,
    `sub_type_analytic` VARCHAR(191) NOT NULL,
    `datetime_send` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_rolesTousers` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_rolesTousers_AB_unique`(`A`, `B`),
    INDEX `_rolesTousers_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_permissionsToroles` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_permissionsToroles_AB_unique`(`A`, `B`),
    INDEX `_permissionsToroles_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_cctvToprimary_analytics` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_cctvToprimary_analytics_AB_unique`(`A`, `B`),
    INDEX `_cctvToprimary_analytics_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `cctv` ADD CONSTRAINT `cctv_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `primary_analytics` ADD CONSTRAINT `primary_analytics_servers_id_fkey` FOREIGN KEY (`servers_id`) REFERENCES `servers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `primary_analytics` ADD CONSTRAINT `primary_analytics_type_analytic_id_fkey` FOREIGN KEY (`type_analytic_id`) REFERENCES `type_analytic`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sub_analytics` ADD CONSTRAINT `sub_analytics_primary_analytic_id_fkey` FOREIGN KEY (`primary_analytic_id`) REFERENCES `primary_analytics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sub_analytics` ADD CONSTRAINT `sub_analytics_sub_type_analytic_id_fkey` FOREIGN KEY (`sub_type_analytic_id`) REFERENCES `sub_type_analytic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `model_has_polygons` ADD CONSTRAINT `model_has_polygons_cctv_id_fkey` FOREIGN KEY (`cctv_id`) REFERENCES `cctv`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `model_has_embeds` ADD CONSTRAINT `model_has_embeds_cctv_id_fkey` FOREIGN KEY (`cctv_id`) REFERENCES `cctv`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `model_has_embeds` ADD CONSTRAINT `model_has_embeds_model_id_fkey` FOREIGN KEY (`model_id`) REFERENCES `primary_analytics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `weapon_detection` ADD CONSTRAINT `weapon_detection_primary_analytics_id_fkey` FOREIGN KEY (`primary_analytics_id`) REFERENCES `primary_analytics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `weapon_detection` ADD CONSTRAINT `weapon_detection_cctv_id_fkey` FOREIGN KEY (`cctv_id`) REFERENCES `cctv`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `animal_population` ADD CONSTRAINT `animal_population_primary_analytics_id_fkey` FOREIGN KEY (`primary_analytics_id`) REFERENCES `primary_analytics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `animal_population` ADD CONSTRAINT `animal_population_cctv_id_fkey` FOREIGN KEY (`cctv_id`) REFERENCES `cctv`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_monitoring` ADD CONSTRAINT `activity_monitoring_primary_analytics_id_fkey` FOREIGN KEY (`primary_analytics_id`) REFERENCES `primary_analytics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_monitoring` ADD CONSTRAINT `activity_monitoring_cctv_id_fkey` FOREIGN KEY (`cctv_id`) REFERENCES `cctv`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_rolesTousers` ADD CONSTRAINT `_rolesTousers_A_fkey` FOREIGN KEY (`A`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_rolesTousers` ADD CONSTRAINT `_rolesTousers_B_fkey` FOREIGN KEY (`B`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_permissionsToroles` ADD CONSTRAINT `_permissionsToroles_A_fkey` FOREIGN KEY (`A`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_permissionsToroles` ADD CONSTRAINT `_permissionsToroles_B_fkey` FOREIGN KEY (`B`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_cctvToprimary_analytics` ADD CONSTRAINT `_cctvToprimary_analytics_A_fkey` FOREIGN KEY (`A`) REFERENCES `cctv`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_cctvToprimary_analytics` ADD CONSTRAINT `_cctvToprimary_analytics_B_fkey` FOREIGN KEY (`B`) REFERENCES `primary_analytics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

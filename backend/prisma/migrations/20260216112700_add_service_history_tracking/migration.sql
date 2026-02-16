-- AlterTable: Add service tracking fields to pmc_reports
ALTER TABLE `pmc_reports` 
  ADD COLUMN `service_count` INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- CreateIndex: Add unique constraint on workstation_id and quarter
-- First, we need to handle any existing duplicates before adding the unique constraint
-- This will keep only the most recent report for each workstation+quarter combination
DELETE t1 FROM `pmc_reports` t1
INNER JOIN `pmc_reports` t2 
WHERE 
  t1.workstation_id = t2.workstation_id 
  AND t1.quarter = t2.quarter 
  AND t1.pmc_id < t2.pmc_id;

-- Now add the unique constraint
ALTER TABLE `pmc_reports` ADD UNIQUE INDEX `pmc_reports_workstation_id_quarter_key`(`workstation_id`, `quarter`);

-- CreateTable: service_logs
CREATE TABLE `service_logs` (
    `log_id` INTEGER NOT NULL AUTO_INCREMENT,
    `pmc_id` INTEGER NOT NULL,
    `service_type` VARCHAR(30) NOT NULL,
    `service_date` DATE NOT NULL,
    `performed_by` INTEGER NOT NULL,
    `remarks` TEXT NULL,
    `workstation_status_before` VARCHAR(50) NULL,
    `workstation_status_after` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `service_logs_pmc_id_idx`(`pmc_id`),
    INDEX `service_logs_performed_by_idx`(`performed_by`),
    INDEX `service_logs_service_date_idx`(`service_date`),
    PRIMARY KEY (`log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: service_log_assets
CREATE TABLE `service_log_assets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `log_id` INTEGER NOT NULL,
    `asset_id` INTEGER NOT NULL,
    `action` VARCHAR(30) NOT NULL,
    `status_before` VARCHAR(50) NULL,
    `status_after` VARCHAR(50) NULL,
    `remarks` TEXT NULL,
    `old_property_tag` VARCHAR(50) NULL,
    `new_property_tag` VARCHAR(50) NULL,
    `replacement_asset_id` INTEGER NULL,

    INDEX `service_log_assets_log_id_idx`(`log_id`),
    INDEX `service_log_assets_asset_id_idx`(`asset_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: service_log_procedures
CREATE TABLE `service_log_procedures` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `log_id` INTEGER NOT NULL,
    `procedure_id` INTEGER NOT NULL,
    `is_checked` BOOLEAN NOT NULL DEFAULT true,
    `remarks` VARCHAR(255) NULL,

    INDEX `service_log_procedures_log_id_idx`(`log_id`),
    INDEX `service_log_procedures_procedure_id_idx`(`procedure_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `service_logs` ADD CONSTRAINT `service_logs_pmc_id_fkey` FOREIGN KEY (`pmc_id`) REFERENCES `pmc_reports`(`pmc_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_logs` ADD CONSTRAINT `service_logs_performed_by_fkey` FOREIGN KEY (`performed_by`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_log_assets` ADD CONSTRAINT `service_log_assets_log_id_fkey` FOREIGN KEY (`log_id`) REFERENCES `service_logs`(`log_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_log_assets` ADD CONSTRAINT `service_log_assets_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `inventory_assets`(`asset_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_log_procedures` ADD CONSTRAINT `service_log_procedures_log_id_fkey` FOREIGN KEY (`log_id`) REFERENCES `service_logs`(`log_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_log_procedures` ADD CONSTRAINT `service_log_procedures_procedure_id_fkey` FOREIGN KEY (`procedure_id`) REFERENCES `procedures`(`procedure_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

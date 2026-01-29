import { Router } from 'express';
import { exportWeaponDetectionData } from '../controllers/weapon-detection-export-controller';
import { authenticateToken } from '../../../middlewares/auth-middleware';
import { validateExportWeaponDetection } from '../validators/weapon-detection-export-validator';

const router = Router();

/**
 * Export weapon detection data to XLSX
 * GET /api/weapon-detection/export/all
 *
 * Query Parameters:
 * - startDate: string (required) - Start date in YYYY-MM-DD format (Jakarta timezone UTC+7)
 * - endDate: string (required) - End date in YYYY-MM-DD format (Jakarta timezone UTC+7)
 * - weaponType: string|string[] (optional) - Filter by weapon type (exact match, supports multiple values)
 * - cctvId: number (optional) - Filter by CCTV ID
 * - primaryAnalyticsId: number (optional) - Filter by Primary Analytics ID
 *
 * Examples:
 * - Single filter: /api/weapon-detection/export/all?startDate=2025-09-01&endDate=2025-09-07&weaponType=pistol
 * - Multiple filters: /api/weapon-detection/export/all?startDate=2025-09-01&endDate=2025-09-07&weaponType=pistol&weaponType=rifle
 *
 * Response: Excel file download with filename: weapon_detection_export_[startDate]_to_[endDate]_[timestamp].xlsx
 */
router.get(
  '/all',
  authenticateToken,
  validateExportWeaponDetection,
  exportWeaponDetectionData
);

export default router;

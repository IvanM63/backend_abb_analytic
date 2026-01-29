import { Router } from 'express';
import { exportActivityMonitorData } from '../controllers/activity-monitor-export-controller';
import { authenticateToken } from '../../../middlewares/auth-middleware';
import { validateExportActivityMonitor } from '../validators/activity-monitor-export-validator';

const router = Router();

/**
 * Export activity monitor data to XLSX
 * GET /api/activity-monitor/export/all
 *
 * Query Parameters:
 * - startDate: string (required) - Start date in YYYY-MM-DD format (Jakarta timezone UTC+7)
 * - endDate: string (required) - End date in YYYY-MM-DD format (Jakarta timezone UTC+7)
 * - subTypeAnalytic: string|string[] (optional) - Filter by sub type analytic (exact match, supports multiple values)
 * - cctvId: number (optional) - Filter by CCTV ID
 * - primaryAnalyticsId: number (optional) - Filter by Primary Analytics ID
 *
 * Examples:
 * - Single filter: /api/activity-monitor/export/all?startDate=2025-09-01&endDate=2025-09-07&subTypeAnalytic=person_detection
 * - Multiple filters: /api/activity-monitor/export/all?startDate=2025-09-01&endDate=2025-09-07&subTypeAnalytic=check_in&subTypeAnalytic=receptionist_gives_room_key
 *
 * Response: Excel file download with filename: activity_monitor_export_[startDate]_to_[endDate]_[timestamp].xlsx
 */
router.get(
  '/all',
  authenticateToken,
  validateExportActivityMonitor,
  exportActivityMonitorData
);

export default router;

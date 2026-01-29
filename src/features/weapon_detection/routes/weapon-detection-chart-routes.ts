import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/auth-middleware';
import {
  getDailyWeaponDetectionChartData,
  getWeaponTypesSummary,
  getDailyTotalWeaponDetectionChartData,
} from '../controllers/weapon-detection-chart-controllers';
import { validateWeaponDetectionChartQuery } from '../validators/weapon-detection-validators';

const router = Router();

// Chart/Analytics specific routes for weapon detection
router.get(
  '/daily-detail',
  authenticateToken,
  validateWeaponDetectionChartQuery,
  getDailyWeaponDetectionChartData
);

router.get(
  '/daily-total',
  authenticateToken,
  validateWeaponDetectionChartQuery,
  getDailyTotalWeaponDetectionChartData
);

router.get(
  '/weapon-types-summary',
  authenticateToken,
  validateWeaponDetectionChartQuery,
  getWeaponTypesSummary
);

export default router;

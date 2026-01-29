import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/auth-middleware';
import {
  getDailyActivityMonitorChartData,
  getDailyCheckInChartDataNew,
} from '../controllers/activity-monitor-chart-controllers';
import { validateActivityMonitorChartQuery } from '../validators/activity-monitor-validators';

const router = Router();

// Chart/Analytics specific routes for activity monitor
router.get(
  '/daily',
  authenticateToken,
  validateActivityMonitorChartQuery,
  getDailyActivityMonitorChartData
);

router.get(
  '/daily-check-in',
  authenticateToken,
  validateActivityMonitorChartQuery,
  getDailyCheckInChartDataNew
);

export default router;

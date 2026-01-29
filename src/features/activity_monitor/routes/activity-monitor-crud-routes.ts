import { Router } from 'express';
import {
  createActivityMonitor,
  deleteActivityMonitor,
  getAllActivityMonitors,
  getActivityMonitorById,
  updateActivityMonitor,
} from '../controllers/activity-monitor-crud-controllers';
import {
  validateCreateActivityMonitor,
  validateActivityMonitorParam,
  validateUpdateActivityMonitor,
  validateActivityMonitorExists,
  validateLatestDayQuery,
} from '../validators/activity-monitor-validators';
import { authenticateToken } from '../../../middlewares/auth-middleware';
import { requireGeneralToken } from '../../../middlewares/security-middleware';

import upload from '../../../config/multer';
import { getLatestDayData } from '../controllers/activity-monitor-latest-day-controllers';
import { validatePrimaryAnalyticsAndCCTVConnection } from '../../../validators/analytics-validator';

const router = Router();

// CRUD routes for activity monitor management

// GET /latest-day - Get latest day activity monitor data
router.get('/latest-day', validateLatestDayQuery, getLatestDayData);

// Get all activity monitors with pagination and search
router.get('/', authenticateToken, getAllActivityMonitors);

// Get activity monitor by ID
router.get(
  '/:id',
  authenticateToken,
  validateActivityMonitorParam,
  validateActivityMonitorExists,
  getActivityMonitorById
);

// Create activity monitor (uses requireGeneralToken as requested)
router.post(
  '/',
  requireGeneralToken,
  upload.single('captureImg'),
  validateCreateActivityMonitor,
  validatePrimaryAnalyticsAndCCTVConnection,
  createActivityMonitor
);

// Update activity monitor
router.put(
  '/:id',
  authenticateToken,
  upload.single('captureImg'),
  validateUpdateActivityMonitor,
  validatePrimaryAnalyticsAndCCTVConnection,
  validateActivityMonitorParam,
  validateActivityMonitorExists,
  updateActivityMonitor
);

// Delete activity monitor
router.delete(
  '/:id',
  authenticateToken,
  validateActivityMonitorParam,
  deleteActivityMonitor
);

export default router;

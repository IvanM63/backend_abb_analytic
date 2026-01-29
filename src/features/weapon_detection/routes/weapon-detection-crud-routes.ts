import { Router } from 'express';
import {
  createWeaponDetection,
  deleteWeaponDetection,
  getAllWeaponDetections,
  getWeaponDetectionById,
  updateWeaponDetection,
} from '../controllers/weapon-detection-crud-controllers';
import {
  validateCreateWeaponDetection,
  validateWeaponDetectionParam,
  validateUpdateWeaponDetection,
  validateWeaponDetectionExists,
  validateLatestDayQuery,
} from '../validators/weapon-detection-validators';
import { authenticateToken } from '../../../middlewares/auth-middleware';
import { requireGeneralToken } from '../../../middlewares/security-middleware';

import upload from '../../../config/multer';
import { getLatestDayData } from '../controllers/weapon-detection-latest-day-controllers';
import { validatePrimaryAnalyticsAndCCTVConnection } from '../../../validators/analytics-validator';

const router = Router();

// CRUD routes for weapon detection management

// GET /latest-day - Get latest day weapon detection data
router.get('/latest-day', validateLatestDayQuery, getLatestDayData);

// Get all weapon detections with pagination and search
router.get('/', authenticateToken, getAllWeaponDetections);

// Get weapon detection by ID
router.get(
  '/:id',
  authenticateToken,
  validateWeaponDetectionParam,
  validateWeaponDetectionExists,
  getWeaponDetectionById
);

// Create weapon detection (uses requireGeneralToken as requested)
router.post(
  '/',
  requireGeneralToken,
  upload.single('captureImg'),
  validateCreateWeaponDetection,
  validatePrimaryAnalyticsAndCCTVConnection,
  createWeaponDetection
);

// Update weapon detection
router.put(
  '/:id',
  authenticateToken,
  upload.single('captureImg'),
  validateUpdateWeaponDetection,
  validatePrimaryAnalyticsAndCCTVConnection,
  validateWeaponDetectionParam,
  validateWeaponDetectionExists,
  updateWeaponDetection
);

// Delete weapon detection
router.delete(
  '/:id',
  authenticateToken,
  validateWeaponDetectionParam,
  deleteWeaponDetection
);

export default router;

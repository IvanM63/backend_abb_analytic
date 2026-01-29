import { Router } from 'express';
import {
  createPrimaryAnalytic,
  getPrimaryAnalytics,
  getPrimaryAnalyticById,
  getPrimaryAnalyticsByCctvId,
  updatePrimaryAnalytic,
  deletePrimaryAnalytic,
  getServerCapacityStatus,
} from '../controllers/primary-analytic-controller';
import { authenticateToken } from '../middlewares/auth-middleware';
import {
  validateCreatePrimaryAnalytic,
  validateUpdatePrimaryAnalytic,
  validatePrimaryAnalyticParams,
  validateCctvParams,
} from '../validators/primary-analytic-validator';

const router = Router();

// All routes require authentication (except in test environment)
if (process.env.NODE_ENV !== 'test') {
  router.use(authenticateToken);
}

// GET /primary-analytics - Get all primary analytics with pagination and search
router.get('/', getPrimaryAnalytics);

// GET /primary-analytics/server-capacity - Get server capacity status
router.get('/server-capacity', getServerCapacityStatus);

// GET /primary-analytics/cctv/:cctvId - Get primary analytics by CCTV ID
router.get('/cctv/:cctvId', validateCctvParams, getPrimaryAnalyticsByCctvId);

// GET /primary-analytics/:id - Get a specific primary analytic by ID
router.get('/:id', validatePrimaryAnalyticParams, getPrimaryAnalyticById);

// POST /primary-analytics - Create a new primary analytic
router.post('/', validateCreatePrimaryAnalytic, createPrimaryAnalytic);

// PUT /primary-analytics/:id - Update a specific primary analytic
router.put(
  '/:id',
  validatePrimaryAnalyticParams,
  validateUpdatePrimaryAnalytic,
  updatePrimaryAnalytic
);

// DELETE /primary-analytics/:id - Delete a specific primary analytic
router.delete('/:id', validatePrimaryAnalyticParams, deletePrimaryAnalytic);

export default router;

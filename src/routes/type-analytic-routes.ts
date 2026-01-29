import { Router } from 'express';
import {
  createTypeAnalytic,
  getTypeAnalytics,
  getTypeAnalyticById,
  updateTypeAnalytic,
  deleteTypeAnalytic,
} from '../controllers/type-analytic-controller';
import { authenticateToken } from '../middlewares/auth-middleware';
import {
  validateCreateTypeAnalytic,
  validateUpdateTypeAnalytic,
  validateTypeAnalyticParams,
} from '../validators/type-analytic-validator';

const router = Router();

// All routes require authentication (except in test environment)
if (process.env.NODE_ENV !== 'test') {
  router.use(authenticateToken);
}

// GET /type-analytics - Get all type analytics with pagination and search
router.get('/', getTypeAnalytics);

// GET /type-analytics/:id - Get a specific type analytic by ID
router.get('/:id', validateTypeAnalyticParams, getTypeAnalyticById);

// POST /type-analytics - Create a new type analytic
router.post('/', validateCreateTypeAnalytic, createTypeAnalytic);

// PUT /type-analytics/:id - Update a specific type analytic
router.put(
  '/:id',
  validateTypeAnalyticParams,
  validateUpdateTypeAnalytic,
  updateTypeAnalytic
);

// DELETE /type-analytics/:id - Delete a specific type analytic
router.delete('/:id', validateTypeAnalyticParams, deleteTypeAnalytic);

export default router;

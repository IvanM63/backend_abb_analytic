import { Router } from 'express';
import {
  getAllServers,
  getServerById,
  createServer,
  updateServer,
  deleteServer,
  getServerStats,
  checkTypeAnalyticAvailability,
  getServerByIpWithCctvAnalytics,
} from '../controllers/server-controllers';
import {
  validateCreateServer,
  validateUpdateServer,
  validateServerParam,
  validateServerQuery,
  validateServerExists,
  validateTypeAnalyticParam,
} from '../validators/server-validators';
import { authenticateToken } from '../../../middlewares/auth-middleware';
import { requireGeneralToken } from '../../../middlewares/security-middleware';

const router = Router();

// Public routes - get all servers and get server by ID
router.get('/', requireGeneralToken, validateServerQuery, getAllServers);
router.get('/stats', authenticateToken, getServerStats);
router.get(
  '/:id',
  requireGeneralToken,
  validateServerParam,
  validateServerExists,
  getServerById
);

// Protected routes - require authentication
router.post('/', authenticateToken, validateCreateServer, createServer);
router.put(
  '/:id',
  authenticateToken,
  validateServerParam,
  validateServerExists,
  validateUpdateServer,
  updateServer
);
router.delete(
  '/:id',
  authenticateToken,
  validateServerParam,
  validateServerExists,
  deleteServer
);

// Check type analytic availability
router.get(
  '/check-availability/:typeAnalyticId',
  authenticateToken,
  validateTypeAnalyticParam,
  checkTypeAnalyticAvailability
);

// Get server by IP with CCTV and analytics data
router.get('/ip/:ip', requireGeneralToken, getServerByIpWithCctvAnalytics);

export default router;

import { Router } from 'express';
import {
  getAllCctvs,
  getCctvById,
  getCctvsByPrimaryAnalyticId,
  createCctv,
  updateCctvWithFormData,
  deleteCctv,
  getCCTVWithAnalytic,
} from '../controllers/cctv-controller';
import {
  validateCreateCctvForm,
  validateUpdateCctvForm,
  validateCctvParam,
  validatePrimaryAnalyticParam,
} from '../validators/cctv-validator';
import { authenticateToken } from '../../../middlewares/auth-middleware';
import upload from '../../../config/multer';

const router = Router();

// Public routes - usually these would be protected in production
router.get('/', authenticateToken, getAllCctvs);
router.get('/:id', authenticateToken, validateCctvParam, getCctvById);

// Route untuk get CCTV beserta analytic
router.get(
  '/:id/analytic',
  authenticateToken,
  validateCctvParam,
  getCCTVWithAnalytic
);
router.get(
  '/primary-analytics/:primaryAnalyticId',
  authenticateToken,
  validatePrimaryAnalyticParam,
  getCctvsByPrimaryAnalyticId
);

// Create CCTV with file upload and Zod validation
// Note: You need to install multer first: npm install multer @types/multer
router.post(
  '/',
  authenticateToken,
  upload.single('polygonImg'),
  validateCreateCctvForm,
  createCctv
);

router.put(
  '/:id',
  authenticateToken,
  upload.single('polygonImg'), // Optional image upload
  validateCctvParam, // Validate ID parameter
  validateUpdateCctvForm, // Validate form data
  updateCctvWithFormData
);

router.delete('/:id', authenticateToken, validateCctvParam, deleteCctv);

export default router;

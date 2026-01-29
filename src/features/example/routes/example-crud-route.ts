import { Router } from 'express';
import { getExampleRoute } from '../controllers/example-controller';
import { validateExampleFormData } from '../validators/example-validator';
import { authenticateToken } from '../../../middlewares/auth-middleware';
import upload from '../../../config/multer';

const router = Router();

router.post(
  '/',
  authenticateToken,
  upload.single('captureImg'),
  validateExampleFormData,
  getExampleRoute
);

export default router;

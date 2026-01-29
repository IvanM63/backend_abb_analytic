import { Router } from 'express';
import {
  register,
  login,
  getMe,
  logout,
  changePassword,
} from '../controllers/auth-controller';
import {
  authenticateToken,
  optionalAuthenticateToken,
} from '../middlewares/auth-middleware';
import {
  validateRegister,
  validateLogin,
  validateChangePassword,
} from '../validators/auth-validator';
import {
  requireRegistrationToken,
  requireAdminToken,
  rateLimit,
} from '../middlewares/security-middleware';

const router = Router();

// Public routes with security middleware
router.post(
  '/register',
  rateLimit(3, 60000), // 3 registration attempts per minute
  requireRegistrationToken,
  validateRegister,
  register
);
router.post('/login', rateLimit(10, 60000), validateLogin, login); // 10 login attempts per minute

// Semi-protected route (returns data if authenticated, empty if not)
router.get('/me', optionalAuthenticateToken, getMe);

// Protected routes
router.post('/logout', authenticateToken, logout);
router.put(
  '/change-password',
  authenticateToken,
  validateChangePassword,
  changePassword
);

export default router;

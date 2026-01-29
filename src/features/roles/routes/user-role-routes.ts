import { Router } from 'express';
import {
  getUserWithRoles,
  attachRoleToUser,
  detachRoleFromUser,
  bulkAttachRolesToUser,
  replaceUserRoles,
  getUsersByRole,
} from '../controllers/user-role-controllers';
import {
  validateAttachRoleToUser,
  validateDetachRoleFromUser,
  validateBulkAttachRolesToUser,
  validateReplaceUserRoles,
  validateUserRoleParams,
} from '../validators/user-role-validators';
import { authenticateToken } from '../../../middlewares/auth-middleware';

const router = Router();

// User role attachment routes
// GET /roles/users/:userId - Get user with their roles
router.get(
  '/users/:userId',
  authenticateToken,
  validateUserRoleParams,
  getUserWithRoles
);

// GET /roles/:roleId/users - Get users by role
router.get(
  '/:roleId/users',
  authenticateToken,
  validateUserRoleParams,
  getUsersByRole
);

// POST /roles/users/attach - Attach single role to user
router.post(
  '/users/attach',
  authenticateToken,
  validateAttachRoleToUser,
  attachRoleToUser
);

// POST /roles/users/detach - Detach single role from user
router.post(
  '/users/detach',
  authenticateToken,
  validateDetachRoleFromUser,
  detachRoleFromUser
);

// POST /roles/users/bulk-attach - Attach multiple roles to user
router.post(
  '/users/bulk-attach',
  authenticateToken,
  validateBulkAttachRolesToUser,
  bulkAttachRolesToUser
);

// PUT /roles/users/replace - Replace all user roles with new set
router.put(
  '/users/replace',
  authenticateToken,
  validateReplaceUserRoles,
  replaceUserRoles
);

export default router;

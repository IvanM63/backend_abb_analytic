import { Router } from 'express';
import {
  createRole,
  deleteRole,
  getAllRoles,
  getRoleById,
  updateRole,
} from '../controllers/roles-crud-controllers';
import {
  validateCreateRole,
  validateRoleParam,
  validateUpdateRole,
} from '../validators/roles-crud-validators';
import { authenticateToken } from '../../../middlewares/auth-middleware';

const router = Router();

// CRUD routes for roles management
router.get('/', authenticateToken, getAllRoles);
router.get('/:id', authenticateToken, validateRoleParam, getRoleById);
router.post('/', authenticateToken, validateCreateRole, createRole);
router.put(
  '/:id',
  authenticateToken,
  validateRoleParam,
  validateUpdateRole,
  updateRole
);
router.delete('/:id', authenticateToken, validateRoleParam, deleteRole);

export default router;

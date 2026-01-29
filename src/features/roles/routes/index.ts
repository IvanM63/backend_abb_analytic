import { Router } from 'express';

import roleCRUDRoutes from './roles-crud-routes';
import userRoleRoutes from './user-role-routes';

const router = Router();

router.use('/', roleCRUDRoutes); // Base CRUD routes for roles
router.use('/', userRoleRoutes); // User-role attachment routes

export default router;

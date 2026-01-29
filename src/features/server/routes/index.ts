import { Router } from 'express';
import serverRoutes from './server-routes';

const router = Router();

// Mount server routes
router.use('/', serverRoutes);

export default router;

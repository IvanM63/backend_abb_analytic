import { Router } from 'express';

import cctvRoutes from './cctv-routes';

const router = Router();

router.use('/', cctvRoutes);

export default router;

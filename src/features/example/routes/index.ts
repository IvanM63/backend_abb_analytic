import { Router } from 'express';

import exampleCRUDRoutes from './example-crud-route';

const router = Router();

router.use('/', exampleCRUDRoutes);

export default router;

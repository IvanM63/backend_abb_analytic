import { Router } from 'express';
import weaponDetectionCrudRoutes from './weapon-detection-crud-routes';
import weaponDetectionChartRoutes from './weapon-detection-chart-routes';
import weaponDetectionExportRoutes from './weapon-detection-export-routes';

const router = Router();

router.use('/', weaponDetectionCrudRoutes); // Base CRUD routes for weapon detection
router.use('/charts', weaponDetectionChartRoutes); // Chart/analytics routes
router.use('/export', weaponDetectionExportRoutes); // Export routes for weapon detection data

export default router;

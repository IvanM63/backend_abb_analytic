import { Router } from 'express';
import activityMonitorCrudRoutes from './activity-monitor-crud-routes';
import activityMonitorChartRoutes from './activity-monitor-chart-routes';
import activityMonitorExportRoutes from './activity-monitor-export-routes';

const router = Router();

router.use('/', activityMonitorCrudRoutes); // Base CRUD routes for activity monitor
router.use('/charts', activityMonitorChartRoutes); // Chart/analytics routes
router.use('/export', activityMonitorExportRoutes); // Export routes for activity monitor data

export default router;

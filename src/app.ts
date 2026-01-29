import express from 'express';
import dotenv from 'dotenv';

import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import authRoutes from './routes/auth-routes';
import rolesRoutes from './features/roles/routes';
import cctvRoutes from './features/cctv/routes/cctv-routes';
import typeAnalyticRoutes from './routes/type-analytic-routes';
import primaryAnalyticRoutes from './routes/primary-analytic-routes';
import serverRoutes from './features/server/routes';
import activityMonitorRoutes from './features/activity_monitor/routes';
import weaponDetectionRoutes from './features/weapon_detection/routes';
import milvusRoutes from './features/milvus/routes';

import exampleRoutes from './features/example/routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// CORS Configuration
// const corsOptions = {
//   origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Security-Token', 'X-API-Token'],
//   credentials: true,
//   maxAge: 86400 // 24 hours
// };

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Add cookie parser middleware

// Static files serving
const uploadsPath = path.join(process.cwd(), 'files/uploads');
app.use('/static', express.static(uploadsPath));

// Routes
app.use('/auth', authRoutes);
app.use('/roles', rolesRoutes);
app.use('/cctv', cctvRoutes);
app.use('/type-analytic', typeAnalyticRoutes);
app.use('/analytic', primaryAnalyticRoutes);
app.use('/server', serverRoutes);
app.use('/example', exampleRoutes);
app.use('/product/activity-monitoring', activityMonitorRoutes);
app.use('/product/weapon-detection', weaponDetectionRoutes);
app.use('/milvus', milvusRoutes);

app.get('/', (_req, res) => {
  res.send('Hey you found us!');
});

app.listen(port, async () => {
  console.log(`Server is running on http://localhost:${port}`);
});

export default app;

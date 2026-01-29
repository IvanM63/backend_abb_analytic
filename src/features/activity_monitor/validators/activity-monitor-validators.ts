import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Create Activity Monitor Schema
export const createActivityMonitorSchema = z.object({
  primaryAnalyticsId: z
    .string()
    .regex(/^\d+$/, 'Primary Analytics ID must be a valid number')
    .transform((val) => parseInt(val, 10))
    .refine(
      (val) => val > 0,
      'Primary Analytics ID must be a positive integer'
    ),
  cctvId: z
    .string()
    .regex(/^\d+$/, 'CCTV ID must be a valid number')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'CCTV ID must be a positive integer'),
  captureImg: z
    .any()
    .refine((file) => file?.mimetype?.startsWith('image/'), {
      message: 'File must be an image',
    })
    .refine((file) => file !== undefined && file !== null, {
      message: 'Image is required',
    }),
  subTypeAnalytic: z.string().min(1, 'Sub type analytic is required'),
  datetime_send: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
      'Datetime must be in YYYY-MM-DD HH:MM:SS format'
    )
    .refine(
      (datetime) => !isNaN(Date.parse(datetime)),
      'Invalid datetime format'
    )
    .optional(),
});

// Update Activity Monitor Schema (all fields optional)
export const updateActivityMonitorSchema =
  createActivityMonitorSchema.partial();

// Activity Monitor Param Schema
export const activityMonitorParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number'),
});

// Chart query schema for activity monitor
export const activityMonitorChartQuerySchema = z.object({
  cctvId: z.string().regex(/^\d+$/, 'CCTV ID must be a number'),
  primaryAnalyticsId: z
    .string()
    .regex(/^\d+$/, 'Primary Analytics ID must be a number'),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
});

// Latest day query schema for activity monitor
export const activityMonitorLatestDayQuerySchema = z.object({
  cctvId: z.string().regex(/^\d+$/, 'CCTV ID must be a number'),
  primaryAnalyticsId: z
    .string()
    .regex(/^\d+$/, 'Primary Analytics ID must be a number'),
});

// TypeScript types
export type CreateActivityMonitorInput = z.infer<
  typeof createActivityMonitorSchema
>;
export type UpdateActivityMonitorInput = z.infer<
  typeof updateActivityMonitorSchema
>;
export type ActivityMonitorParamInput = z.infer<
  typeof activityMonitorParamSchema
>;
export type ActivityMonitorChartQueryInput = z.infer<
  typeof activityMonitorChartQuerySchema
>;
export type ActivityMonitorLatestDayQueryInput = z.infer<
  typeof activityMonitorLatestDayQuerySchema
>;

// Middleware functions
export const validateCreateActivityMonitor = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const formData = {
      ...req.body,
      captureImg: req.file, // Assuming file is uploaded via multer
    };
    const validatedData = createActivityMonitorSchema.parse(formData);

    (req as any).validatedData = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
      return;
    }
    next(error);
  }
};

// Middleware for validating update activity monitor requests
export const validateUpdateActivityMonitor = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const formData = {
      ...req.body,
      captureImg: req.file, // Multer puts the file in req.file
    };

    const validatedData = updateActivityMonitorSchema.parse(formData);
    (req as any).validatedData = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
      return;
    }
    next(error);
  }
};

// Validate Activity Monitor ID parameter
export const validateActivityMonitorParam = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validatedData = activityMonitorParamSchema.parse(req.params);
    req.params = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Invalid Activity Monitor ID',
        errors: error.errors,
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: 'Invalid Activity Monitor ID',
      errors: 'Invalid input parameter',
    });
  }
};

// Validate chart query parameters
export const validateActivityMonitorChartQuery = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validatedData = activityMonitorChartQuerySchema.parse(req.query);
    (req as any).validatedQuery = validatedData;
    next();
  } catch (error) {
    console.error('Error validating activity monitor chart query:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      errors: 'Invalid input parameters',
    });
  }
};

// Middleware to check if activity monitor exists
export const validateActivityMonitorExists = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const { id } = req.params;
    const activityMonitor = await prisma.activity_monitoring.findUnique({
      where: { id: parseInt(id) },
      include: {
        primary_analytics: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        cctv: {
          select: {
            id: true,
            cctv_name: true,
            is_active: true,
          },
        },
      },
    });

    if (!activityMonitor) {
      res.status(404).json({
        success: false,
        message: 'Activity monitor record not found',
      });
      return;
    }

    (req as any).existingRecord = activityMonitor;
    await prisma.$disconnect();
    next();
  } catch (error) {
    console.error('Error checking activity monitor existence:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Middleware to validate latest day query parameters
export const validateLatestDayQuery = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validatedData = activityMonitorLatestDayQuerySchema.parse(req.query);
    (req as any).validatedQuery = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      errors: 'Invalid input parameters',
    });
  }
};

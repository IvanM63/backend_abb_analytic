import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Create Weapon Detection Schema
export const createWeaponDetectionSchema = z.object({
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
  weaponType: z.string().min(1, 'Weapon type is required'),
  confidence: z
    .string()
    .regex(/^\d*\.?\d+$/, 'Confidence must be a valid number')
    .transform((val) => parseFloat(val))
    .refine(
      (val) => val >= 0 && val <= 1,
      'Confidence must be between 0 and 1'
    ),
  captureImg: z
    .any()
    .refine((file) => file?.mimetype?.startsWith('image/'), {
      message: 'File must be an image',
    })
    .optional(),
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

// Update Weapon Detection Schema (all fields optional)
export const updateWeaponDetectionSchema =
  createWeaponDetectionSchema.partial();

// Weapon Detection Param Schema
export const weaponDetectionParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number'),
});

// Chart query schema for weapon detection
export const weaponDetectionChartQuerySchema = z.object({
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

// Latest day query schema for weapon detection
export const weaponDetectionLatestDayQuerySchema = z.object({
  cctvId: z.string().regex(/^\d+$/, 'CCTV ID must be a number'),
  primaryAnalyticsId: z
    .string()
    .regex(/^\d+$/, 'Primary Analytics ID must be a number'),
});

// TypeScript types
export type CreateWeaponDetectionInput = z.infer<
  typeof createWeaponDetectionSchema
>;
export type UpdateWeaponDetectionInput = z.infer<
  typeof updateWeaponDetectionSchema
>;
export type WeaponDetectionParamInput = z.infer<
  typeof weaponDetectionParamSchema
>;
export type WeaponDetectionChartQueryInput = z.infer<
  typeof weaponDetectionChartQuerySchema
>;
export type WeaponDetectionLatestDayQueryInput = z.infer<
  typeof weaponDetectionLatestDayQuerySchema
>;

// Middleware functions
export const validateCreateWeaponDetection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const formData = {
      ...req.body,
      captureImg: req.file, // Assuming file is uploaded via multer
    };
    const validatedData = createWeaponDetectionSchema.parse(formData);

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

// Middleware for validating update weapon detection requests
export const validateUpdateWeaponDetection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const formData = {
      ...req.body,
      captureImg: req.file, // Multer puts the file in req.file
    };

    const validatedData = updateWeaponDetectionSchema.parse(formData);
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

// Validate Weapon Detection ID parameter
export const validateWeaponDetectionParam = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validatedData = weaponDetectionParamSchema.parse(req.params);
    req.params = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Invalid Weapon Detection ID',
        errors: error.errors,
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: 'Invalid Weapon Detection ID',
      errors: 'Invalid input parameter',
    });
  }
};

// Validate chart query parameters
export const validateWeaponDetectionChartQuery = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validatedData = weaponDetectionChartQuerySchema.parse(req.query);
    (req as any).validatedQuery = validatedData;
    next();
  } catch (error) {
    console.error('Error validating weapon detection chart query:', error);
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

// Middleware to check if weapon detection exists
export const validateWeaponDetectionExists = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const { id } = req.params;
    const weaponDetection = await prisma.weapon_detection.findUnique({
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

    if (!weaponDetection) {
      res.status(404).json({
        success: false,
        message: 'Weapon detection record not found',
      });
      return;
    }

    (req as any).existingRecord = weaponDetection;
    await prisma.$disconnect();
    next();
  } catch (error) {
    console.error('Error checking weapon detection existence:', error);
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
    const validatedData = weaponDetectionLatestDayQuerySchema.parse(req.query);
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

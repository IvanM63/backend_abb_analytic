import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Export query validation schema for activity monitor export
export const exportActivityMonitorSchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid start date format'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid end date format'),
  subTypeAnalytic: z
    .union([
      z.string().min(1, 'Sub type analytic filter must not be empty'),
      z.array(z.string().min(1, 'Sub type analytic filter must not be empty')),
    ])
    .transform((val) => {
      if (typeof val === 'string') {
        return [val];
      }
      return val;
    })
    .refine(
      (val) => val.every((item) => item.length <= 255),
      'Each sub type analytic filter must be less than 255 characters'
    )
    .optional(),
  cctvId: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine(
      (val) => val === undefined || val > 0,
      'CCTV ID must be a positive integer'
    ),
  primaryAnalyticsId: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine(
      (val) => val === undefined || val > 0,
      'Primary Analytics ID must be a positive integer'
    ),
});

// Type definitions for validated export data
export type ExportActivityMonitorInput = z.infer<
  typeof exportActivityMonitorSchema
>;

// Validation middleware for export activity monitor
export const validateExportActivityMonitor = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validatedData = exportActivityMonitorSchema.parse(req.query);

    // Validate date range
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    if (startDate > endDate) {
      res.status(400).json({
        success: false,
        message: 'Start date must be before or equal to end date',
      });
      return;
    }

    // Validate date range is not too large (maximum 1 year)
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    if (endDate.getTime() - startDate.getTime() > oneYearMs) {
      res.status(400).json({
        success: false,
        message: 'Date range cannot exceed 1 year',
      });
      return;
    }

    (req as any).validatedQuery = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error during validation',
      });
    }
  }
};

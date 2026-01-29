import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { commonSchemas } from './common-schemas';

// Zod schemas for validation
const modelHasValuesSchema = z.object({
  valueName: commonSchemas.requiredString('Value name', 1, 100),
  value: commonSchemas.requiredString('Value', 1, 255),
});

const polygonPointSchema = z.object({
  x: z.number().min(0).max(1, 'X coordinate must be between 0 and 1'),
  y: z.number().min(0).max(1, 'Y coordinate must be between 0 and 1'),
});

const modelHasPolygonsSchema = z.object({
  cctvId: z.number().int().positive('CCTV ID must be a positive integer'),
  name: commonSchemas.requiredString('Polygon name', 1, 100),
  polygon: z
    .array(polygonPointSchema)
    .min(2, 'Polygon must have at least 2 points'),
});

const subAnalyticsSchema = z.object({
  subTypeAnalyticId: z
    .number()
    .int()
    .positive('Sub type analytic ID must be a positive integer'),
});

const modelHasEmbedsSchema = z.object({
  cctvId: z.number().int().positive('CCTV ID must be a positive integer'),
  embed: commonSchemas.requiredString('Embed URL', 1, 500),
});

const primaryAnalyticsSchema = z.object({
  typeAnalyticId: z
    .number()
    .int()
    .positive('Type analytic ID must be a positive integer'),
  name: commonSchemas.requiredString('Name', 1, 255),
  description: z.string().optional(),
  modelHasValues: z.array(modelHasValuesSchema).optional(),
  modelHasPolygons: z.array(modelHasPolygonsSchema).optional(),
  modelHasEmbeds: z.array(modelHasEmbedsSchema).optional(),
  subAnalytics: z.array(subAnalyticsSchema).optional(),
});

export const createPrimaryAnalyticSchema = z.object({
  serverId: z
    .number()
    .int()
    .positive('Server ID must be a positive integer')
    .optional(),
  cctvId: z
    .array(z.number().int().positive('CCTV ID must be a positive integer'))
    .min(1, 'At least one CCTV ID is required'),
  primaryAnalytics: primaryAnalyticsSchema,
  isServer: z.boolean().default(true).optional(),
});

export const updatePrimaryAnalyticSchema = z.object({
  serverId: z
    .number()
    .int()
    .positive('Server ID must be a positive integer')
    .optional(),
  cctvId: z
    .array(z.number().int().positive('CCTV ID must be a positive integer'))
    .optional(),
  primaryAnalytics: primaryAnalyticsSchema.partial(),
});

export const getPrimaryAnalyticParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a valid number'),
});

export const getCctvParamsSchema = z.object({
  cctvId: z.string().regex(/^\d+$/, 'CCTV ID must be a valid number'),
});

// Type definitions
export type CreatePrimaryAnalyticInput = z.infer<
  typeof createPrimaryAnalyticSchema
>;
export type UpdatePrimaryAnalyticInput = z.infer<
  typeof updatePrimaryAnalyticSchema
>;
export type GetPrimaryAnalyticParams = z.infer<
  typeof getPrimaryAnalyticParamsSchema
>;
export type GetCctvParams = z.infer<typeof getCctvParamsSchema>;

// Generic validation middleware factory
const validateSchema = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
        return;
      }

      // Replace req.body with parsed data (this also handles transformations)
      req.body = result.data;
      next();
    } catch (error) {
      console.error('Validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during validation',
      });
    }
  };
};

// Params validation middleware
const validateParamsSchema = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.params);

      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          message: 'Parameter validation failed',
          errors,
        });
        return;
      }

      // Replace req.params with parsed data
      req.params = result.data;
      next();
    } catch (error) {
      console.error('Parameter validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during parameter validation',
      });
    }
  };
};

// Middleware functions
export const validateCreatePrimaryAnalytic = validateSchema(
  createPrimaryAnalyticSchema
);
export const validateUpdatePrimaryAnalytic = validateSchema(
  updatePrimaryAnalyticSchema
);
export const validatePrimaryAnalyticParams = validateParamsSchema(
  getPrimaryAnalyticParamsSchema
);
export const validateCctvParams = validateParamsSchema(getCctvParamsSchema);

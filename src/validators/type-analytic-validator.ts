import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { commonSchemas } from './common-schemas';

// Zod schemas for validation
export const createTypeAnalyticSchema = z.object({
  name: commonSchemas.requiredString('Name', 1, 100),
});

export const updateTypeAnalyticSchema = z.object({
  name: commonSchemas.requiredString('Name', 1, 100),
});

export const getTypeAnalyticParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a valid number'),
});

// Type definitions
export type CreateTypeAnalyticInput = z.infer<typeof createTypeAnalyticSchema>;
export type UpdateTypeAnalyticInput = z.infer<typeof updateTypeAnalyticSchema>;
export type GetTypeAnalyticParams = z.infer<typeof getTypeAnalyticParamsSchema>;

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
const validateParams = (schema: z.ZodSchema) => {
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
          message: 'Invalid parameters',
          errors,
        });
        return;
      }

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

// Validation middleware exports
export const validateCreateTypeAnalytic = validateSchema(
  createTypeAnalyticSchema
);
export const validateUpdateTypeAnalytic = validateSchema(
  updateTypeAnalyticSchema
);
export const validateTypeAnalyticParams = validateParams(
  getTypeAnalyticParamsSchema
);

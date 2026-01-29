import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

/**
 * Generic form-data validation middleware factory
 * @param schema - Zod schema to validate against
 * @param requireFile - Whether a file is required
 * @param fileFieldName - Name of the file field (default: 'file')
 * @returns Express middleware function
 */
export const createFormDataValidator = (
  schema: z.ZodSchema,
  requireFile: boolean = false,
  fileFieldName: string = 'file'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check file requirement
      if (requireFile && !(req as any).file) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: [
            {
              path: [fileFieldName],
              message: `${fileFieldName} is required`,
            },
          ],
        });
        return;
      }

      // Validate form data
      const validatedData = schema.parse(req.body);

      // Attach validated data to request for use in controller
      (req as any).validatedData = validatedData;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: 'Invalid input data',
        });
      }
    }
  };
};

/**
 * Transform form data strings to appropriate types
 */
export const formDataTransforms = {
  // Convert string to boolean
  stringToBoolean: (defaultValue: boolean = false) =>
    z
      .string()
      .optional()
      .transform((val) => {
        if (val === undefined) return defaultValue;
        return val === 'true';
      }),

  // Convert string to number
  stringToNumber: (defaultValue?: number) =>
    z
      .string()
      .optional()
      .transform((val) => {
        if (val === undefined) return defaultValue;
        const num = Number(val);
        return isNaN(num) ? defaultValue : num;
      }),

  // Convert empty string to null
  emptyStringToNull: () =>
    z
      .string()
      .optional()
      .transform((val) => val || null),

  // Convert string to date
  stringToDate: () =>
    z
      .string()
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        const date = new Date(val);
        return isNaN(date.getTime()) ? undefined : date;
      }),

  // Convert comma-separated string to array
  stringToArray: () =>
    z
      .string()
      .optional()
      .transform((val) => {
        if (!val) return [];
        return val
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
      }),
};

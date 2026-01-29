import { z } from 'zod';
import { commonSchemas } from '../../../validators/common-schemas';
import { Request, Response, NextFunction } from 'express';

// Create CCTV schema for form-data (field names match form field names)
export const createCctvFormSchema = z.object({
  cctvName: z.string().min(2, 'CCTV name must be at least 2 characters'),
  ipCctv: z
    .string()
    .optional()
    .transform((val) => val || null),
  ipServer: z
    .string()
    .optional()
    .transform((val) => val || null),
  rtsp: z.string().min(5, 'RTSP URL is required'),
  embed: z
    .string()
    .optional()
    .transform((val) => val || null),
  latitude: z
    .string()
    .optional()
    .transform((val) => val || null),
  longitude: z
    .string()
    .optional()
    .transform((val) => val || null),
  typeStreaming: z
    .enum(['embed', 'm3u8'])
    .optional()
    .transform((val) => val || null),
  isActive: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

// Original Create CCTV schema (for non-form-data)
export const createCctvSchema = z.object({
  cctv_name: z.string().min(2, 'CCTV name must be at least 2 characters'),
  ip_cctv: z.string().nullable().optional(),
  ip_server: z.string().nullable().optional(),
  rtsp: z.string().min(5, 'RTSP URL is required'),
  embed: z.string().nullable().optional(),
  latitude: z.string().nullable().optional(),
  longitude: z.string().nullable().optional(),
  type_streaming: z.enum(['embed', 'm3u8']).nullable().optional(),
  is_active: z.boolean().default(true),
  polygon_img: z.string(),
});

// Update CCTV schema - similar to create but all fields are optional
export const updateCctvSchema = createCctvSchema.partial();

// Update CCTV schema for form-data (all fields are optional)
export const updateCctvFormSchema = z.object({
  cctvName: z
    .string()
    .min(2, 'CCTV name must be at least 2 characters')
    .optional(),
  ipCctv: z
    .string()
    .optional()
    .transform((val) => val || null),
  ipServer: z
    .string()
    .optional()
    .transform((val) => val || null),
  rtsp: z.string().min(5, 'RTSP URL is required').optional(),
  embed: z
    .string()
    .optional()
    .transform((val) => val || null),
  latitude: z
    .string()
    .optional()
    .transform((val) => val || null),
  longitude: z
    .string()
    .optional()
    .transform((val) => val || null),
  typeStreaming: z
    .enum(['embed', 'm3u8'])
    .optional()
    .transform((val) => val || null),
  isActive: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

// CCTV param schema for ID validation
export const cctvParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a valid number'),
});

// Primary Analytics param schema for ID validation
export const primaryAnalyticParamSchema = z.object({
  primaryAnalyticId: z
    .string()
    .regex(/^\d+$/, 'Primary Analytics ID must be a valid number'),
});

// Type definitions for request validation
export type CreateCctvFormInput = z.infer<typeof createCctvFormSchema>;
export type UpdateCctvFormInput = z.infer<typeof updateCctvFormSchema>;
export type CreateCctvInput = z.infer<typeof createCctvSchema>;
export type UpdateCctvInput = z.infer<typeof updateCctvSchema>;
export type CctvParam = z.infer<typeof cctvParamSchema>;
export type PrimaryAnalyticParam = z.infer<typeof primaryAnalyticParamSchema>;

// Middleware for validating CCTV requests
export const validateCreateCctv = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    createCctvSchema.parse(req.body);
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

export const validateUpdateCctv = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Ensure req.body is an object (default to empty object if undefined)
    const bodyData = req.body || {};
    updateCctvSchema.parse(bodyData);
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

export const validateCctvParam = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    cctvParamSchema.parse(req.params);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Invalid CCTV ID',
        errors: error.errors,
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid CCTV ID',
        errors: 'Invalid input parameter',
      });
    }
  }
};

export const validatePrimaryAnalyticParam = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    primaryAnalyticParamSchema.parse(req.params);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Invalid Primary Analytics ID',
        errors: error.errors,
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid Primary Analytics ID',
        errors: 'Invalid input parameter',
      });
    }
  }
};

// Middleware for validating form-data CCTV creation
export const validateCreateCctvForm = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Validate file first
    if (!(req as any).file) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: [
          { path: ['polygonImg'], message: 'Polygon image file is required' },
        ],
      });
      return;
    }

    // Validate form data
    const validatedData = createCctvFormSchema.parse(req.body);

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

// Middleware for validating form-data CCTV update
export const validateUpdateCctvForm = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Image file is optional for update
    // Validate form data
    const validatedData = updateCctvFormSchema.parse(req.body);

    // Check if there's any data to update (either form fields or file)
    if (Object.keys(validatedData).length === 0 && !(req as any).file) {
      res.status(400).json({
        success: false,
        message: 'No data provided for update',
      });
      return;
    }

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

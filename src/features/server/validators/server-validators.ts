import { z } from 'zod';
import { commonSchemas } from '../../../validators/common-schemas';
import { Request, Response, NextFunction } from 'express';

// Create Server schema
export const createServerSchema = z.object({
  ip: z.string().ip('Invalid IP address format'),
  description: z.string().nullable().optional(),
  max_activity_monitoring: z
    .number()
    .int()
    .min(0, 'Max activity monitoring must be a non-negative integer')
    .default(0),
  cur_activity_monitoring: z
    .number()
    .int()
    .min(0, 'Current activity monitoring must be a non-negative integer')
    .default(0),
});

// Update Server schema (all fields optional)
export const updateServerSchema = z.object({
  ip: z.string().ip('Invalid IP address format').optional(),
  description: z.string().nullable().optional(),
  max_activity_monitoring: z
    .number()
    .int()
    .min(0, 'Max activity monitoring must be a non-negative integer')
    .optional(),
  cur_activity_monitoring: z
    .number()
    .int()
    .min(0, 'Current activity monitoring must be a non-negative integer')
    .optional(),
});

// Server param validation
export const serverParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number'),
});

// Server query validation (for search and pagination)
export const serverQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, 'Page must be greater than 0'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  search: z.string().optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

// TypeScript types
export type CreateServerInput = z.infer<typeof createServerSchema>;
export type UpdateServerInput = z.infer<typeof updateServerSchema>;
export type ServerParamInput = z.infer<typeof serverParamSchema>;
export type ServerQueryInput = z.infer<typeof serverQuerySchema>;

// Middleware functions
export const validateCreateServer = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validatedData = createServerSchema.parse(req.body);
    req.body = validatedData;
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

export const validateUpdateServer = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validatedData = updateServerSchema.parse(req.body);
    req.body = validatedData;
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

export const validateServerParam = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validatedParams = serverParamSchema.parse(req.params);
    req.params = validatedParams;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Invalid server ID',
        errors: error.errors,
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: 'Invalid server ID',
      errors: 'Invalid input parameter',
    });
  }
};

export const validateServerQuery = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validatedData = serverQuerySchema.parse(req.query);
    (req as any).validatedQuery = validatedData;
    next();
  } catch (error) {
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

// Type Analytic param validation
export const typeAnalyticParamSchema = z.object({
  typeAnalyticId: z
    .string()
    .regex(/^\d+$/, 'Type Analytic ID must be a number'),
});

export type TypeAnalyticParamInput = z.infer<typeof typeAnalyticParamSchema>;

// Server IP param validation
export const serverIpParamSchema = z.object({
  ip: z.string().ip('IP must be a valid IP address format'),
});

export type ServerIpParamInput = z.infer<typeof serverIpParamSchema>;

export const validateServerIpParam = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validatedParams = serverIpParamSchema.parse(req.params);
    req.params = validatedParams;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Invalid IP address format',
        errors: error.errors,
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: 'Invalid IP address format',
      errors: 'Invalid input parameter',
    });
  }
};

export const validateTypeAnalyticParam = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validatedParams = typeAnalyticParamSchema.parse(req.params);
    req.params = validatedParams;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Invalid type analytic ID',
        errors: error.errors,
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: 'Invalid type analytic ID',
      errors: 'Invalid input parameter',
    });
  }
};
export const validateServerExists = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const { id } = req.params;
    const server = await prisma.servers.findUnique({
      where: { id: parseInt(id) },
    });

    if (!server) {
      res.status(404).json({
        success: false,
        message: 'Server not found',
      });
      return;
    }

    (req as any).existingServer = server;
    await prisma.$disconnect();
    next();
  } catch (error) {
    console.error('Error checking server existence:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Create Roles Schema
export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
});

// Update Roles Schema (all fields optional)
export const updateRoleSchema = createRoleSchema.partial();

// Roles Param Schema
export const roleParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number'),
});

// TypeScript types
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type RoleParamInput = z.infer<typeof roleParamSchema>;

// Middleware functions
export const validateCreateRole = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validatedData = createRoleSchema.parse(req.body);
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

// Middleware for validating update role requests
export const validateUpdateRole = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validatedData = updateRoleSchema.parse(req.body);
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

// Validate Role ID parameter
export const validateRoleParam = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validatedData = roleParamSchema.parse(req.params);
    req.params = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Invalid Role ID',
        errors: error.errors,
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: 'Invalid Role ID',
      errors: 'Invalid input parameter',
    });
  }
};

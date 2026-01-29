import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { commonSchemas } from '../../../validators/common-schemas';

// Attach role to user schema
export const attachRoleToUserSchema = z.object({
  userId: commonSchemas.id,
  roleId: commonSchemas.id,
});

// Detach role from user schema
export const detachRoleFromUserSchema = z.object({
  userId: commonSchemas.id,
  roleId: commonSchemas.id,
});

// Bulk attach roles to user schema
export const bulkAttachRolesToUserSchema = z.object({
  userId: commonSchemas.id,
  roleIds: z.array(commonSchemas.id).min(1, 'At least one role ID is required'),
});

// Replace user roles schema
export const replaceUserRolesSchema = z.object({
  userId: commonSchemas.id,
  roleIds: z.array(commonSchemas.id),
});

// User param schema
export const userParamSchema = z.object({
  userId: z.string().regex(/^\d+$/, 'User ID must be a number'),
  roleId: z.string().regex(/^\d+$/, 'Role ID must be a number').optional(),
});

// TypeScript types
export type AttachRoleToUserInput = z.infer<typeof attachRoleToUserSchema>;
export type DetachRoleFromUserInput = z.infer<typeof detachRoleFromUserSchema>;
export type BulkAttachRolesToUserInput = z.infer<
  typeof bulkAttachRolesToUserSchema
>;
export type ReplaceUserRolesInput = z.infer<typeof replaceUserRolesSchema>;
export type UserRoleParamInput = z.infer<typeof userParamSchema>;

// Middleware functions
export const validateAttachRoleToUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validatedData = attachRoleToUserSchema.parse(req.body);
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

export const validateDetachRoleFromUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validatedData = detachRoleFromUserSchema.parse(req.body);
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

export const validateBulkAttachRolesToUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validatedData = bulkAttachRolesToUserSchema.parse(req.body);
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

export const validateReplaceUserRoles = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validatedData = replaceUserRolesSchema.parse(req.body);
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

// Validate User-Role parameters
export const validateUserRoleParams = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validatedData = userParamSchema.parse(req.params);
    req.params = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        errors: error.errors,
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: 'Invalid parameters',
      errors: 'Invalid input parameters',
    });
  }
};

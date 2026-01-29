import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { commonSchemas } from './common-schemas';

// Zod schemas for validation
export const registerSchema = z.object({
  email: commonSchemas.email,
  password: commonSchemas.simplePassword, // Use simple password for registration
  roleId: commonSchemas.optionalId,
});

export const loginSchema = z.object({
  email: commonSchemas.email,
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: commonSchemas.simplePassword,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

// Additional schemas for user management
export const forgotPasswordSchema = z.object({
  email: commonSchemas.email,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: commonSchemas.simplePassword,
});

export const updateProfileSchema = z.object({
  email: commonSchemas.email.optional(),
  firstName: commonSchemas.optionalString('First name', 50),
  lastName: commonSchemas.optionalString('Last name', 50),
});

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

      // Replace req.body with validated data
      req.body = result.data;
      next();
    } catch (error) {
      console.error('Validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal validation error',
      });
    }
  };
};

// Query parameter validation middleware
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.query);

      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          message: 'Query validation failed',
          errors,
        });
        return;
      }

      // Replace req.query with validated data
      req.query = result.data;
      next();
    } catch (error) {
      console.error('Query validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal validation error',
      });
    }
  };
};

// Export validation middlewares
export const validateRegister = validateSchema(registerSchema);
export const validateLogin = validateSchema(loginSchema);
export const validateChangePassword = validateSchema(changePasswordSchema);
export const validateForgotPassword = validateSchema(forgotPasswordSchema);
export const validateResetPassword = validateSchema(resetPasswordSchema);
export const validateUpdateProfile = validateSchema(updateProfileSchema);

// Export types for TypeScript
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

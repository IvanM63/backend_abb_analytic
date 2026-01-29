import { z } from 'zod';

// Common validation patterns
export const commonSchemas = {
  // Email validation with custom error messages
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please provide a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .transform((email) => email.trim()),

  // Password validation with strength requirements
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .max(100, 'Password must be less than 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),

  // Simple password (for login or when strength is not required)
  simplePassword: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .max(100, 'Password must be less than 100 characters'),

  // ID validation
  id: z.number().int().positive('ID must be a positive integer'),

  // Optional ID
  optionalId: z
    .number()
    .int()
    .positive('ID must be a positive integer')
    .optional(),

  // String with length validation
  requiredString: (fieldName: string, minLength = 1, maxLength = 255) =>
    z
      .string()
      .min(minLength, `${fieldName} is required`)
      .max(maxLength, `${fieldName} must be less than ${maxLength} characters`)
      .transform((str) => str.trim()),

  // Optional string with length validation
  optionalString: (fieldName: string, maxLength = 255) =>
    z
      .string()
      .max(maxLength, `${fieldName} must be less than ${maxLength} characters`)
      .transform((str) => str.trim())
      .optional(),

  // Pagination parameters
  pagination: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => val > 0, 'Page must be greater than 0'),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .refine(
        (val) => val > 0 && val <= 100,
        'Limit must be between 1 and 100'
      ),
  }),

  // Date validation
  dateString: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),

  // URL validation
  url: z.string().url('Please provide a valid URL'),

  // Phone number validation (basic)
  phoneNumber: z
    .string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Please provide a valid phone number'),
};

// Common response schemas
export const responseSchemas = {
  success: z.object({
    success: z.literal(true),
    message: z.string(),
    data: z.any().optional(),
  }),

  error: z.object({
    success: z.literal(false),
    message: z.string(),
    errors: z
      .array(
        z.object({
          field: z.string(),
          message: z.string(),
        })
      )
      .optional(),
  }),

  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
};

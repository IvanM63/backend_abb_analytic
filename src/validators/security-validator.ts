import { z } from 'zod';
import { commonSchemas } from './common-schemas';

// Registration security schemas
export const registrationTokenSchema = z.object({
  token: z.string().min(1, 'Registration token is required'),
});

export const secureRegisterSchema = z.object({
  email: commonSchemas.email,
  password: commonSchemas.simplePassword,
  roleId: commonSchemas.optionalId,
  // Optional fields for enhanced registration
  firstName: commonSchemas.optionalString('First name', 50),
  lastName: commonSchemas.optionalString('Last name', 50),
  inviteCode: z.string().optional(), // For invite-based registration
});

// Header validation schema
export const registrationHeaderSchema = z.object({
  'x-registration-token': z.string().min(1, 'Registration token is required'),
  'x-csrf-token': z.string().optional(),
  'x-api-key': z.string().optional(),
});

// CSRF token schema
export const csrfTokenSchema = z.object({
  token: z.string().min(32, 'CSRF token must be at least 32 characters'),
  timestamp: z.number().positive('Invalid timestamp'),
  signature: z.string().min(1, 'Token signature is required'),
});

// Export types
export type SecureRegisterInput = z.infer<typeof secureRegisterSchema>;
export type RegistrationHeaderInput = z.infer<typeof registrationHeaderSchema>;
export type CSRFTokenInput = z.infer<typeof csrfTokenSchema>;

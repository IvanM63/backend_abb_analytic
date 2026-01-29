import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const exampleSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters long'),
  email: z.string().email(),
  captureImg: z
    .any()
    .refine((file) => file?.mimetype?.startsWith('image/'), {
      message: 'File must be an image',
    })
    .refine((file) => file !== undefined && file !== null, {
      message: 'Image is required',
    }),
});

export const examplePramsSchem = z.object({
  id: z.string().min(1, 'ID is required'),
});

// Type Exports
export type ExampleParams = z.infer<typeof examplePramsSchem>;

export type exampleSchemaInput = z.infer<typeof exampleSchema>;

// Generic validation middleware factory for form data
export const validateExampleFormData = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Parse form data body
    const formData = { ...req.body, captureImg: req.file };

    const validatedData = exampleSchema.parse(formData);

    // Store validated data in request object
    (req as any).validatedData = validatedData;

    next();
  } catch (error) {
    console.error('Validation error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
      return;
    }
    next(error);
  }
};

import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

const memoryStorage = multer.memoryStorage();

const fileFilter = (req: any, file: any, cb: any) => {
  // Allow only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: memoryStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

/**
 * Flexible upload middleware that can handle various field names for image uploads
 * This allows clients to use different field names while maintaining compatibility
 */
export const flexibleImageUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Define all acceptable field names
  const acceptableFields = [
    'img_vehicle',
    'image',
    'file',
    'photo',
    'vehicle_image',
  ];

  // Check which fields exist in the request
  const fieldName =
    acceptableFields.find(
      (field) =>
        req.is('multipart/form-data') &&
        req.headers['content-type']?.includes('boundary') &&
        req.body &&
        (field in req.body || (req as any).body?.fieldname === field)
    ) || 'img_vehicle'; // Default to img_vehicle if no match

  // Use Multer with the detected field name
  const singleUpload = multer({ storage: memoryStorage }).single(fieldName);

  singleUpload(req, res, (err) => {
    if (err) {
      // If it's a Multer error about unexpected field, provide a helpful message
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          message: `File upload error: Please use one of these field names: ${acceptableFields.join(', ')}`,
          acceptable_fields: acceptableFields,
        });
      }
      // Handle other Multer errors
      return res
        .status(400)
        .json({ message: `File upload error: ${err.message}` });
    }

    // If file was uploaded with a different field name, ensure it's also available as img_vehicle
    // This maintains compatibility with existing controller code
    if ((req as any).file && fieldName !== 'img_vehicle') {
      (req as any).file.fieldname = 'img_vehicle';
    }

    next();
  });
};

/**
 * Flexible upload middleware for multiple files - suitable for face images
 * Handles multiple file uploads with flexible field names
 */
export const flexibleUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Define all acceptable field names for multiple files
  const acceptableFields = [
    'faces',
    'face_images',
    'images',
    'files',
    'photos',
    'face_photos',
  ];

  // Use a flexible approach that can handle any of these field names
  const multipleUpload = multer({
    storage: memoryStorage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max file size per file
      files: 10, // Maximum 10 files
    },
  }).any();

  multipleUpload(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        message: `File upload error: ${err.message}`,
        acceptable_fields: acceptableFields,
      });
    }

    // Filter files to ensure they match acceptable field names
    if ((req as any).files && (req as any).files.length > 0) {
      const validFiles = (req as any).files.filter((file: any) =>
        acceptableFields.includes(file.fieldname)
      );

      // If no valid files found, check if files use any field name and allow them
      if (validFiles.length === 0 && (req as any).files.length > 0) {
        // Allow files regardless of fieldname for flexibility
        (req as any).files = (req as any).files;
      } else {
        (req as any).files = validFiles;
      }
    }

    next();
  });
};

export default upload;

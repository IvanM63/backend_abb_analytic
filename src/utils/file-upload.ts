import fs from 'fs';
import path from 'path';

/**
 * Upload file to local storage
 * @param file - The file object from multer
 * @param dirPath - Directory path relative to uploads folder
 * @param customFilename - Custom filename (optional)
 * @returns Promise<string> - Returns the relative path for database storage
 */
export const uploadFileToLocal = async (
  file: any,
  dirPath: string,
  customFilename?: string
): Promise<string> => {
  try {
    // Get project root directory
    const rootDir = process.cwd();

    // Create full directory path
    const fullDirPath = path.join(rootDir, 'files', 'uploads', dirPath);

    // Ensure directory exists
    if (!fs.existsSync(fullDirPath)) {
      fs.mkdirSync(fullDirPath, { recursive: true });
    }

    // Set filename - either custom or generate one
    const filename = customFilename || `${Date.now()}-${file.originalname}`;

    // Full path for the file
    const fullFilePath = path.join(fullDirPath, filename);

    // Write file
    fs.writeFileSync(fullFilePath, file.buffer);

    // Return relative path for database storage
    return path.join(dirPath, filename).replace(/\\/g, '/'); // Normalize path separators
  } catch (error) {
    console.error('Error uploading file to local storage:', error);
    throw new Error('Failed to upload file');
  }
};

/**
 * Formats an image URL for API responses
 * @param imagePath - The relative path to the image
 * @returns string|null - Formatted URL or null if no image
 */
export const formatImageUrl = (imagePath: string | null): string | null => {
  if (!imagePath) return null;

  // Format the base URL for consistency
  const baseUrl =
    process.env.NODE_ENV !== 'production'
      ? process.env.SERVER_URL || 'http://localhost:5000'
      : 'https://weapon.sandboxxplore.com/api';

  // Default format
  return `${baseUrl}/static/${imagePath}`;
};

/**
 * Validate required fields for CCTV creation
 * @param body - Request body
 * @param file - Uploaded file
 * @returns string|null - Error message or null if valid
 */
export const validateRequiredFields = (body: any, file: any): string | null => {
  const requiredFields = ['cctvName', 'rtsp'];

  for (const field of requiredFields) {
    if (!body[field]) {
      return `${field} is required`;
    }
  }

  if (!file) {
    return 'Polygon image is required';
  }

  return null;
};

/**
 * Delete file from local storage
 * @param filePath - The relative path to the file (as stored in database)
 * @returns Promise<boolean> - Returns true if file was deleted successfully
 */
export const deleteFileFromLocal = async (
  filePath: string
): Promise<boolean> => {
  try {
    if (!filePath) return false;

    // Get project root directory
    const rootDir = process.cwd();

    // Create full file path
    const fullFilePath = path.join(rootDir, 'files', 'uploads', filePath);

    // Check if file exists
    if (fs.existsSync(fullFilePath)) {
      // Delete the file
      fs.unlinkSync(fullFilePath);
      console.log(`File deleted successfully: ${fullFilePath}`);
      return true;
    } else {
      console.log(`File not found: ${fullFilePath}`);
      return false;
    }
  } catch (error) {
    console.error('Error deleting file from local storage:', error);
    return false;
  }
};

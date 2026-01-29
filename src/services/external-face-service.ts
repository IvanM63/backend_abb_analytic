/**
 * External Face API Service
 * Handles communication with external face recognition API
 */

import FormData from 'form-data';
import { externalApiConfig } from '../config/external-api-config';

export interface FaceApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export interface FaceProcessingResult {
  success: boolean;
  response?: FaceApiResponse;
  error?: string;
}

/**
 * Sends face data to external API with multiple images
 * @param images - Array of image files from multer
 * @param additionalData - Additional data to send with the request
 * @returns Promise<FaceProcessingResult>
 */
export const sendFaceDataToExternalAPI = async (
  images: Express.Multer.File[],
  additionalData: Record<string, any> = {}
): Promise<FaceProcessingResult> => {
  try {
    const formData = new FormData();

    // Add each image as separate 'images' field (not as array)
    images.forEach((image) => {
      formData.append('images', image.buffer, {
        filename: image.originalname,
        contentType: image.mimetype,
      });
    });

    // Add additional data fields
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(
        key,
        typeof value === 'object' ? JSON.stringify(value) : String(value)
      );
    });

    const response = await fetch(externalApiConfig.faceApiEndpoint, {
      method: 'POST',
      body: formData as any,
      headers: {
        ...formData.getHeaders(),
        ...externalApiConfig.defaultHeaders,
      },
    });

    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status} - ${response.statusText}`
      );
    }

    const responseData = (await response.json()) as FaceApiResponse;

    return {
      success: true,
      response: responseData,
    };
  } catch (error) {
    console.error('Error sending face data to external API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Sends face data to external API directly from multer file objects
 * More efficient as it doesn't require saving files to disk first
 * @param files - Files from req.files (multer)
 * @param registeredFaceId - ID of the registered face
 * @param userId - User ID (default: 1)
 * @param projectId - Project ID (default: 2)
 * @param additionalData - Additional data to send
 * @returns Promise<FaceProcessingResult>
 */
export const sendFaceDataToExternalAPIFromFiles = async (
  files: Express.Multer.File[],
  registeredFaceId: string,
  userId: number = 1,
  projectId: number = 2,
  additionalData: Record<string, any> = {}
): Promise<FaceProcessingResult> => {
  try {
    const formData = new FormData();

    // Add required fields as specified in task requirements
    formData.append('user_id', userId.toString());
    formData.append('registered_face_id', registeredFaceId);
    formData.append('project_id', projectId.toString());

    // Add each image file as separate 'images' field (multiple images as separate fields)
    files.forEach((file, index) => {
      formData.append('images', file.buffer, {
        filename: file.originalname || `image_${index}.jpg`,
        contentType: file.mimetype || 'image/jpeg',
      });
    });

    // Add additional data if needed
    Object.entries(additionalData).forEach(([key, value]) => {
      // Skip the main required fields to avoid duplication
      if (
        !['user_id', 'registered_face_id', 'project_id', 'images'].includes(key)
      ) {
        formData.append(
          key,
          typeof value === 'object' ? JSON.stringify(value) : String(value)
        );
      }
    });

    const response = await fetch(externalApiConfig.faceApiEndpoint, {
      method: 'POST',
      body: formData as any,
      headers: {
        ...formData.getHeaders(),
        ...externalApiConfig.defaultHeaders,
      },
    });

    const responseData = (await response.json()) as FaceApiResponse;

    if (!response.ok) {
      throw new Error(
        `External API error: ${response.status} - ${responseData.message || response.statusText}`
      );
    }

    return {
      success: true,
      response: responseData,
    };
  } catch (error) {
    console.error('Error processing face data with external API:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'External API processing failed',
    };
  }
};

/**
 * Wrapper function for complete face processing workflow
 * @param files - Image files from request
 * @param registeredFaceId - Generated registered face ID
 * @param metadata - Additional metadata
 * @returns Promise<FaceProcessingResult>
 */
export const processFaceWithExternalAPI = async (
  files: Express.Multer.File[],
  registeredFaceId: string,
  metadata: Record<string, any> = {}
): Promise<FaceProcessingResult> => {
  if (!files || files.length === 0) {
    return {
      success: false,
      error: 'No image files provided for processing',
    };
  }

  if (!registeredFaceId) {
    return {
      success: false,
      error: 'Registered face ID is required for external processing',
    };
  }

  try {
    const processingMetadata = {
      timestamp: new Date().toISOString(),
      totalImages: files.length,
      ...metadata,
    };

    const result = await sendFaceDataToExternalAPIFromFiles(
      files,
      registeredFaceId,
      1, // default userId
      2, // default projectId
      processingMetadata
    );

    if (!result.success) {
      console.error('External API processing failed:', result.error);
    } else {
      console.log('External API processing completed successfully');
    }

    return result;
  } catch (error) {
    console.error('Error in face processing workflow:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Face processing workflow failed',
    };
  }
};

/**
 * Validates external API response format
 * @param response - Response from external API
 * @returns boolean - True if response is valid
 */
export const validateExternalApiResponse = (
  response: any
): response is FaceApiResponse => {
  return (
    typeof response === 'object' &&
    response !== null &&
    typeof response.success === 'boolean'
  );
};

/**
 * Health check for external API
 * @returns Promise<boolean> - True if API is healthy
 */
export const checkExternalApiHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${externalApiConfig.baseUrl}/health`, {
      method: 'GET',
    });

    return response.ok;
  } catch (error) {
    console.error('External API health check failed:', error);
    return false;
  }
};

/**
 * External Face Recognition API Service
 * Handles communication with external face processing services
 */

import FormData from 'form-data';
import axios from 'axios';
import {
  getFaceApiUrl,
  getExternalApiConfig,
} from '../config/externalApiConfig';

/**
 * Interface for external API request data
 */
export interface ExternalFaceApiRequest {
  user_id: number;
  registered_face_id: string;
  project_id: number;
  images: Express.Multer.File[];
}

/**
 * Interface for external API response
 */
export interface ExternalFaceApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

/**
 * Send face data to external API with multiple images
 * Each image is sent as a separate form-data field named "images"
 * @param {ExternalFaceApiRequest} requestData - Data to send to external API
 * @returns {Promise<ExternalFaceApiResponse>} API response
 */
export const sendFaceDataToExternalAPI = async (
  requestData: ExternalFaceApiRequest
): Promise<ExternalFaceApiResponse> => {
  const config = getExternalApiConfig();
  const apiUrl = getFaceApiUrl();

  try {
    // Create form data
    const formData = new FormData();

    // Add required fields
    formData.append('user_id', requestData.user_id.toString());
    formData.append('registered_face_id', requestData.registered_face_id);
    formData.append('project_id', requestData.project_id.toString());

    // Add each image as separate "images" field
    requestData.images.forEach((image) => {
      formData.append('images', image.buffer, {
        filename: image.originalname,
        contentType: image.mimetype,
      });
    });

    // Make HTTP request with retry logic
    const response = await makeRequestWithRetry(
      apiUrl,
      formData,
      config.retryAttempts,
      config.retryDelay
    );

    return {
      success: true,
      message: 'Face data sent successfully',
      data: response.data,
    };
  } catch (error: any) {
    console.error('Error sending face data to external API:', error);

    return {
      success: false,
      error: error.message || 'Failed to send face data to external API',
    };
  }
};

/**
 * Interface for Update external API request data
 */
export interface UpdateExternalFaceApiRequest {
  user_id: number;
  registered_face_id: string;
  project_id: number;
  images: Express.Multer.File[];
  is_embed?: boolean;
  is_repredict?: boolean;
}

/**
 * Interface for Update external API response
 */
export interface UpdateExternalFaceApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

/**
 * Send face data to external API with multiple images
 * Each image is sent as a separate form-data field named "images"
 * @param {UpdateExternalFaceApiRequest} requestData - Data to send to external API
 * @returns {Promise<UpdateExternalFaceApiResponse>} API response
 */
export const sendUpdateRegisteredFaceToExternalAPI = async (
  requestData: UpdateExternalFaceApiRequest
): Promise<UpdateExternalFaceApiResponse> => {
  const config = getExternalApiConfig();

  // TODO : Change to update endpoint if different
  const apiUrl = getFaceApiUrl() + '/update';
  try {
    // Create form data
    const formData = new FormData();

    // Add required fields
    formData.append('user_id', requestData.user_id.toString());
    formData.append('registered_face_id', requestData.registered_face_id);
    formData.append('project_id', requestData.project_id.toString());
    // Optional fields
    if (requestData.is_embed !== undefined) {
      formData.append('is_embed', requestData.is_embed);
    }

    if (requestData.is_repredict !== undefined) {
      formData.append('is_repredict', requestData.is_repredict);
    }

    // Add each image as separate "images" field
    requestData.images.forEach((image) => {
      formData.append('images', image.buffer, {
        filename: image.originalname,
        contentType: image.mimetype,
      });
    });

    // Make HTTP request with retry logic
    const response = await makeRequestWithRetry(
      apiUrl,
      formData,
      config.retryAttempts,
      config.retryDelay
    );

    return {
      success: true,
      message: 'Face data sent successfully',
      data: response.data,
    };
  } catch (error: any) {
    console.error('Error sending face data to external API:', error);

    return {
      success: false,
      error: error.message || 'Failed to send face data to external API',
    };
  }
};

/**
 * Send face data using files from req.files directly (memory efficient)
 * @param {Express.Multer.File[]} files - Array of uploaded files
 * @param {string} registeredFaceId - Registered face ID
 * @param {number} userId - User ID (optional, defaults to config value)
 * @param {number} projectId - Project ID (optional, defaults to config value)
 * @returns {Promise<ExternalFaceApiResponse>} API response
 */
export const sendFaceDataToExternalAPIFromFiles = async (
  files: Express.Multer.File[],
  registeredFaceId: string,
  userId?: number,
  projectId?: number
): Promise<ExternalFaceApiResponse> => {
  const config = getExternalApiConfig();

  const requestData: ExternalFaceApiRequest = {
    user_id: userId || config.defaultValues.userId,
    registered_face_id: registeredFaceId,
    project_id: projectId || config.defaultValues.projectId,
    images: files,
  };

  return sendFaceDataToExternalAPI(requestData);
};

/**
 * Process face with external API - wrapper function with comprehensive error handling
 * @param {Express.Multer.File[]} images - Array of image files
 * @param {string} registeredFaceId - Registered face ID
 * @param {number} userId - User ID
 * @param {number} projectId - Project ID
 * @returns {Promise<{success: boolean, data?: any, error?: string}>} Processing result
 */
export const processFaceWithExternalAPI = async (
  images: Express.Multer.File[],
  registeredFaceId: string,
  userId: number = 1,
  projectId: number = 2
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    // Validate inputs
    if (!images || images.length === 0) {
      return {
        success: false,
        error: 'No images provided for external API processing',
      };
    }

    if (!registeredFaceId) {
      return {
        success: false,
        error: 'Registered face ID is required for external API processing',
      };
    }

    // Send data to external API
    const result = await sendFaceDataToExternalAPIFromFiles(
      images,
      registeredFaceId,
      userId,
      projectId
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'External API processing failed',
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error: any) {
    console.error('Error in processFaceWithExternalAPI:', error);
    return {
      success: false,
      error: error.message || 'Unexpected error during external API processing',
    };
  }
};

/**
 * Make HTTP request with retry logic
 * @param {string} url - API URL
 * @param {FormData} formData - Form data to send
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} retryDelay - Delay between retries in milliseconds
 * @returns {Promise<any>} Axios response
 */
const makeRequestWithRetry = async (
  url: string,
  formData: FormData,
  maxRetries: number,
  retryDelay: number
): Promise<any> => {
  const config = getExternalApiConfig();

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      // Log payload and url
      console.log(`Sending request to ${url}`);
      console.log('Payload fields:', formData);
      const response = await axios.post(url, formData, {
        headers: {
          ...formData.getHeaders(),
          'Content-Type': 'multipart/form-data',
        },
        timeout: config.timeout,
      });
      console.log('Response:', response.data);

      return response;
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries + 1;

      if (isLastAttempt) {
        throw error;
      }

      console.warn(
        `External API request attempt ${attempt} failed, retrying in ${retryDelay}ms...`,
        error.message
      );
      console.error(
        'Error details:',
        error.response ? error.response.data : error
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  throw new Error('Unexpected error in retry logic');
};

/**
 * Test external API connectivity
 * @returns {Promise<boolean>} True if API is accessible
 */
export const testExternalApiConnectivity = async (): Promise<boolean> => {
  try {
    const apiUrl = getFaceApiUrl();
    const config = getExternalApiConfig();

    // Make a simple HEAD request to test connectivity
    await axios.head(apiUrl, {
      timeout: config.timeout,
    });

    return true;
  } catch (error) {
    console.error('External API connectivity test failed:', error);
    return false;
  }
};

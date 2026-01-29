/**
 * External API Configuration Module
 * Centralized configuration for external face recognition API integration
 */

/**
 * External API Configuration Interface
 */
export interface ExternalApiConfig {
  baseUrl: string;
  endpoints: {
    face: string;
  };
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  defaultValues: {
    userId: number;
    projectId: number;
  };
}

/**
 * Default External API Configuration
 * Uses environment variables with fallback defaults
 */
export const externalApiConfig: ExternalApiConfig = {
  // Base URL for external face recognition service
  baseUrl: process.env.EXTERNAL_FACE_API_BASE_URL || 'http://172.30.5.103:8001',

  // API Endpoints
  endpoints: {
    face: '/face',
  },

  // Request timeout in milliseconds (30 seconds)
  timeout: parseInt(process.env.EXTERNAL_FACE_API_TIMEOUT || '30000', 10),

  // Number of retry attempts for failed requests
  retryAttempts: parseInt(
    process.env.EXTERNAL_FACE_API_RETRY_ATTEMPTS || '3',
    10
  ),

  // Delay between retry attempts in milliseconds (2 seconds)
  retryDelay: parseInt(process.env.EXTERNAL_FACE_API_RETRY_DELAY || '2000', 10),

  // Default values for API requests
  defaultValues: {
    userId: parseInt(process.env.DEFAULT_USER_ID || '1', 10),
    projectId: parseInt(process.env.DEFAULT_PROJECT_ID || '2', 10),
  },
};

/**
 * Get complete face API endpoint URL
 * @returns {string} Complete URL for face API endpoint
 */
export const getFaceApiUrl = (): string => {
  return `${externalApiConfig.baseUrl}${externalApiConfig.endpoints.face}`;
};

/**
 * Get external API configuration for specific environment
 * @param {string} environment - Environment name (development, staging, production)
 * @returns {ExternalApiConfig} Environment-specific configuration
 */
export const getExternalApiConfig = (
  environment?: string
): ExternalApiConfig => {
  const env = environment || process.env.NODE_ENV || 'development';

  switch (env) {
    case 'production':
      return {
        ...externalApiConfig,
        baseUrl:
          process.env.EXTERNAL_FACE_API_BASE_URL_PROD ||
          externalApiConfig.baseUrl,
        timeout: 45000, // Longer timeout for production
        retryAttempts: 5, // More retries for production
      };

    case 'staging':
      return {
        ...externalApiConfig,
        baseUrl:
          process.env.EXTERNAL_FACE_API_BASE_URL_STAGING ||
          externalApiConfig.baseUrl,
        timeout: 35000,
        retryAttempts: 4,
      };

    case 'development':
    default:
      return externalApiConfig;
  }
};

/**
 * Validate external API configuration
 * @param {ExternalApiConfig} config - Configuration to validate
 * @throws {Error} If configuration is invalid
 */
export const validateExternalApiConfig = (config: ExternalApiConfig): void => {
  if (!config.baseUrl) {
    throw new Error('External API base URL is required');
  }

  if (!config.endpoints.face) {
    throw new Error('Face API endpoint is required');
  }

  if (config.timeout <= 0) {
    throw new Error('API timeout must be greater than 0');
  }

  if (config.retryAttempts < 0) {
    throw new Error('Retry attempts cannot be negative');
  }

  if (config.retryDelay < 0) {
    throw new Error('Retry delay cannot be negative');
  }

  if (config.defaultValues.userId <= 0) {
    throw new Error('Default user ID must be greater than 0');
  }

  if (config.defaultValues.projectId <= 0) {
    throw new Error('Default project ID must be greater than 0');
  }
};

/**
 * Environment variable names for external API configuration
 */
export const ENV_VARS = {
  BASE_URL: 'EXTERNAL_FACE_API_BASE_URL',
  BASE_URL_PROD: 'EXTERNAL_FACE_API_BASE_URL_PROD',
  BASE_URL_STAGING: 'EXTERNAL_FACE_API_BASE_URL_STAGING',
  TIMEOUT: 'EXTERNAL_FACE_API_TIMEOUT',
  RETRY_ATTEMPTS: 'EXTERNAL_FACE_API_RETRY_ATTEMPTS',
  RETRY_DELAY: 'EXTERNAL_FACE_API_RETRY_DELAY',
  DEFAULT_USER_ID: 'DEFAULT_USER_ID',
  DEFAULT_PROJECT_ID: 'DEFAULT_PROJECT_ID',
} as const;

// Validate configuration on module load
try {
  validateExternalApiConfig(externalApiConfig);
} catch (error) {
  console.error('External API configuration validation failed:', error);
  // Don't throw in module initialization to allow graceful degradation
}

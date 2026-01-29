/**
 * External API Configuration
 * Centralized configuration for external face recognition API
 */

export interface ExternalApiConfig {
  baseUrl: string;
  faceApiEndpoint: string;
  requestTimeout: number;
  defaultHeaders: Record<string, string>;
  retryConfig: {
    maxRetries: number;
    retryDelay: number;
  };
}

/**
 * Configuration object for external API settings
 * Uses environment variables for deployment flexibility
 */
export const externalApiConfig: ExternalApiConfig = {
  // Base URL for external API
  baseUrl: process.env.EXTERNAL_API_BASE_URL || 'http://172.30.5.103:8001',

  // Face processing endpoint
  faceApiEndpoint:
    process.env.EXTERNAL_FACE_API_ENDPOINT || 'http://172.30.5.103:8001/face',

  // Request timeout in milliseconds
  requestTimeout: parseInt(process.env.EXTERNAL_API_TIMEOUT || '30000', 10),

  // Default headers for all requests
  defaultHeaders: {
    'User-Agent': 'AnimalAnalytic/1.0',
    Accept: 'application/json',
    ...(process.env.EXTERNAL_API_AUTH_TOKEN && {
      Authorization: `Bearer ${process.env.EXTERNAL_API_AUTH_TOKEN}`,
    }),
    ...(process.env.EXTERNAL_API_KEY && {
      'X-API-Key': process.env.EXTERNAL_API_KEY,
    }),
  },

  // Retry configuration
  retryConfig: {
    maxRetries: parseInt(process.env.EXTERNAL_API_MAX_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.EXTERNAL_API_RETRY_DELAY || '1000', 10),
  },
};

/**
 * Validates external API configuration
 * @returns boolean - True if configuration is valid
 */
export const validateExternalApiConfig = (): boolean => {
  try {
    new URL(externalApiConfig.baseUrl);
    new URL(externalApiConfig.faceApiEndpoint);
    return (
      externalApiConfig.requestTimeout > 0 &&
      externalApiConfig.retryConfig.maxRetries >= 0 &&
      externalApiConfig.retryConfig.retryDelay >= 0
    );
  } catch (error) {
    console.error('Invalid external API configuration:', error);
    return false;
  }
};

/**
 * Get environment-specific configuration
 * @param environment - Environment name (development, staging, production)
 * @returns ExternalApiConfig - Environment-specific configuration
 */
export const getEnvironmentConfig = (
  environment: string = 'development'
): ExternalApiConfig => {
  const configs: Record<string, Partial<ExternalApiConfig>> = {
    development: {
      baseUrl: 'http://172.30.5.103:8001',
      faceApiEndpoint: 'http://172.30.5.103:8001/face',
      requestTimeout: 30000,
    },
    staging: {
      baseUrl: process.env.STAGING_API_BASE_URL || 'http://172.30.5.103:8001',
      faceApiEndpoint:
        process.env.STAGING_FACE_API_ENDPOINT ||
        'http://172.30.5.103:8001/face',
      requestTimeout: 45000,
    },
    production: {
      baseUrl:
        process.env.PRODUCTION_API_BASE_URL || 'http://172.30.5.103:8001',
      faceApiEndpoint:
        process.env.PRODUCTION_FACE_API_ENDPOINT ||
        'http://172.30.5.103:8001/face',
      requestTimeout: 60000,
    },
  };

  return {
    ...externalApiConfig,
    ...configs[environment],
  };
};

/**
 * Default configuration presets
 */
export const configPresets = {
  fast: {
    requestTimeout: 10000,
    retryConfig: { maxRetries: 1, retryDelay: 500 },
  },
  standard: {
    requestTimeout: 30000,
    retryConfig: { maxRetries: 3, retryDelay: 1000 },
  },
  robust: {
    requestTimeout: 60000,
    retryConfig: { maxRetries: 5, retryDelay: 2000 },
  },
} as const;

/**
 * Apply configuration preset
 * @param preset - Preset name
 * @returns ExternalApiConfig - Configuration with applied preset
 */
export const applyConfigPreset = (
  preset: keyof typeof configPresets
): ExternalApiConfig => {
  return {
    ...externalApiConfig,
    ...configPresets[preset],
  };
};

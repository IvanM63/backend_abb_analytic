import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export interface ConnectionValidationResult extends ValidationResult {
  cctv?: any;
  primaryAnalytics?: any;
}

/**
 * Validates if CCTV exists by ID
 */
export const validateCctvExists = async (
  cctvId: number
): Promise<ValidationResult> => {
  try {
    const cctv = await prisma.cctv.findUnique({
      where: { id: cctvId },
    });

    if (!cctv) {
      return {
        isValid: false,
        message: 'CCTV not found',
      };
    }

    return {
      isValid: true,
    };
  } catch (error) {
    return {
      isValid: false,
      message: 'Error validating CCTV',
    };
  }
};

/**
 * Validates if Primary Analytics exists by ID
 */
export const validatePrimaryAnalyticsExists = async (
  primaryAnalyticsId: number
): Promise<ValidationResult> => {
  try {
    const primaryAnalytics = await prisma.primary_analytics.findUnique({
      where: { id: primaryAnalyticsId },
    });

    if (!primaryAnalytics) {
      return {
        isValid: false,
        message: 'Primary analytics not found',
      };
    }

    return {
      isValid: true,
    };
  } catch (error) {
    return {
      isValid: false,
      message: 'Error validating Primary Analytics',
    };
  }
};

/**
 * Validates if Primary Analytics and CCTV are connected
 */
export const validatePrimaryAnalyticsAndCctvConnection = async (
  primaryAnalyticsId: number,
  cctvId: number
): Promise<ConnectionValidationResult> => {
  try {
    // First check if both exist
    const [cctvValidation, primaryAnalyticsValidation] = await Promise.all([
      validateCctvExists(cctvId),
      validatePrimaryAnalyticsExists(primaryAnalyticsId),
    ]);

    if (!cctvValidation.isValid) {
      return cctvValidation;
    }

    if (!primaryAnalyticsValidation.isValid) {
      return primaryAnalyticsValidation;
    }

    // Check if they are connected
    const connection = await prisma.primary_analytics.findFirst({
      where: {
        id: primaryAnalyticsId,
        cctv: {
          some: {
            id: cctvId,
          },
        },
      },
      include: {
        cctv: {
          where: {
            id: cctvId,
          },
        },
      },
    });

    if (!connection) {
      return {
        isValid: false,
        message: 'Primary analytics and CCTV are not connected',
      };
    }

    return {
      isValid: true,
      primaryAnalytics: connection,
      cctv: connection.cctv[0],
    };
  } catch (error) {
    return {
      isValid: false,
      message: 'Error validating connection between Primary Analytics and CCTV',
    };
  }
};

/**
 * Complete validation for activity monitor operations
 * Validates existence and connection in one call
 */
export const validateActivityMonitorIds = async (
  primaryAnalyticsId: number,
  cctvId: number
): Promise<ConnectionValidationResult> => {
  return await validatePrimaryAnalyticsAndCctvConnection(
    primaryAnalyticsId,
    cctvId
  );
};

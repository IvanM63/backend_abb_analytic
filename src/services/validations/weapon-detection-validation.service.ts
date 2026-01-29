import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Interface for validation result
interface ValidationResult {
  isValid: boolean;
  message: string;
}

// Interface for connection validation result with data
interface ConnectionValidationResult extends ValidationResult {
  primaryAnalytics?: any;
  cctv?: any;
}

/**
 * Validate if Primary Analytics exists
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
      message: 'Primary analytics exists',
    };
  } catch (error) {
    return {
      isValid: false,
      message: 'Error validating Primary Analytics',
    };
  }
};

/**
 * Validate if CCTV exists
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
      message: 'CCTV exists',
    };
  } catch (error) {
    return {
      isValid: false,
      message: 'Error validating CCTV',
    };
  }
};

/**
 * Validate if Primary Analytics and CCTV are connected
 */
export const validatePrimaryAnalyticsAndCctvConnection = async (
  primaryAnalyticsId: number,
  cctvId: number
): Promise<ConnectionValidationResult> => {
  try {
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
      message: 'Primary analytics and CCTV are connected',
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
 * Complete validation for weapon detection operations
 * Validates existence and connection in one call
 */
export const validateWeaponDetectionIds = async (
  primaryAnalyticsId: number,
  cctvId: number
): Promise<ConnectionValidationResult> => {
  // Use the existing connection validation function
  return await validatePrimaryAnalyticsAndCctvConnection(
    primaryAnalyticsId,
    cctvId
  );
};

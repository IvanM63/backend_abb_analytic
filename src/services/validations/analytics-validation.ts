import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Service class for analytics-related validations
 */
export class AnalyticsValidationService {
  /**
   * Validates if a Primary Analytics exists
   * @param id - The ID of the Primary Analytics
   * @throws Error if Primary Analytics is not found
   */
  static async validatePrimaryAnalytics(id: number) {
    const primaryAnalytics = await prisma.primary_analytics.findUnique({
      where: { id },
    });

    if (!primaryAnalytics) {
      throw new Error('Primary analytics not found');
    }

    return primaryAnalytics;
  }

  /**
   * Validates if a CCTV exists
   * @param id - The ID of the CCTV
   * @throws Error if CCTV is not found
   */
  static async validateCctv(id: number) {
    const cctv = await prisma.cctv.findUnique({
      where: { id },
    });

    if (!cctv) {
      throw new Error('CCTV not found');
    }

    return cctv;
  }

  /**
   * Validates if a CCTV is connected to a specific Primary Analytics
   * @param cctvId - The ID of the CCTV
   * @param primaryAnalyticsId - The ID of the Primary Analytics
   * @throws Error if CCTV is not connected to the Primary Analytics
   */
  static async validateCctvPrimaryAnalyticsConnection(
    cctvId: number,
    primaryAnalyticsId: number
  ) {
    const connection = await prisma.primary_analytics.findFirst({
      where: {
        id: primaryAnalyticsId,
        cctv: {
          some: {
            id: cctvId,
          },
        },
      },
    });

    if (!connection) {
      throw new Error(
        'CCTV is not connected to the specified Primary Analytics'
      );
    }

    return connection;
  }
}

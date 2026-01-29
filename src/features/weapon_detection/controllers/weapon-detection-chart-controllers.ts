import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { WeaponDetectionChartQueryInput } from '../validators/weapon-detection-validators';
import {
  sendSuccessResponse,
  sendInternalErrorResponse,
} from '../../../utils/response';
import {
  convertDateRangeToJakartaTimezone,
  generateDateRange,
  convertDateStringToJakartaTimezone,
} from '../../../utils/timezone';

const prisma = new PrismaClient();

// Get daily chart data for weapon detection
export const getDailyWeaponDetectionChartData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cctvId, primaryAnalyticsId, startDate, endDate } = (req as any)
      .validatedQuery as WeaponDetectionChartQueryInput;

    const cctvIdInt = parseInt(cctvId);
    const primaryAnalyticsIdInt = parseInt(primaryAnalyticsId);

    // Convert dates to Jakarta timezone using utility function
    const { startDate: startDateObj, endDate: endDateObj } =
      convertDateRangeToJakartaTimezone(startDate, endDate);

    // Validate connection between primary analytics and CCTV
    const connection = await prisma.primary_analytics.findFirst({
      where: {
        id: primaryAnalyticsIdInt,
        cctv: {
          some: {
            id: cctvIdInt,
          },
        },
      },
    });

    if (!connection) {
      res.status(400).json({
        success: false,
        message: 'Primary analytics and CCTV are not connected',
      });
      return;
    }

    // Generate date range using utility function
    const dates = generateDateRange(startDateObj, endDateObj);

    // Get all unique weapon types from database for this specific primary analytics and CCTV
    const weaponTypesResult = await prisma.weapon_detection.findMany({
      where: {
        primary_analytics_id: primaryAnalyticsIdInt,
        cctv_id: cctvIdInt,
        datetime_send: {
          gte: startDateObj,
          lte: endDateObj,
        },
      },
      select: {
        weapon_type: true,
      },
      distinct: ['weapon_type'],
    });

    // Extract unique weapon types from the result
    const weaponTypes = weaponTypesResult
      .map((item) => item.weapon_type)
      .filter(Boolean);

    // Initialize data object to store results
    const data: Record<string, number[]> = {};

    // Get data for each date
    for (const dateStr of dates) {
      const queryDate = convertDateStringToJakartaTimezone(dateStr);
      const nextDay = new Date(queryDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // Get weapon detection counts for all weapon types for this date
      const weaponCounts = await Promise.all(
        weaponTypes.map((weaponType) =>
          prisma.weapon_detection.count({
            where: {
              primary_analytics_id: primaryAnalyticsIdInt,
              cctv_id: cctvIdInt,
              weapon_type: weaponType,
              datetime_send: {
                gte: queryDate,
                lt: nextDay,
              },
            },
          })
        )
      );

      // Initialize arrays on first iteration or push counts to existing arrays
      weaponTypes.forEach((weaponType, index) => {
        if (!data[weaponType]) {
          data[weaponType] = [];
        }
        data[weaponType].push(weaponCounts[index]);
      });
    }

    const responseData = {
      dates,
      data,
    };

    sendSuccessResponse(
      res,
      responseData,
      'Daily weapon detection chart data retrieved successfully'
    );
  } catch (error) {
    console.error('Error retrieving daily weapon detection chart data:', error);
    sendInternalErrorResponse(res);
  }
};

// Get weapon detection summary by weapon type
export const getWeaponTypesSummary = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cctvId, primaryAnalyticsId, startDate, endDate } = (req as any)
      .validatedQuery as WeaponDetectionChartQueryInput;

    const cctvIdInt = parseInt(cctvId);
    const primaryAnalyticsIdInt = parseInt(primaryAnalyticsId);

    // Convert dates to Jakarta timezone using utility function
    const { startDate: startDateObj, endDate: endDateObj } =
      convertDateRangeToJakartaTimezone(startDate, endDate);

    // Validate connection between primary analytics and CCTV
    const connection = await prisma.primary_analytics.findFirst({
      where: {
        id: primaryAnalyticsIdInt,
        cctv: {
          some: {
            id: cctvIdInt,
          },
        },
      },
    });

    if (!connection) {
      res.status(400).json({
        success: false,
        message: 'Primary analytics and CCTV are not connected',
      });
      return;
    }

    // Get weapon types summary for the date range
    const weaponTypesData = await prisma.weapon_detection.groupBy({
      by: ['weapon_type'],
      where: {
        primary_analytics_id: primaryAnalyticsIdInt,
        cctv_id: cctvIdInt,
        datetime_send: {
          gte: startDateObj,
          lte: endDateObj,
        },
      },
      _count: {
        weapon_type: true,
      },
      _avg: {
        confidence: true,
      },
    });

    const responseData = weaponTypesData.map((item) => ({
      weaponType: item.weapon_type,
      count: item._count.weapon_type,
      averageConfidence: item._avg.confidence || 0,
    }));

    sendSuccessResponse(
      res,
      responseData,
      'Weapon types summary retrieved successfully'
    );
  } catch (error) {
    console.error('Error retrieving weapon types summary:', error);
    sendInternalErrorResponse(res);
  }
};

// Get daily total weapon detection chart data (without grouping by weapon type)
export const getDailyTotalWeaponDetectionChartData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cctvId, primaryAnalyticsId, startDate, endDate } = (req as any)
      .validatedQuery as WeaponDetectionChartQueryInput;

    const cctvIdInt = parseInt(cctvId);
    const primaryAnalyticsIdInt = parseInt(primaryAnalyticsId);

    // Convert dates to Jakarta timezone using utility function
    const { startDate: startDateObj, endDate: endDateObj } =
      convertDateRangeToJakartaTimezone(startDate, endDate);

    // Validate connection between primary analytics and CCTV
    const connection = await prisma.primary_analytics.findFirst({
      where: {
        id: primaryAnalyticsIdInt,
        cctv: {
          some: {
            id: cctvIdInt,
          },
        },
      },
    });

    if (!connection) {
      res.status(400).json({
        success: false,
        message: 'Primary analytics and CCTV are not connected',
      });
      return;
    }

    // Generate date range using utility function
    const dates = generateDateRange(startDateObj, endDateObj);

    // Initialize weapon detection counts array
    const weaponDetectionCounts: number[] = [];

    // Get total weapon detection count for each date
    for (const dateStr of dates) {
      const queryDate = convertDateStringToJakartaTimezone(dateStr);
      const nextDay = new Date(queryDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // Get total weapon detection count for this date (all weapon types combined)
      const count = await prisma.weapon_detection.count({
        where: {
          primary_analytics_id: primaryAnalyticsIdInt,
          cctv_id: cctvIdInt,
          datetime_send: {
            gte: queryDate,
            lt: nextDay,
          },
        },
      });

      weaponDetectionCounts.push(count);
    }

    const responseData = {
      dates,
      data: {
        weapon_detection: weaponDetectionCounts,
      },
    };

    sendSuccessResponse(
      res,
      responseData,
      'Daily weapon detection chart data retrieved successfully'
    );
  } catch (error) {
    console.error(
      'Error retrieving daily total weapon detection chart data:',
      error
    );
    sendInternalErrorResponse(res);
  }
};

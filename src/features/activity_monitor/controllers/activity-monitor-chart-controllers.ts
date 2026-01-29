import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ActivityMonitorChartQueryInput } from '../validators/activity-monitor-validators';
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

// Get daily chart data for activity monitor
export const getDailyActivityMonitorChartData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cctvId, primaryAnalyticsId, startDate, endDate } = (req as any)
      .validatedQuery as ActivityMonitorChartQueryInput;

    const cctvIdInt = parseInt(cctvId);
    const primaryAnalyticsIdInt = parseInt(primaryAnalyticsId);

    // Convert dates to Jakarta timezone using utility function
    const { startDate: startDateObj, endDate: endDateObj } =
      convertDateRangeToJakartaTimezone(startDate, endDate); // Check if CCTV exists
    const cctv = await prisma.cctv.findUnique({
      where: { id: cctvIdInt },
    });

    if (!cctv) {
      res.status(404).json({
        success: false,
        message: 'CCTV not found',
      });
      return;
    }

    // Check if primary analytics exists
    const primaryAnalytics = await prisma.primary_analytics.findUnique({
      where: { id: primaryAnalyticsIdInt },
    });

    if (!primaryAnalytics) {
      res.status(404).json({
        success: false,
        message: 'Primary analytics not found',
      });
      return;
    }

    // Check if primary analytics and CCTV are connected
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

    // Initialize result arrays
    const receptionist_receives_money: number[] = [];
    const receptionist_receives_id_card: number[] = [];
    const receptionist_gives_room_key: number[] = [];
    const receptionist_fill_out_form: number[] = [];
    const check_in: number[] = [];

    // Get data for each date
    for (const dateStr of dates) {
      const queryDate = convertDateStringToJakartaTimezone(dateStr);
      const nextDay = new Date(queryDate);
      nextDay.setDate(nextDay.getDate() + 1); // Count activities for each sub_type_analytic
      const [
        moneyCount,
        idCardCount,
        keyRoomCount,
        fillFormCount,
        checkInCount,
      ] = await Promise.all([
        // Count receptionist_receive_money
        prisma.activity_monitoring.count({
          where: {
            primary_analytics_id: primaryAnalyticsIdInt,
            cctv_id: cctvIdInt,
            sub_type_analytic: 'receptionist_receives_money',
            datetime_send: {
              gte: queryDate,
              lt: nextDay,
            },
          },
        }),
        // Count receptionist_receive_id_card
        prisma.activity_monitoring.count({
          where: {
            primary_analytics_id: primaryAnalyticsIdInt,
            cctv_id: cctvIdInt,
            sub_type_analytic: 'receptionist_receives_id_card',
            datetime_send: {
              gte: queryDate,
              lt: nextDay,
            },
          },
        }),
        // Count receptionist_gives_room_key
        prisma.activity_monitoring.count({
          where: {
            primary_analytics_id: primaryAnalyticsIdInt,
            cctv_id: cctvIdInt,
            sub_type_analytic: 'receptionist_gives_room_key',
            datetime_send: {
              gte: queryDate,
              lt: nextDay,
            },
          },
        }),
        // Count receptionist_fill_out_form
        prisma.activity_monitoring.count({
          where: {
            primary_analytics_id: primaryAnalyticsIdInt,
            cctv_id: cctvIdInt,
            sub_type_analytic: 'receptionist_fill_out_form',
            datetime_send: {
              gte: queryDate,
              lt: nextDay,
            },
          },
        }),
        // Count check_in
        prisma.activity_monitoring.count({
          where: {
            primary_analytics_id: primaryAnalyticsIdInt,
            cctv_id: cctvIdInt,
            sub_type_analytic: 'check_in',
            datetime_send: {
              gte: queryDate,
              lt: nextDay,
            },
          },
        }),
      ]);

      receptionist_receives_money.push(moneyCount);
      receptionist_receives_id_card.push(idCardCount);
      receptionist_gives_room_key.push(keyRoomCount);
      receptionist_fill_out_form.push(fillFormCount);
      check_in.push(checkInCount);
    }

    const chartData = {
      dates,
      receptionist_receives_money,
      receptionist_receives_id_card,
      receptionist_gives_room_key,
      receptionist_fill_out_form,
      check_in,
    };

    sendSuccessResponse(
      res,
      chartData,
      'Daily activity monitor chart data retrieved successfully'
    );
  } catch (error) {
    console.error('Error getting daily activity monitor chart data:', error);
    sendInternalErrorResponse(res);
  }
};

// Get daily check-in chart data for activity monitor
export const getDailyCheckInChartData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cctvId, primaryAnalyticsId, startDate, endDate } = (req as any)
      .validatedQuery as ActivityMonitorChartQueryInput;

    const cctvIdInt = parseInt(cctvId);
    const primaryAnalyticsIdInt = parseInt(primaryAnalyticsId);

    // Convert dates to Jakarta timezone using utility function
    const { startDate: startDateObj, endDate: endDateObj } =
      convertDateRangeToJakartaTimezone(startDate, endDate);

    // Check if CCTV exists
    const cctv = await prisma.cctv.findUnique({
      where: { id: cctvIdInt },
    });

    if (!cctv) {
      res.status(404).json({
        success: false,
        message: 'CCTV not found',
      });
      return;
    }

    // Check if primary analytics exists
    const primaryAnalytics = await prisma.primary_analytics.findUnique({
      where: { id: primaryAnalyticsIdInt },
    });

    if (!primaryAnalytics) {
      res.status(404).json({
        success: false,
        message: 'Primary analytics not found',
      });
      return;
    }

    // Check if primary analytics and CCTV are connected
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

    // Initialize result array for check-in counts
    const checkInCounts: number[] = [];

    // Get data for each date
    for (const dateStr of dates) {
      const queryDate = convertDateStringToJakartaTimezone(dateStr);
      const nextDay = new Date(queryDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // Get all relevant activity records for the day
      const activities = await prisma.activity_monitoring.findMany({
        where: {
          primary_analytics_id: primaryAnalyticsIdInt,
          cctv_id: cctvIdInt,
          sub_type_analytic: {
            in: [
              'receptionist_receives_id_card',
              'receptionist_gives_room_key',
            ],
          },
          datetime_send: {
            gte: queryDate,
            lt: nextDay,
          },
        },
        orderBy: {
          datetime_send: 'asc',
        },
        select: {
          sub_type_analytic: true,
          datetime_send: true,
        },
      });

      // Group activities within 5-second windows and count check-ins
      let checkInCount = 0;
      const processedActivities = new Set<number>();

      for (let i = 0; i < activities.length; i++) {
        if (processedActivities.has(i)) continue;

        const currentActivity = activities[i];
        const currentTime = currentActivity.datetime_send.getTime();

        // Find activities within 5-second window
        const relatedActivities = [currentActivity];
        for (let j = i + 1; j < activities.length; j++) {
          if (processedActivities.has(j)) continue;

          const otherActivity = activities[j];
          const timeDiff = Math.abs(
            otherActivity.datetime_send.getTime() - currentTime
          );

          if (timeDiff <= 300000) {
            // 5 minutes = 300000 milliseconds
            relatedActivities.push(otherActivity);
            processedActivities.add(j);
          }
        }

        processedActivities.add(i);

        // Check if this group of activities constitutes a check-in
        const hasReceiveIdCard = relatedActivities.some(
          (activity) =>
            activity.sub_type_analytic === 'receptionist_receives_id_card'
        );
        const hasGiveRoomKey = relatedActivities.some(
          (activity) =>
            activity.sub_type_analytic === 'receptionist_gives_room_key'
        );

        // Apply check-in conditions:
        // Condition 1: receptionist_receives_id_card AND receptionist_gives_room_key
        // Condition 2: receptionist_receives_id_card OR null
        // Condition 3: null OR receptionist_gives_room_key
        // This essentially means ANY of these activities counts as a check-in
        if (hasReceiveIdCard || hasGiveRoomKey) {
          checkInCount++;
        }
      }

      checkInCounts.push(checkInCount);
    }

    const chartData = {
      dates,
      'check-in': checkInCounts,
    };

    sendSuccessResponse(
      res,
      chartData,
      'Daily check in chart data retrieved successfully'
    );
  } catch (error) {
    console.error('Error getting daily check-in chart data:', error);
    sendInternalErrorResponse(res);
  }
};

// Get daily check-in chart data for activity monitor new
export const getDailyCheckInChartDataNew = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cctvId, primaryAnalyticsId, startDate, endDate } = (req as any)
      .validatedQuery as ActivityMonitorChartQueryInput;

    const cctvIdInt = parseInt(cctvId);
    const primaryAnalyticsIdInt = parseInt(primaryAnalyticsId);

    // Convert dates to Jakarta timezone using utility function
    const { startDate: startDateObj, endDate: endDateObj } =
      convertDateRangeToJakartaTimezone(startDate, endDate); // Check if CCTV exists
    const cctv = await prisma.cctv.findUnique({
      where: { id: cctvIdInt },
    });

    if (!cctv) {
      res.status(404).json({
        success: false,
        message: 'CCTV not found',
      });
      return;
    }

    // Check if primary analytics exists
    const primaryAnalytics = await prisma.primary_analytics.findUnique({
      where: { id: primaryAnalyticsIdInt },
    });

    if (!primaryAnalytics) {
      res.status(404).json({
        success: false,
        message: 'Primary analytics not found',
      });
      return;
    }

    // Check if primary analytics and CCTV are connected
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

    // Initialize result arrays
    const check_in: number[] = [];

    // Get data for each date
    for (const dateStr of dates) {
      const queryDate = convertDateStringToJakartaTimezone(dateStr);
      const nextDay = new Date(queryDate);
      nextDay.setDate(nextDay.getDate() + 1); // Count activities for each sub_type_analytic
      const [checkInCount] = await Promise.all([
        // Count check_in
        prisma.activity_monitoring.count({
          where: {
            primary_analytics_id: primaryAnalyticsIdInt,
            cctv_id: cctvIdInt,
            sub_type_analytic: 'check_in',
            datetime_send: {
              gte: queryDate,
              lt: nextDay,
            },
          },
        }),
      ]);
      check_in.push(checkInCount);
    }

    const chartData = {
      dates,
      check_in,
    };

    sendSuccessResponse(
      res,
      chartData,
      'Daily activity monitor chart data retrieved successfully'
    );
  } catch (error) {
    console.error('Error getting daily activity monitor chart data:', error);
    sendInternalErrorResponse(res);
  }
};

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ActivityMonitorLatestDayQueryInput } from '../validators/activity-monitor-validators';
import {
  sendSuccessResponse,
  sendInternalErrorResponse,
} from '../../../utils/response';
import { validateActivityMonitorIds } from '../../../services/validations/activity-monitor-validation.service';

const prisma = new PrismaClient();

// Get latest day data for activity monitor
export const getLatestDayData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cctvId, primaryAnalyticsId } = (req as any)
      .validatedQuery as ActivityMonitorLatestDayQueryInput;

    const cctvIdInt = parseInt(cctvId);
    const primaryAnalyticsIdInt = parseInt(primaryAnalyticsId);

    // Validate if IDs exist and are connected using the service
    const validation = await validateActivityMonitorIds(
      primaryAnalyticsIdInt,
      cctvIdInt
    );

    if (!validation.isValid) {
      res
        .status(
          validation.message === 'CCTV not found' ||
            validation.message === 'Primary analytics not found'
            ? 404
            : 400
        )
        .json({
          success: false,
          message: validation.message,
        });
      return;
    }

    // Get today's date (current date in system timezone)
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Format date as YYYY-MM-DD for response
    const dateToday = today.toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD format

    // Count activities for each sub_type_analytic for today
    const [
      receptionist_receives_money,
      receptionist_receives_id_card,
      receptionist_gives_room_key,
      check_in,
    ] = await Promise.all([
      // Count receptionist_receives_money
      prisma.activity_monitoring.count({
        where: {
          primary_analytics_id: primaryAnalyticsIdInt,
          cctv_id: cctvIdInt,
          sub_type_analytic: 'receptionist_receives_money',
          datetime_send: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
      // Count receptionist_receives_id_card
      prisma.activity_monitoring.count({
        where: {
          primary_analytics_id: primaryAnalyticsIdInt,
          cctv_id: cctvIdInt,
          sub_type_analytic: 'receptionist_receives_id_card',
          datetime_send: {
            gte: startOfDay,
            lte: endOfDay,
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
            gte: startOfDay,
            lte: endOfDay,
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
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
    ]);

    const responseData = {
      data: {
        receptionist_receives_money,
        receptionist_receives_id_card,
        receptionist_gives_room_key,
        check_in,
      },
      dateToday,
    };

    sendSuccessResponse(
      res,
      responseData,
      'Latest day activity monitor data retrieved successfully'
    );
  } catch (error) {
    console.error('Error getting latest day activity monitor data:', error);
    sendInternalErrorResponse(res);
  }
};

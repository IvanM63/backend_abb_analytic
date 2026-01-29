import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { WeaponDetectionLatestDayQueryInput } from '../validators/weapon-detection-validators';
import {
  sendSuccessResponse,
  sendInternalErrorResponse,
} from '../../../utils/response';
import { validateWeaponDetectionIds } from '../../../services/validations/weapon-detection-validation.service';

const prisma = new PrismaClient();

// Get latest day data for weapon detection
export const getLatestDayData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cctvId, primaryAnalyticsId } = (req as any)
      .validatedQuery as WeaponDetectionLatestDayQueryInput;

    const cctvIdInt = parseInt(cctvId);
    const primaryAnalyticsIdInt = parseInt(primaryAnalyticsId);

    // Validate if IDs exist and are connected using the service
    const validation = await validateWeaponDetectionIds(
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

    // Count weapon detections for each weapon type for today
    const [pistol, rifle, knife, grenade, machineGun] = await Promise.all([
      prisma.weapon_detection.count({
        where: {
          primary_analytics_id: primaryAnalyticsIdInt,
          cctv_id: cctvIdInt,
          weapon_type: 'pistol',
          datetime_send: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
      prisma.weapon_detection.count({
        where: {
          primary_analytics_id: primaryAnalyticsIdInt,
          cctv_id: cctvIdInt,
          weapon_type: 'rifle',
          datetime_send: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
      prisma.weapon_detection.count({
        where: {
          primary_analytics_id: primaryAnalyticsIdInt,
          cctv_id: cctvIdInt,
          weapon_type: 'knife',
          datetime_send: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
      prisma.weapon_detection.count({
        where: {
          primary_analytics_id: primaryAnalyticsIdInt,
          cctv_id: cctvIdInt,
          weapon_type: 'grenade',
          datetime_send: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
      prisma.weapon_detection.count({
        where: {
          primary_analytics_id: primaryAnalyticsIdInt,
          cctv_id: cctvIdInt,
          weapon_type: 'machine_gun',
          datetime_send: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
    ]);

    // Calculate total detections
    const totalDetections = pistol + rifle + knife + grenade + machineGun;

    const responseData = {
      date: dateToday,
      totalDetections,
      weaponTypes: {
        pistol,
        rifle,
        knife,
        grenade,
        machine_gun: machineGun,
      },
    };

    sendSuccessResponse(
      res,
      responseData,
      'Latest day weapon detection data retrieved successfully'
    );
  } catch (error) {
    console.error('Error retrieving latest day weapon detection data:', error);
    sendInternalErrorResponse(res);
  }
};

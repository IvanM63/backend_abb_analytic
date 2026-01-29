import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  CreateActivityMonitorInput,
  UpdateActivityMonitorInput,
} from '../validators/activity-monitor-validators';
import { handlePagination } from '../../../utils/pagination';
import { handleSearch } from '../../../utils/search';
import { handleSorting } from '../../../utils/sorting';
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendInternalErrorResponse,
} from '../../../utils/response';
import { uploadFileToLocal, formatImageUrl } from '../../../utils/file-upload';

const prisma = new PrismaClient();

// Get all activity monitor records with pagination and search
export const getAllActivityMonitors = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Build where clause for search
    const whereClause = handleSearch(req, {
      searchFields: ['sub_type_analytic'],
      searchMode: 'contains',
    });

    // Build order by clause for sorting
    const orderByClause = handleSorting(req, {
      allowedFields: [
        'created_at',
        'updated_at',
        'datetime_send',
        'sub_type_analytic',
      ],
      defaultField: 'created_at',
      defaultOrder: 'desc',
    });

    // Filter by CCTV ID if provided
    if (req.query.cctvId) {
      const cctvId = parseInt(req.query.cctvId as string, 10);
      if (!isNaN(cctvId)) {
        whereClause.cctv_id = cctvId;
      }
    }

    // Filter by Primary Analytics ID if provided
    if (req.query.primaryAnalyticsId) {
      const primaryAnalyticsId = parseInt(
        req.query.primaryAnalyticsId as string,
        10
      );
      if (!isNaN(primaryAnalyticsId)) {
        whereClause.primary_analytics_id = primaryAnalyticsId;
      }
    }

    // Use pagination utility
    const result = await handlePagination(
      req,
      // Count function
      () => prisma.activity_monitoring.count({ where: whereClause }),
      // Data function
      ({ skip, limit }) =>
        prisma.activity_monitoring.findMany({
          where: whereClause,
          orderBy: orderByClause,
          skip,
          take: limit,
          include: {
            primary_analytics: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
            cctv: {
              select: {
                id: true,
                cctv_name: true,
                is_active: true,
              },
            },
          },
        })
    );

    // Format response
    const formattedData = result.data.map((activity) => ({
      id: activity.id,
      primaryAnalyticsId: activity.primary_analytics_id,
      cctvId: activity.cctv_id,
      captureImg: formatImageUrl(activity.capture_img),
      subTypeAnalytic: activity.sub_type_analytic,
      datetimeSend: activity.datetime_send,
      createdAt: activity.created_at,
      updatedAt: activity.updated_at,
      primaryAnalytics: activity.primary_analytics,
      cctv: activity.cctv,
    }));

    res.status(200).json({
      success: true,
      message: 'Activity monitor records retrieved successfully',
      data: formattedData,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching activity monitor records:', error);
    sendInternalErrorResponse(res);
  }
};

// Get activity monitor by ID
export const getActivityMonitorById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const existingRecord = (req as any).existingRecord;

    // Format the response data
    const formattedResponse = {
      id: existingRecord.id,
      primaryAnalyticsId: existingRecord.primary_analytics_id,
      cctvId: existingRecord.cctv_id,
      captureImg: formatImageUrl(existingRecord.capture_img),
      subTypeAnalytic: existingRecord.sub_type_analytic,
      datetimeSend: existingRecord.datetime_send,
      createdAt: existingRecord.created_at,
      updatedAt: existingRecord.updated_at,
      primaryAnalytics: existingRecord.primary_analytics,
      cctv: existingRecord.cctv,
    };

    sendSuccessResponse(
      res,
      formattedResponse,
      'Activity monitor record retrieved successfully'
    );
  } catch (error) {
    console.error('Error retrieving activity monitor:', error);
    sendInternalErrorResponse(res);
  }
};

// Create a new activity monitor
export const createActivityMonitor = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get validated data from the validation middleware
    const activityMonitorData: CreateActivityMonitorInput = (req as any)
      .validatedData;

    // Get user ID from the request (assuming user is authenticated)
    const userId = (req as any).user?.id || 1;

    // Extract necessary fields from validated data
    const {
      primaryAnalyticsId,
      cctvId,
      subTypeAnalytic,
      datetime_send,
      captureImg,
    } = activityMonitorData;

    let captureImgPath: string | null = null;

    // Handle image upload if provided
    if (captureImg || (req as any).file) {
      try {
        // Generate date string for filename
        const now = new Date();
        const dateStr = now
          .toISOString()
          .replace(/T/, '-')
          .replace(/\..+/, '')
          .replace(/:/g, '')
          .replace(/-/g, '');

        const tempDirPath = `activity-monitor/user-${userId}/capture`;

        // Create filename with UUID to prevent overwriting
        const fileExtension =
          (req as any).file?.originalname?.split('.').pop() || 'jpg';
        const tempFilename = `activity-monitor-${dateStr}-${randomUUID().substring(0, 8)}.${fileExtension}`;

        console.log((req as any).file);
        console.log((req as any).file.buffer);

        // Save image to local storage
        const imageBuffer = captureImg || (req as any).file?.buffer;
        captureImgPath = await uploadFileToLocal(
          imageBuffer,
          tempDirPath,
          tempFilename
        );
      } catch (uploadError) {
        console.error('Error uploading capture image:', uploadError);
        sendErrorResponse(res, 'Failed to upload capture image', 400);
        return;
      }
    }

    const activityMonitor = await prisma.activity_monitoring.create({
      data: {
        primary_analytics_id: primaryAnalyticsId,
        cctv_id: cctvId,
        capture_img: captureImgPath,
        sub_type_analytic: subTypeAnalytic,
        datetime_send: datetime_send ? new Date(datetime_send) : undefined,
      },
      include: {
        primary_analytics: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        cctv: {
          select: {
            id: true,
            cctv_name: true,
            is_active: true,
          },
        },
      },
    });

    // Format the response data
    const formattedResponse = {
      id: activityMonitor.id,
      primaryAnalyticsId: activityMonitor.primary_analytics_id,
      cctvId: activityMonitor.cctv_id,
      captureImg: formatImageUrl(activityMonitor.capture_img),
      subTypeAnalytic: activityMonitor.sub_type_analytic,
      datetimeSend: activityMonitor.datetime_send,
      createdAt: activityMonitor.created_at,
      updatedAt: activityMonitor.updated_at,
      primaryAnalytics: activityMonitor.primary_analytics,
      cctv: activityMonitor.cctv,
    };

    sendSuccessResponse(
      res,
      formattedResponse,
      'Activity monitor record created successfully',
      201
    );
  } catch (error) {
    console.error('Error creating activity monitor:', error);
    sendInternalErrorResponse(res);
  }
};

// Update an existing activity monitor
export const updateActivityMonitor = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const activityMonitorData: UpdateActivityMonitorInput = (req as any)
      .validatedData;

    // Get the existing record
    const existingRecord = (req as any).existingRecord;

    // Get user ID from the request (assuming user is authenticated)
    const userId = (req as any).user?.id || 1;

    let captureImgPath: string | null = null;

    // Handle image upload if provided
    if (activityMonitorData.captureImg || (req as any).file) {
      try {
        const now = new Date();
        const dateStr = now
          .toISOString()
          .replace(/T/, '-')
          .replace(/\..+/, '')
          .replace(/:/g, '')
          .replace(/-/g, '');

        const tempDirPath = `activity-monitor/user-${userId}/capture`;

        // Create filename with UUID to prevent overwriting
        const fileExtension =
          (req as any).file?.originalname?.split('.').pop() || 'jpg';
        const tempFilename = `activity-monitor-${dateStr}-${randomUUID().substring(0, 8)}.${fileExtension}`;

        // Save image to local storage
        const imageBuffer =
          activityMonitorData.captureImg || (req as any).file?.buffer;
        captureImgPath = await uploadFileToLocal(
          imageBuffer,
          tempDirPath,
          tempFilename
        );
      } catch (uploadError) {
        console.error('Error uploading capture image:', uploadError);
        sendErrorResponse(res, 'Failed to upload capture image', 400);
        return;
      }
    }

    const updatedRecord = await prisma.activity_monitoring.update({
      where: { id: parseInt(id) },
      data: {
        primary_analytics_id: activityMonitorData.primaryAnalyticsId,
        cctv_id: activityMonitorData.cctvId,
        capture_img: captureImgPath || existingRecord.capture_img,
        sub_type_analytic: activityMonitorData.subTypeAnalytic,
        datetime_send: activityMonitorData.datetime_send
          ? new Date(activityMonitorData.datetime_send)
          : existingRecord.datetime_send,
      },
      include: {
        primary_analytics: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        cctv: {
          select: {
            id: true,
            cctv_name: true,
            is_active: true,
          },
        },
      },
    });

    // Format the response data
    const formattedResponse = {
      id: updatedRecord.id,
      primaryAnalyticsId: updatedRecord.primary_analytics_id,
      cctvId: updatedRecord.cctv_id,
      captureImg: formatImageUrl(updatedRecord.capture_img),
      subTypeAnalytic: updatedRecord.sub_type_analytic,
      datetimeSend: updatedRecord.datetime_send,
      createdAt: updatedRecord.created_at,
      updatedAt: updatedRecord.updated_at,
      primaryAnalytics: updatedRecord.primary_analytics,
      cctv: updatedRecord.cctv,
    };

    sendSuccessResponse(
      res,
      formattedResponse,
      'Activity monitor record updated successfully'
    );
  } catch (error) {
    console.error('Error updating activity monitor:', error);
    sendInternalErrorResponse(res);
  }
};

// Delete an activity monitor
export const deleteActivityMonitor = async (
  req: Request,
  res: Response
): Promise<void> => {
  const activityMonitorId = parseInt(req.params.id, 10);
  try {
    // Check if activity monitor exists
    const activityMonitorExists = await prisma.activity_monitoring.findUnique({
      where: { id: activityMonitorId },
    });

    if (!activityMonitorExists) {
      res.status(404).json({
        success: false,
        message: 'Activity monitor record not found',
      });
      return;
    }

    await prisma.activity_monitoring.delete({
      where: { id: activityMonitorId },
    });

    res.status(204).json({
      success: true,
      message: 'Activity monitor record deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting activity monitor:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

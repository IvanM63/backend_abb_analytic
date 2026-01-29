import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  CreateWeaponDetectionInput,
  UpdateWeaponDetectionInput,
} from '../validators/weapon-detection-validators';
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

// Get all weapon detection records with pagination and search
export const getAllWeaponDetections = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Build where clause for search
    const whereClause = handleSearch(req, {
      searchFields: ['weapon_type'],
      searchMode: 'contains',
    });

    // Build order by clause for sorting
    const orderByClause = handleSorting(req, {
      allowedFields: [
        'id',
        'weapon_type',
        'confidence',
        'datetime_send',
        'created_at',
        'updated_at',
      ],
      defaultField: 'datetime_send',
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
      () => prisma.weapon_detection.count({ where: whereClause }),
      // Data function
      ({ skip, limit }) =>
        prisma.weapon_detection.findMany({
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

    // Format the response data
    const formattedData = result.data.map((weaponDetection: any) => ({
      id: weaponDetection.id,
      primaryAnalyticsId: weaponDetection.primary_analytics_id,
      cctvId: weaponDetection.cctv_id,
      weaponType: weaponDetection.weapon_type,
      captureImg: formatImageUrl(weaponDetection.capture_img),
      confidence: weaponDetection.confidence,
      datetimeSend: weaponDetection.datetime_send,
      createdAt: weaponDetection.created_at,
      updatedAt: weaponDetection.updated_at,
      primaryAnalytics: weaponDetection.primary_analytics,
      cctv: weaponDetection.cctv,
    }));

    res.status(200).json({
      success: true,
      message: 'Weapon detection records retrieved successfully',
      data: formattedData,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching weapon detection records:', error);
    sendInternalErrorResponse(res);
  }
};

// Get weapon detection by ID
export const getWeaponDetectionById = async (
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
      weaponType: existingRecord.weapon_type,
      captureImg: formatImageUrl(existingRecord.capture_img),
      confidence: existingRecord.confidence,
      datetimeSend: existingRecord.datetime_send,
      createdAt: existingRecord.created_at,
      updatedAt: existingRecord.updated_at,
      primaryAnalytics: existingRecord.primary_analytics,
      cctv: existingRecord.cctv,
    };

    sendSuccessResponse(
      res,
      formattedResponse,
      'Weapon detection record retrieved successfully'
    );
  } catch (error) {
    console.error('Error retrieving weapon detection:', error);
    sendInternalErrorResponse(res);
  }
};

// Create a new weapon detection
export const createWeaponDetection = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get validated data from the validation middleware
    const weaponDetectionData: CreateWeaponDetectionInput = (req as any)
      .validatedData;

    // Get user ID from the request (assuming user is authenticated)
    const userId = (req as any).user?.id || 1;

    // Extract necessary fields from validated data
    const {
      primaryAnalyticsId,
      cctvId,
      weaponType,
      confidence,
      datetime_send,
      captureImg,
    } = weaponDetectionData;

    let captureImgPath: string | null = null;

    // Handle image upload if provided
    if (captureImg) {
      // Generate unique filename
      const fileExtension = captureImg.originalname.split('.').pop();
      const fileName = `weapon_detection_${randomUUID()}.${fileExtension}`;

      try {
        captureImgPath = await uploadFileToLocal(
          captureImg,
          'weapon_detection',
          fileName
        );
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        sendErrorResponse(res, 'Failed to upload image', 500);
        return;
      }
    }

    // Create new weapon detection record
    const weaponDetection = await prisma.weapon_detection.create({
      data: {
        primary_analytics_id: primaryAnalyticsId,
        cctv_id: cctvId,
        weapon_type: weaponType,
        confidence: confidence,
        capture_img: captureImgPath,
        datetime_send: datetime_send ? new Date(datetime_send) : new Date(),
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

    // Format the response
    const formattedResponse = {
      id: weaponDetection.id,
      primaryAnalyticsId: weaponDetection.primary_analytics_id,
      cctvId: weaponDetection.cctv_id,
      weaponType: weaponDetection.weapon_type,
      captureImg: formatImageUrl(weaponDetection.capture_img),
      confidence: weaponDetection.confidence,
      datetimeSend: weaponDetection.datetime_send,
      createdAt: weaponDetection.created_at,
      updatedAt: weaponDetection.updated_at,
      primaryAnalytics: weaponDetection.primary_analytics,
      cctv: weaponDetection.cctv,
    };

    sendSuccessResponse(
      res,
      formattedResponse,
      'Weapon detection record created successfully',
      201
    );
  } catch (error) {
    console.error('Error creating weapon detection:', error);
    sendInternalErrorResponse(res);
  }
};

// Update an existing weapon detection
export const updateWeaponDetection = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const weaponDetectionData: UpdateWeaponDetectionInput = (req as any)
      .validatedData;

    // Get the existing record
    const existingRecord = (req as any).existingRecord;

    // Get user ID from the request (assuming user is authenticated)
    const userId = (req as any).user?.id || 1;

    // Prepare update data
    const updateData: any = {};

    if (weaponDetectionData.primaryAnalyticsId) {
      updateData.primary_analytics_id = weaponDetectionData.primaryAnalyticsId;
    }

    if (weaponDetectionData.cctvId) {
      updateData.cctv_id = weaponDetectionData.cctvId;
    }

    if (weaponDetectionData.weaponType) {
      updateData.weapon_type = weaponDetectionData.weaponType;
    }

    if (weaponDetectionData.confidence !== undefined) {
      updateData.confidence = weaponDetectionData.confidence;
    }

    if (weaponDetectionData.datetime_send) {
      updateData.datetime_send = new Date(weaponDetectionData.datetime_send);
    }

    // Handle image upload if provided
    if (weaponDetectionData.captureImg) {
      // Generate unique filename
      const fileExtension = weaponDetectionData.captureImg.originalname
        .split('.')
        .pop();
      const fileName = `weapon_detection_${randomUUID()}.${fileExtension}`;

      try {
        const captureImgPath = await uploadFileToLocal(
          weaponDetectionData.captureImg,
          'weapon_detection',
          fileName
        );
        updateData.capture_img = captureImgPath;
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        sendErrorResponse(res, 'Failed to upload image', 500);
        return;
      }
    }

    // Update the weapon detection record
    const updatedWeaponDetection = await prisma.weapon_detection.update({
      where: { id: parseInt(id) },
      data: updateData,
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

    // Format the response
    const formattedResponse = {
      id: updatedWeaponDetection.id,
      primaryAnalyticsId: updatedWeaponDetection.primary_analytics_id,
      cctvId: updatedWeaponDetection.cctv_id,
      weaponType: updatedWeaponDetection.weapon_type,
      captureImg: formatImageUrl(updatedWeaponDetection.capture_img),
      confidence: updatedWeaponDetection.confidence,
      datetimeSend: updatedWeaponDetection.datetime_send,
      createdAt: updatedWeaponDetection.created_at,
      updatedAt: updatedWeaponDetection.updated_at,
      primaryAnalytics: updatedWeaponDetection.primary_analytics,
      cctv: updatedWeaponDetection.cctv,
    };

    sendSuccessResponse(
      res,
      formattedResponse,
      'Weapon detection record updated successfully'
    );
  } catch (error) {
    console.error('Error updating weapon detection:', error);
    sendInternalErrorResponse(res);
  }
};

// Delete a weapon detection
export const deleteWeaponDetection = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.weapon_detection.delete({
      where: { id: parseInt(id) },
    });

    sendSuccessResponse(
      res,
      null,
      'Weapon detection record deleted successfully'
    );
  } catch (error) {
    console.error('Error deleting weapon detection:', error);
    sendInternalErrorResponse(res);
  }
};

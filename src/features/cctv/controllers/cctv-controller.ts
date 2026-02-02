import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  CreateCctvInput,
  UpdateCctvInput,
  UpdateCctvFormInput,
} from '../validators/cctv-validator';
import {
  uploadFileToLocal,
  formatImageUrl,
  validateRequiredFields,
  deleteFileFromLocal,
} from '../../../utils/file-upload';
import { handlePagination } from '../../../utils/pagination';
import { handleSearch } from '../../../utils/search';
import { handleSorting } from '../../../utils/sorting';

const prisma = new PrismaClient();

// Get all CCTVs with pagination and search
export const getAllCctvs = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get validated query params from middleware
    const validatedQuery = (req as any).validatedQuery || {};
    const { typeAnalyticIds, isActive } = validatedQuery;

    // Build where clause for search
    const whereClause: any = handleSearch(req, {
      searchFields: ['cctv_name'],
      searchMode: 'contains',
    });

    // Add filter for typeAnalyticIds if provided
    if (typeAnalyticIds && typeAnalyticIds.length > 0) {
      whereClause.primary_analytics = {
        some: {
          type_analytic_id: {
            in: typeAnalyticIds,
          },
        },
      };
    }

    // Add filter for isActive if provided
    if (isActive !== undefined) {
      whereClause.is_active = isActive;
    }

    // Build order by clause for sorting
    const orderByClause = handleSorting(req, {
      allowedFields: ['created_at', 'updated_at', 'name'],
      defaultField: 'created_at',
      defaultOrder: 'desc',
    });

    // Use pagination utility
    const result = await handlePagination(
      req,
      // Count function
      () => prisma.cctv.count({ where: whereClause }),
      // Data function
      ({ skip, limit }) =>
        prisma.cctv.findMany({
          where: whereClause,
          orderBy: orderByClause,
          skip,
          take: limit,
          include: {
            // Optionally include related models
            // users: { select: { id: true, email: true } },
          },
        }),
      // Options
      {
        defaultLimit: 10,
        maxLimit: 50,
      }
    );

    // Format polygon_img URLs in the data
    const formattedData = result.data.map((cctv: any) => ({
      ...cctv,
      polygon_img: formatImageUrl(cctv.polygon_img),
    }));

    res.json({
      ...result,
      data: formattedData,
      message: 'CCTVs retrieved successfully',
    });
  } catch (error) {
    console.error('Error retrieving CCTVs:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get single CCTV by ID
export const getCctvById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid CCTV ID',
      });
      return;
    }

    const cctv = await prisma.cctv.findUnique({
      where: { id },
      include: {
        // Optionally include related models
        // users: { select: { id: true, email: true } },
        // model_has_polygons: true,
        // primary_analytics: true,
      },
    });

    if (!cctv) {
      res.status(404).json({
        success: false,
        message: 'CCTV not found',
      });
      return;
    }

    // Format the polygon_img URL
    const formattedCctv = {
      ...cctv,
      polygon_img: formatImageUrl(cctv.polygon_img),
    };

    res.json({
      success: true,
      message: 'CCTV retrieved successfully',
      data: formattedCctv,
    });
  } catch (error) {
    console.error('Error retrieving CCTV:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Create a new CCTV with file upload
export const createCctv = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get validated data from the validation middleware
    const validatedData = (req as any).validatedData;

    if (!validatedData) {
      res.status(400).json({
        success: false,
        message: 'Validation data not found',
      });
      return;
    }

    const {
      cctvName,
      ipCctv,
      ipServer,
      rtsp,
      embed,
      latitude,
      longitude,
      typeStreaming,
      isActive = true,
    } = validatedData;

    // Generate date string for filename
    const now = new Date();
    const dateStr = now
      .toISOString()
      .replace(/T/, '-')
      .replace(/\..+/, '')
      .replace(/:/g, '')
      .replace(/-/g, '');

    // Get user ID (defaulting to 1 for now as per your earlier request)
    const userId = (req as any).user?.id || 1;
    const tempDirPath = `cctv/user-${userId}/polygon`;

    // Create temporary filename
    const tempFilename = `cctv-polygon-${dateStr}.${(req as any).file.originalname.split('.').pop()}`;

    // Save image to local storage initially
    const tempImgPath = await uploadFileToLocal(
      (req as any).file,
      tempDirPath,
      tempFilename
    );

    // Create the CCTV record with temporary path
    const createdCctv = await prisma.cctv.create({
      data: {
        user_id: userId,
        cctv_name: cctvName,
        ip_cctv: ipCctv,
        ip_server: ipServer,
        rtsp,
        embed: embed,
        latitude,
        longitude,
        type_streaming: typeStreaming,
        is_active: true,
        polygon_img: tempImgPath,
      },
    });

    // Use the same directory path but with a final filename that includes the CCTV ID
    const finalDirPath = `cctv/user-${userId}/polygon`;

    // Create final filename with CCTV ID
    const finalFilename = `cctv-${createdCctv.id}-polygon-${dateStr}.${(req as any).file.originalname.split('.').pop()}`;

    // Save image to the final location
    const finalImgPath = await uploadFileToLocal(
      (req as any).file,
      finalDirPath,
      finalFilename
    );

    // Update the CCTV record with the final path
    const updatedCctv = await prisma.cctv.update({
      where: { id: createdCctv.id },
      data: { polygon_img: finalImgPath },
    });

    // Format the response data
    const formattedCctv = {
      ...updatedCctv,
      polygon_img: formatImageUrl(updatedCctv.polygon_img),
    };

    res.status(201).json({
      success: true,
      message: 'CCTV created successfully',
      data: formattedCctv,
    });
  } catch (error) {
    console.error('Create CCTV error:', error);
    res.status(500).json({
      success: false,
      message: 'There is something wrong',
    });
  }
};

// Update an existing CCTV
export const updateCctv = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const cctvData = req.body as UpdateCctvInput;

    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid CCTV ID',
      });
      return;
    }

    // Check if CCTV exists
    const existingCctv = await prisma.cctv.findUnique({
      where: { id },
    });

    if (!existingCctv) {
      res.status(404).json({
        success: false,
        message: 'CCTV not found',
      });
      return;
    }

    // Check if there's any data to update
    if (!cctvData || Object.keys(cctvData).length === 0) {
      res.status(400).json({
        success: false,
        message: 'No data provided for update',
      });
      return;
    }

    // Update CCTV
    const updatedCctv = await prisma.cctv.update({
      where: { id },
      data: cctvData,
    });

    res.json({
      success: true,
      message: 'CCTV updated successfully',
      data: updatedCctv,
    });
  } catch (error) {
    console.error('Error updating CCTV:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Update an existing CCTV with form-data (with optional image upload)
export const updateCctvWithFormData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const validatedData = (req as any).validatedData as UpdateCctvFormInput;

    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid CCTV ID',
      });
      return;
    }

    // Check if CCTV exists
    const existingCctv = await prisma.cctv.findUnique({
      where: { id },
    });

    if (!existingCctv) {
      res.status(404).json({
        success: false,
        message: 'CCTV not found',
      });
      return;
    }

    // Prepare update data
    const updateData: any = {};

    // Map form field names to database field names
    if (validatedData.cctvName !== undefined) {
      updateData.cctv_name = validatedData.cctvName;
    }
    if (validatedData.ipCctv !== undefined) {
      updateData.ip_cctv = validatedData.ipCctv;
    }
    if (validatedData.ipServer !== undefined) {
      updateData.ip_server = validatedData.ipServer;
    }
    if (validatedData.rtsp !== undefined) {
      updateData.rtsp = validatedData.rtsp;
    }
    if (validatedData.embed !== undefined) {
      updateData.embed = validatedData.embed;
    }
    if (validatedData.latitude !== undefined) {
      updateData.latitude = validatedData.latitude;
    }
    if (validatedData.longitude !== undefined) {
      updateData.longitude = validatedData.longitude;
    }
    if (validatedData.typeStreaming !== undefined) {
      updateData.type_streaming = validatedData.typeStreaming;
    }
    if (validatedData.isActive !== undefined) {
      console.log('Setting is_active to:', validatedData.isActive);
      updateData.is_active = validatedData.isActive;
    }

    // Handle image upload if provided
    if ((req as any).file) {
      // Delete old image if it exists
      if (existingCctv.polygon_img) {
        await deleteFileFromLocal(existingCctv.polygon_img);
      }

      // Generate date string for filename
      const now = new Date();
      const dateStr = now
        .toISOString()
        .replace(/T/, '-')
        .replace(/\..+/, '')
        .replace(/:/g, '')
        .replace(/-/g, '');

      // Get user ID (defaulting to 1 for now)
      const userId = (req as any).user?.id || 1;
      const dirPath = `cctv/user-${userId}/polygon`;

      // Create final filename with CCTV ID
      const finalFilename = `cctv-${id}-polygon-${dateStr}.${(req as any).file.originalname.split('.').pop()}`;

      // Save image to local storage
      const imgPath = await uploadFileToLocal(
        (req as any).file,
        dirPath,
        finalFilename
      );

      updateData.polygon_img = imgPath;
    }

    // Update CCTV
    const updatedCctv = await prisma.cctv.update({
      where: { id },
      data: updateData,
    });

    // Format the response data
    const formattedCctv = {
      ...updatedCctv,
      polygon_img: formatImageUrl(updatedCctv.polygon_img),
    };

    res.json({
      success: true,
      message: 'CCTV updated successfully',
      data: formattedCctv,
    });
  } catch (error) {
    console.error('Error updating CCTV:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get CCTVs by Primary Analytics ID
export const getCctvsByPrimaryAnalyticId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const primaryAnalyticId = Number(req.params.primaryAnalyticId);

    if (isNaN(primaryAnalyticId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid Primary Analytics ID',
      });
      return;
    }

    // Check if primary analytics exists
    const primaryAnalytic = await prisma.primary_analytics.findUnique({
      where: { id: primaryAnalyticId },
    });

    if (!primaryAnalytic) {
      res.status(404).json({
        success: false,
        message: 'Primary Analytics not found',
      });
      return;
    }

    // Build where clause for search
    const baseWhereClause = {
      primary_analytics: {
        some: {
          id: primaryAnalyticId,
        },
      },
    };

    // Handle search if provided
    const searchTerm = req.query.search as string;
    let whereClause: any = baseWhereClause;

    if (searchTerm) {
      whereClause = {
        AND: [
          baseWhereClause,
          {
            cctv_name: {
              contains: searchTerm,
            },
          },
        ],
      };
    }

    // Build order by clause for sorting
    const orderByClause = handleSorting(req, {
      allowedFields: ['created_at', 'updated_at', 'cctv_name'],
      defaultField: 'created_at',
      defaultOrder: 'desc',
    });

    // Use pagination utility
    const result = await handlePagination(
      req,
      // Count function
      () => prisma.cctv.count({ where: whereClause }),
      // Data function
      ({ skip, limit }) =>
        prisma.cctv.findMany({
          where: whereClause,
          orderBy: orderByClause,
          skip,
          take: limit,
          include: {
            primary_analytics: {
              where: { id: primaryAnalyticId },
              select: {
                id: true,
                name: true,
                description: true,
                status: true,
                type_analytic: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        }),
      // Options
      {
        defaultLimit: 10,
        maxLimit: 50,
      }
    );

    // Format polygon_img URLs in the data
    const formattedData = result.data.map((cctv: any) => ({
      ...cctv,
      polygon_img: formatImageUrl(cctv.polygon_img),
    }));

    res.json({
      ...result,
      data: formattedData,
      message: 'CCTVs retrieved successfully by Primary Analytics ID',
    });
  } catch (error) {
    console.error('Error retrieving CCTVs by Primary Analytics ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get CCTV with analytic data
export const getCCTVWithAnalytic = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid CCTV ID' });
      return;
    }

    // Ambil CCTV beserta analytic terkait
    const cctv = await prisma.cctv.findUnique({
      where: { id },
      include: {
        primary_analytics: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            type_analytic: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!cctv) {
      res.status(404).json({ success: false, message: 'CCTV not found' });
      return;
    }

    // Format polygon_img URL
    const formattedCctv = {
      ...cctv,
      polygon_img: formatImageUrl(cctv.polygon_img),
    };

    res.json({
      success: true,
      message: 'CCTV with analytic retrieved successfully',
      data: formattedCctv,
    });
  } catch (error) {
    console.error('Error retrieving CCTV with analytic:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Delete a CCTV
export const deleteCctv = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid CCTV ID',
      });
      return;
    }

    // Check if CCTV exists
    const existingCctv = await prisma.cctv.findUnique({
      where: { id },
    });

    if (!existingCctv) {
      res.status(404).json({
        success: false,
        message: 'CCTV not found',
      });
      return;
    }

    // Delete associated image file if it exists
    if (existingCctv.polygon_img) {
      await deleteFileFromLocal(existingCctv.polygon_img);
    }

    // Delete CCTV
    await prisma.cctv.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'CCTV deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting CCTV:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

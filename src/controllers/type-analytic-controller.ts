import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  CreateTypeAnalyticInput,
  UpdateTypeAnalyticInput,
  GetTypeAnalyticParams,
} from '../validators/type-analytic-validator';
import { handlePagination } from '../utils/pagination';
import { handleSearch } from '../utils/search';
import { handleSorting } from '../utils/sorting';
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundResponse,
  sendInternalErrorResponse,
} from '../utils/response';

const prisma = new PrismaClient();

// Create a new type_analytic
export const createTypeAnalytic = async (
  req: Request<{}, {}, CreateTypeAnalyticInput>,
  res: Response
): Promise<void> => {
  try {
    const { name } = req.body;

    // Check if type_analytic with the same name already exists
    const existingTypeAnalytic = await prisma.type_analytic.findFirst({
      where: { name },
    });

    if (existingTypeAnalytic) {
      sendErrorResponse(
        res,
        'Type analytic with this name already exists',
        400
      );
      return;
    }

    const typeAnalytic = await prisma.type_analytic.create({
      data: {
        name,
      },
    });

    sendSuccessResponse(
      res,
      typeAnalytic,
      'Type analytic created successfully',
      201
    );
  } catch (error) {
    console.error('Error creating type analytic:', error);
    sendInternalErrorResponse(res);
  }
};

// Get all type_analytics with pagination
export const getTypeAnalytics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Build where clause for search
    const whereClause = handleSearch(req, {
      searchFields: ['name'],
      searchMode: 'contains',
    });

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
      () => prisma.type_analytic.count({ where: whereClause }),
      // Data function
      ({ skip, limit }) =>
        prisma.type_analytic.findMany({
          where: whereClause,
          orderBy: orderByClause,
          skip,
          take: limit,
          include: {
            _count: {
              select: {
                primary_analytics: true,
              },
            },
          },
        }),
      // Options
      {
        defaultLimit: 10,
        maxLimit: 100,
      }
    );

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching type analytics:', error);
    sendInternalErrorResponse(res);
  }
};

// Get a single type_analytic by ID
export const getTypeAnalyticById = async (
  req: Request<GetTypeAnalyticParams>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const typeAnalytic = await prisma.type_analytic.findUnique({
      where: { id: parseInt(id) },
      include: {
        primary_analytics: {
          select: {
            id: true,
            name: true,
            status: true,
            created_at: true,
          },
        },
        _count: {
          select: {
            primary_analytics: true,
          },
        },
      },
    });

    if (!typeAnalytic) {
      sendNotFoundResponse(res, 'Type analytic not found');
      return;
    }

    sendSuccessResponse(res, typeAnalytic);
  } catch (error) {
    console.error('Error fetching type analytic:', error);
    sendInternalErrorResponse(res);
  }
};

// Update a type_analytic
export const updateTypeAnalytic = async (
  req: Request<GetTypeAnalyticParams, {}, UpdateTypeAnalyticInput>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Check if type_analytic exists
    const existingTypeAnalytic = await prisma.type_analytic.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingTypeAnalytic) {
      sendNotFoundResponse(res, 'Type analytic not found');
      return;
    }

    // Check if another type_analytic with the same name exists
    const duplicateTypeAnalytic = await prisma.type_analytic.findFirst({
      where: {
        name,
        id: { not: parseInt(id) },
      },
    });

    if (duplicateTypeAnalytic) {
      sendErrorResponse(
        res,
        'Type analytic with this name already exists',
        400
      );
      return;
    }

    const updatedTypeAnalytic = await prisma.type_analytic.update({
      where: { id: parseInt(id) },
      data: {
        name,
      },
    });

    sendSuccessResponse(
      res,
      updatedTypeAnalytic,
      'Type analytic updated successfully'
    );
  } catch (error) {
    console.error('Error updating type analytic:', error);
    sendInternalErrorResponse(res);
  }
};

// Delete a type_analytic
export const deleteTypeAnalytic = async (
  req: Request<GetTypeAnalyticParams>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if type_analytic exists
    const existingTypeAnalytic = await prisma.type_analytic.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            primary_analytics: true,
          },
        },
      },
    });

    if (!existingTypeAnalytic) {
      sendNotFoundResponse(res, 'Type analytic not found');
      return;
    }

    // Check if type_analytic is being used by primary_analytics
    if (existingTypeAnalytic._count.primary_analytics > 0) {
      sendErrorResponse(
        res,
        'Cannot delete type analytic that is being used by primary analytics',
        400
      );
      return;
    }

    await prisma.type_analytic.delete({
      where: { id: parseInt(id) },
    });

    sendSuccessResponse(res, null, 'Type analytic deleted successfully');
  } catch (error) {
    console.error('Error deleting type analytic:', error);
    sendInternalErrorResponse(res);
  }
};

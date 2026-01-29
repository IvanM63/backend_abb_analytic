import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  CreatePrimaryAnalyticInput,
  UpdatePrimaryAnalyticInput,
  GetPrimaryAnalyticParams,
  GetCctvParams,
} from '../validators/primary-analytic-validator';
import { handlePagination } from '../utils/pagination';
import { handleSearch } from '../utils/search';
import { handleSorting } from '../utils/sorting';
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundResponse,
  sendInternalErrorResponse,
} from '../utils/response';
import {
  selectBestServer,
  reserveServerCapacity,
  releaseServerCapacity,
  checkServerCapacity,
  getServerDetails,
} from '../utils/server-selection';

const prisma = new PrismaClient();

// Create a new primary_analytic
export const createPrimaryAnalytic = async (
  req: Request<{}, {}, CreatePrimaryAnalyticInput>,
  res: Response
): Promise<void> => {
  try {
    const { serverId, cctvId, primaryAnalytics, isServer = true } = req.body;

    // Validate type analytic exists
    const typeAnalytic = await prisma.type_analytic.findUnique({
      where: { id: primaryAnalytics.typeAnalyticId },
    });

    if (!typeAnalytic) {
      sendNotFoundResponse(res, 'Type analytic not found');
      return;
    }

    // Validate CCTVs exist
    const cctvs = await prisma.cctv.findMany({
      where: { id: { in: cctvId } },
    });

    if (cctvs.length !== cctvId.length) {
      sendErrorResponse(res, 'One or more CCTV IDs are invalid', 400);
      return;
    }

    // Determine server selection
    let selectedServerId: number;

    if (!isServer) {
      // If isServer is false, use server ID 1 without any validation
      selectedServerId = 1;
    } else {
      // Original server validation and selection logic
      if (serverId) {
        // If serverId is provided, validate it and check capacity
        const server = await prisma.servers.findUnique({
          where: { id: serverId },
        });

        if (!server) {
          sendNotFoundResponse(res, 'Specified server not found');
          return;
        }

        // Check if server has enough capacity
        const hasCapacity = await checkServerCapacity(
          serverId,
          primaryAnalytics.typeAnalyticId,
          1
        );

        if (!hasCapacity) {
          sendErrorResponse(
            res,
            `Server ${server.ip} does not have enough capacity for this analytic type`,
            400
          );
          return;
        }

        selectedServerId = serverId;
      } else {
        // Auto-select best server based on capacity and type
        if (primaryAnalytics.typeAnalyticId === 1) {
          // Activity monitoring - find servers with available capacity
          const availableServer = await prisma.servers.findFirst({
            where: {
              AND: [
                {
                  cur_activity_monitoring: {
                    lt: prisma.servers.fields.max_activity_monitoring,
                  },
                },
              ],
            },
            orderBy: {
              id: 'asc', // Start checking from server id 1
            },
          });

          if (!availableServer) {
            sendErrorResponse(
              res,
              `No servers available with sufficient capacity for ${typeAnalytic.name}`,
              400
            );
            return;
          }

          selectedServerId = availableServer.id;
        } else if (primaryAnalytics.typeAnalyticId === 2) {
          // Customer service time - use activity monitoring capacity for now
          const availableServer = await prisma.servers.findFirst({
            where: {
              AND: [
                {
                  cur_activity_monitoring: {
                    lt: prisma.servers.fields.max_activity_monitoring,
                  },
                },
              ],
            },
            orderBy: {
              id: 'asc', // Start checking from server id 1
            },
          });

          if (!availableServer) {
            sendErrorResponse(
              res,
              'No servers available with sufficient capacity for analytics',
              400
            );
            return;
          }

          selectedServerId = availableServer.id;
        } else {
          sendErrorResponse(
            res,
            'Auto server selection is only supported for activity monitoring and customer service time analytics',
            400
          );
          return;
        }
      }
    }

    // Validate CCTV IDs in polygons if provided
    if (
      primaryAnalytics.modelHasPolygons &&
      primaryAnalytics.modelHasPolygons.length > 0
    ) {
      const polygonCctvIds = primaryAnalytics.modelHasPolygons.map(
        (polygon) => polygon.cctvId
      );
      const polygonCctvs = await prisma.cctv.findMany({
        where: { id: { in: polygonCctvIds } },
      });
    }

    // Validate CCTV IDs in embeds if provided
    if (
      primaryAnalytics.modelHasEmbeds &&
      primaryAnalytics.modelHasEmbeds.length > 0
    ) {
      const embedCctvIds = primaryAnalytics.modelHasEmbeds.map(
        (embed) => embed.cctvId
      );
      const embedCctvs = await prisma.cctv.findMany({
        where: { id: { in: embedCctvIds } },
      });

      if (embedCctvs.length !== embedCctvIds.length) {
        sendErrorResponse(
          res,
          'One or more CCTV IDs in embeds are invalid',
          400
        );
        return;
      }
    }

    // Validate sub type analytics if provided
    if (
      primaryAnalytics.subAnalytics &&
      primaryAnalytics.subAnalytics.length > 0
    ) {
      const subTypeAnalyticIds = primaryAnalytics.subAnalytics.map(
        (sub) => sub.subTypeAnalyticId
      );
      const subTypeAnalytics = await prisma.sub_type_analytic.findMany({
        where: { id: { in: subTypeAnalyticIds } },
      });

      if (subTypeAnalytics.length !== subTypeAnalyticIds.length) {
        sendErrorResponse(
          res,
          'One or more sub type analytic IDs are invalid',
          400
        );
        return;
      }
    }

    // Create primary analytic with related data
    const result = await prisma.$transaction(async (tx) => {
      // Server capacity management based on type_analytic_id (only if isServer is true)
      if (isServer) {
        if (primaryAnalytics.typeAnalyticId === 1) {
          // Activity monitoring - increment cur_activity_monitoring count
          await tx.servers.update({
            where: { id: selectedServerId },
            data: {
              cur_activity_monitoring: {
                increment: 1,
              },
            },
          });
        } else if (primaryAnalytics.typeAnalyticId === 2) {
          // Customer service time - increment cur_activity_monitoring count
          await tx.servers.update({
            where: { id: selectedServerId },
            data: {
              cur_activity_monitoring: {
                increment: 1,
              },
            },
          });
        }
      }

      // Create primary analytic
      const primaryAnalytic = await tx.primary_analytics.create({
        data: {
          servers_id: selectedServerId,
          type_analytic_id: primaryAnalytics.typeAnalyticId,
          name: primaryAnalytics.name,
          description: primaryAnalytics.description,
          cctv: {
            connect: cctvId.map((id) => ({ id })),
          },
        },
      });

      // Create model has values if provided
      if (
        primaryAnalytics.modelHasValues &&
        primaryAnalytics.modelHasValues.length > 0
      ) {
        await tx.model_has_values.createMany({
          data: primaryAnalytics.modelHasValues.map((value) => ({
            model_id: primaryAnalytic.id,
            model_type: 'primary',
            value_name: value.valueName,
            value: value.value,
          })),
        });
      }

      // Create model has embeds if provided, otherwise create default ones
      if (
        primaryAnalytics.modelHasEmbeds &&
        primaryAnalytics.modelHasEmbeds.length > 0
      ) {
        await tx.model_has_embeds.createMany({
          data: primaryAnalytics.modelHasEmbeds.map((embed) => ({
            cctv_id: embed.cctvId,
            model_id: primaryAnalytic.id,
            embed: embed.embed,
          })),
        });
      } else {
        // Create default embeds for all CCTVs
        await tx.model_has_embeds.createMany({
          data: cctvId.map((cctvIdItem) => ({
            cctv_id: cctvIdItem,
            model_id: primaryAnalytic.id,
            embed: `https://streamingcctv.gerbangdata.co.id/hls/${cctvIdItem}-${primaryAnalytic.id}.m3u8`,
          })),
        });
      }

      // Create model has polygons if provided
      if (
        primaryAnalytics.modelHasPolygons &&
        primaryAnalytics.modelHasPolygons.length > 0
      ) {
        await tx.model_has_polygons.createMany({
          data: primaryAnalytics.modelHasPolygons.map((polygon) => ({
            name: polygon.name,
            cctv_id: polygon.cctvId,
            model_id: primaryAnalytic.id,
            model_type: 'primary',
            polygon: polygon.polygon,
          })),
        });
      }

      // Create sub analytics if provided
      if (
        primaryAnalytics.subAnalytics &&
        primaryAnalytics.subAnalytics.length > 0
      ) {
        await tx.sub_analytics.createMany({
          data: primaryAnalytics.subAnalytics.map((sub) => ({
            primary_analytic_id: primaryAnalytic.id,
            sub_type_analytic_id: sub.subTypeAnalyticId,
          })),
        });
      }

      return primaryAnalytic;
    });

    // Fetch the created primary analytic with all related data
    const createdPrimaryAnalytic = await prisma.primary_analytics.findUnique({
      where: { id: result.id },
      include: {
        servers: true,
        type_analytic: true,
        cctv: true,
        sub_analytics: {
          include: {
            sub_type_analytic: true,
          },
        },
        model_has_embeds: true,
        activity_monitoring: true,
        animal_population: true,
      },
    });

    sendSuccessResponse(
      res,
      createdPrimaryAnalytic,
      'Primary analytic created successfully',
      201
    );
  } catch (error) {
    console.error('Error creating primary analytic:', error);
    sendInternalErrorResponse(res, 'Failed to create primary analytic');
  }
};

// Get all primary analytics with pagination and search
export const getPrimaryAnalytics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Build where clause for search
    const whereClause = handleSearch(req, {
      searchFields: ['name', 'description'],
      searchMode: 'contains',
    });

    // Build order by clause for sorting
    const orderByClause = handleSorting(req, {
      allowedFields: [
        'created_at',
        'updated_at',
        'name',
        'description',
        'status',
      ],
      defaultField: 'created_at',
      defaultOrder: 'desc',
    });

    // Extract pagination parameters
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit as string) || 10)
    );
    const skip = (page - 1) * limit;

    // Get primary analytics with pagination
    const [primaryAnalytics, total] = await Promise.all([
      prisma.primary_analytics.findMany({
        where: whereClause,
        include: {
          servers: {
            select: {
              id: true,
              ip: true,
              description: true,
            },
          },
          type_analytic: {
            select: {
              id: true,
              name: true,
            },
          },
          cctv: true,
          sub_analytics: {
            include: {
              sub_type_analytic: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          model_has_embeds: {
            select: {
              id: true,
              cctv_id: true,
              model_id: true,
              embed: true,
            },
          },
        },
        orderBy: orderByClause,
        skip,
        take: limit,
      }),
      prisma.primary_analytics.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Format response to match the requested structure
    const response = {
      success: true,
      data: primaryAnalytics.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at,
        servers: item.servers,
        type_analytic: item.type_analytic,
        cctv: item.cctv,
        sub_analytics: item.sub_analytics,
        model_has_embeds: item.model_has_embeds,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching primary analytics:', error);
    sendInternalErrorResponse(res, 'Failed to fetch primary analytics');
  }
};

// Get a single primary analytic by ID
export const getPrimaryAnalyticById = async (
  req: Request<GetPrimaryAnalyticParams>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const primaryAnalytic = await prisma.primary_analytics.findUnique({
      where: { id: Number(id) },
      include: {
        servers: true,
        type_analytic: true,
        cctv: true,
        sub_analytics: {
          include: {
            sub_type_analytic: true,
          },
        },
        model_has_embeds: true,
        activity_monitoring: true,
        animal_population: true,
      },
    });

    if (!primaryAnalytic) {
      sendNotFoundResponse(res, 'Primary analytic not found');
      return;
    }

    // Get related model has values, polygons, and embeds
    const [modelHasValues, modelHasPolygons, modelHasEmbeds] =
      await Promise.all([
        prisma.model_has_values.findMany({
          where: {
            model_id: Number(id),
            model_type: 'primary',
          },
        }),
        prisma.model_has_polygons.findMany({
          where: {
            model_id: Number(id),
            model_type: 'primary',
          },
        }),
        prisma.model_has_embeds.findMany({
          where: {
            model_id: Number(id),
          },
        }),
      ]);

    const result = {
      ...primaryAnalytic,
      modelHasValues,
      modelHasPolygons,
      modelHasEmbeds,
    };

    sendSuccessResponse(res, result);
  } catch (error) {
    console.error('Error fetching primary analytic:', error);
    sendInternalErrorResponse(res, 'Failed to fetch primary analytic');
  }
};

// Get primary analytics by CCTV ID
export const getPrimaryAnalyticsByCctvId = async (
  req: Request<GetCctvParams>,
  res: Response
): Promise<void> => {
  try {
    const { cctvId } = req.params;
    const cctvIdNumber = parseInt(cctvId);

    // Validate CCTV exists
    const cctv = await prisma.cctv.findUnique({
      where: { id: cctvIdNumber },
    });

    if (!cctv) {
      sendNotFoundResponse(res, 'CCTV not found');
      return;
    }

    // Get pagination parameters from query
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Get search parameters from query
    const searchTerm = req.query.search as string;
    const sortBy = req.query.sortBy as string;
    const sortOrder = req.query.sortOrder as string;

    // Build where clause
    const whereClause: any = {
      cctv: {
        some: {
          id: cctvIdNumber,
        },
      },
    };

    // Apply search if provided
    if (searchTerm) {
      whereClause.OR = [
        { name: { contains: searchTerm } },
        { description: { contains: searchTerm } },
      ];
    }

    // Get total count
    const totalCount = await prisma.primary_analytics.count({
      where: whereClause,
    });

    // Build order by clause
    const orderByClause: any = {};
    if (
      sortBy &&
      ['name', 'description', 'status', 'created_at', 'updated_at'].includes(
        sortBy
      )
    ) {
      orderByClause[sortBy] = sortOrder === 'desc' ? 'desc' : 'asc';
    } else {
      orderByClause.created_at = 'desc';
    }

    // Get primary analytics
    const primaryAnalytics = await prisma.primary_analytics.findMany({
      where: whereClause,
      include: {
        servers: {
          select: {
            id: true,
            ip: true,
            description: true,
          },
        },
        type_analytic: {
          select: {
            id: true,
            name: true,
          },
        },
        cctv: {
          select: {
            id: true,
            cctv_name: true,
          },
        },
      },
      orderBy: orderByClause,
      skip: offset,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    const response = {
      success: true,
      data: primaryAnalytics,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching primary analytics by CCTV ID:', error);
    sendInternalErrorResponse(res, 'Failed to fetch primary analytics');
  }
};

// Update a primary analytic
export const updatePrimaryAnalytic = async (
  req: Request<GetPrimaryAnalyticParams, {}, UpdatePrimaryAnalyticInput>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { serverId, cctvId, primaryAnalytics } = req.body;

    // Check if primary analytic exists
    const existingPrimaryAnalytic = await prisma.primary_analytics.findUnique({
      where: { id: Number(id) },
      include: {
        servers: true,
        type_analytic: true,
      },
    });

    if (!existingPrimaryAnalytic) {
      sendNotFoundResponse(res, 'Primary analytic not found');
      return;
    }

    // Determine server selection for update
    let selectedServerId: number;
    const currentServerId = existingPrimaryAnalytic.servers_id;
    const newTypeAnalyticId =
      primaryAnalytics.typeAnalyticId ||
      existingPrimaryAnalytic.type_analytic_id;

    if (serverId) {
      // If serverId is provided, validate it and check capacity
      const server = await prisma.servers.findUnique({
        where: { id: serverId },
      });

      if (!server) {
        sendNotFoundResponse(res, 'Specified server not found');
        return;
      }

      // Check if server has enough capacity (if changing servers)
      if (serverId !== currentServerId) {
        const hasCapacity = await checkServerCapacity(
          serverId,
          newTypeAnalyticId,
          1
        );

        if (!hasCapacity) {
          sendErrorResponse(
            res,
            `Server ${server.ip} does not have enough capacity for this analytic type`,
            400
          );
          return;
        }
      }

      selectedServerId = serverId;
    } else {
      // If no serverId provided, check if we need to relocate due to type change
      if (
        primaryAnalytics.typeAnalyticId &&
        primaryAnalytics.typeAnalyticId !==
          existingPrimaryAnalytic.type_analytic_id
      ) {
        // Type analytic changed, check if current server can handle it
        const currentServerCanHandle = currentServerId
          ? await checkServerCapacity(currentServerId, newTypeAnalyticId, 1)
          : false;

        if (currentServerId && !currentServerCanHandle) {
          // Current server can't handle new type, find a new one
          const bestServer = await selectBestServer(newTypeAnalyticId, {
            requiredCapacity: 1,
            excludeServerIds: [currentServerId],
          });

          if (!bestServer) {
            sendErrorResponse(
              res,
              'No servers available with sufficient capacity for the new analytic type',
              400
            );
            return;
          }

          selectedServerId = bestServer.id;
        } else {
          selectedServerId = currentServerId || 1; // Fallback to server 1 if null
        }
      } else {
        // No type change, keep current server
        selectedServerId = currentServerId || 1; // Fallback to server 1 if null
      }
    }

    // Validate CCTVs if provided
    if (cctvId && cctvId.length > 0) {
      const cctvs = await prisma.cctv.findMany({
        where: { id: { in: cctvId } },
      });

      if (cctvs.length !== cctvId.length) {
        sendErrorResponse(res, 'One or more CCTV IDs are invalid', 400);
        return;
      }
    }

    // Validate type analytic if provided
    if (primaryAnalytics.typeAnalyticId) {
      const typeAnalytic = await prisma.type_analytic.findUnique({
        where: { id: primaryAnalytics.typeAnalyticId },
      });

      if (!typeAnalytic) {
        sendNotFoundResponse(res, 'Type analytic not found');
        return;
      }
    }

    // Validate CCTV IDs in polygons if provided
    if (
      primaryAnalytics.modelHasPolygons &&
      primaryAnalytics.modelHasPolygons.length > 0
    ) {
      const polygonCctvIds = primaryAnalytics.modelHasPolygons.map(
        (polygon) => polygon.cctvId
      );
      const polygonCctvs = await prisma.cctv.findMany({
        where: { id: { in: polygonCctvIds } },
      });

      if (polygonCctvs.length !== polygonCctvIds.length) {
        sendErrorResponse(
          res,
          'One or more CCTV IDs in polygons are invalid',
          400
        );
        return;
      }
    }

    // Validate CCTV IDs in embeds if provided
    if (
      primaryAnalytics.modelHasEmbeds &&
      primaryAnalytics.modelHasEmbeds.length > 0
    ) {
      const embedCctvIds = primaryAnalytics.modelHasEmbeds.map(
        (embed) => embed.cctvId
      );
      const embedCctvs = await prisma.cctv.findMany({
        where: { id: { in: embedCctvIds } },
      });

      if (embedCctvs.length !== embedCctvIds.length) {
        sendErrorResponse(
          res,
          'One or more CCTV IDs in embeds are invalid',
          400
        );
        return;
      }
    }

    // Validate sub type analytics if provided
    if (
      primaryAnalytics.subAnalytics &&
      primaryAnalytics.subAnalytics.length > 0
    ) {
      const subTypeAnalyticIds = primaryAnalytics.subAnalytics.map(
        (sub) => sub.subTypeAnalyticId
      );
      const subTypeAnalytics = await prisma.sub_type_analytic.findMany({
        where: { id: { in: subTypeAnalyticIds } },
      });

      if (subTypeAnalytics.length !== subTypeAnalyticIds.length) {
        sendErrorResponse(
          res,
          'One or more sub type analytic IDs are invalid',
          400
        );
        return;
      }
    }

    // Update primary analytic with related data
    const result = await prisma.$transaction(async (tx) => {
      // Handle server capacity if server is changing
      if (selectedServerId !== currentServerId && currentServerId) {
        // Release capacity from old server
        await releaseServerCapacity(
          currentServerId,
          existingPrimaryAnalytic.type_analytic_id,
          1
        );

        // Reserve capacity on new server
        const capacityReserved = await reserveServerCapacity(
          selectedServerId,
          newTypeAnalyticId,
          1
        );

        if (!capacityReserved) {
          throw new Error('Failed to reserve server capacity');
        }
      } else if (
        primaryAnalytics.typeAnalyticId &&
        primaryAnalytics.typeAnalyticId !==
          existingPrimaryAnalytic.type_analytic_id
      ) {
        // Same server but type changed, adjust capacity if needed
        // For now, we'll just log this case - you might want to add specific logic
        console.log('Analytics type changed on the same server');
      }

      // Update primary analytic
      const updateData: any = {};
      if (selectedServerId !== currentServerId)
        updateData.servers_id = selectedServerId;
      if (primaryAnalytics.typeAnalyticId)
        updateData.type_analytic_id = primaryAnalytics.typeAnalyticId;
      if (primaryAnalytics.name) updateData.name = primaryAnalytics.name;
      if (primaryAnalytics.description !== undefined)
        updateData.description = primaryAnalytics.description;

      const primaryAnalytic = await tx.primary_analytics.update({
        where: { id: Number(id) },
        data: updateData,
      });

      // Update CCTV connections if provided
      if (cctvId && cctvId.length > 0) {
        await tx.primary_analytics.update({
          where: { id: Number(id) },
          data: {
            cctv: {
              set: cctvId.map((cctvId) => ({ id: cctvId })),
            },
          },
        });
      }

      // Update model has values if provided
      if (primaryAnalytics.modelHasValues !== undefined) {
        // Delete existing values
        await tx.model_has_values.deleteMany({
          where: {
            model_id: Number(id),
            model_type: 'primary',
          },
        });

        // Create new values if provided
        if (primaryAnalytics.modelHasValues.length > 0) {
          await tx.model_has_values.createMany({
            data: primaryAnalytics.modelHasValues.map((value) => ({
              model_id: Number(id),
              model_type: 'primary',
              value_name: value.valueName,
              value: value.value,
            })),
          });
        }
      }

      // Update model has embeds if provided, otherwise create default ones
      if (primaryAnalytics.modelHasEmbeds !== undefined) {
        // Delete existing embeds
        await tx.model_has_embeds.deleteMany({
          where: {
            model_id: Number(id),
          },
        });

        // Create new embeds if provided
        if (primaryAnalytics.modelHasEmbeds.length > 0) {
          await tx.model_has_embeds.createMany({
            data: primaryAnalytics.modelHasEmbeds.map((embed) => ({
              cctv_id: embed.cctvId,
              model_id: Number(id),
              embed: embed.embed,
            })),
          });
        } else {
          // Create default embeds for current CCTVs
          const currentCctvs = await tx.primary_analytics.findUnique({
            where: { id: Number(id) },
            include: { cctv: true },
          });

          if (currentCctvs && currentCctvs.cctv.length > 0) {
            await tx.model_has_embeds.createMany({
              data: currentCctvs.cctv.map((cctv) => ({
                cctv_id: cctv.id,
                model_id: Number(id),
                embed: `https://streamingcctv.gerbangdata.co.id/hls/${cctv.id}-${id}.m3u8`,
              })),
            });
          }
        }
      } else if (cctvId && cctvId.length > 0) {
        // If CCTVs are being updated but embeds are not provided, recreate default embeds
        await tx.model_has_embeds.deleteMany({
          where: {
            model_id: Number(id),
          },
        });

        await tx.model_has_embeds.createMany({
          data: cctvId.map((cctvIdItem) => ({
            cctv_id: cctvIdItem,
            model_id: Number(id),
            embed: `https://streamingcctv.gerbangdata.co.id/hls/${cctvIdItem}-${id}.m3u8`,
          })),
        });
      }

      // Update model has polygons if provided
      if (primaryAnalytics.modelHasPolygons !== undefined) {
        // Delete existing polygons
        await tx.model_has_polygons.deleteMany({
          where: {
            model_id: Number(id),
            model_type: 'primary',
          },
        });

        // Create new polygons if provided
        if (primaryAnalytics.modelHasPolygons.length > 0) {
          await tx.model_has_polygons.createMany({
            data: primaryAnalytics.modelHasPolygons.map((polygon) => ({
              cctv_id: polygon.cctvId,
              model_id: Number(id),
              model_type: 'primary',
              polygon: polygon.polygon,
            })),
          });
        }
      }

      // Update sub analytics if provided
      if (primaryAnalytics.subAnalytics !== undefined) {
        // Delete existing sub analytics
        await tx.sub_analytics.deleteMany({
          where: {
            primary_analytic_id: Number(id),
          },
        });

        // Create new sub analytics if provided
        if (primaryAnalytics.subAnalytics.length > 0) {
          await tx.sub_analytics.createMany({
            data: primaryAnalytics.subAnalytics.map((sub) => ({
              primary_analytic_id: Number(id),
              sub_type_analytic_id: sub.subTypeAnalyticId,
            })),
          });
        }
      }

      return primaryAnalytic;
    });

    // Fetch the updated primary analytic with all related data
    const updatedPrimaryAnalytic = await prisma.primary_analytics.findUnique({
      where: { id: Number(id) },
      include: {
        servers: true,
        type_analytic: true,
        cctv: true,
        sub_analytics: {
          include: {
            sub_type_analytic: true,
          },
        },
        model_has_embeds: true,
        activity_monitoring: true,
        animal_population: true,
      },
    });

    sendSuccessResponse(
      res,
      updatedPrimaryAnalytic,
      'Primary analytic updated successfully'
    );
  } catch (error) {
    console.error('Error updating primary analytic:', error);
    sendInternalErrorResponse(res, 'Failed to update primary analytic');
  }
};

// Delete a primary analytic
export const deletePrimaryAnalytic = async (
  req: Request<GetPrimaryAnalyticParams>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if primary analytic exists
    const existingPrimaryAnalytic = await prisma.primary_analytics.findUnique({
      where: { id: Number(id) },
      include: {
        servers: true,
        type_analytic: true,
      },
    });

    if (!existingPrimaryAnalytic) {
      sendNotFoundResponse(res, 'Primary analytic not found');
      return;
    }

    // Delete primary analytic (related data will be deleted due to cascade)
    await prisma.$transaction(async (tx) => {
      // Release server capacity first (only if server is assigned)
      if (existingPrimaryAnalytic.servers_id) {
        await releaseServerCapacity(
          existingPrimaryAnalytic.servers_id,
          existingPrimaryAnalytic.type_analytic_id,
          1
        );
      }

      // Delete related model has values
      await tx.model_has_values.deleteMany({
        where: {
          model_id: Number(id),
          model_type: 'primary',
        },
      });

      // Delete related model has polygons
      await tx.model_has_polygons.deleteMany({
        where: {
          model_id: Number(id),
          model_type: 'primary',
        },
      });

      // Delete related model has embeds
      await tx.model_has_embeds.deleteMany({
        where: {
          model_id: Number(id),
        },
      });

      // Delete the primary analytic (other related data will be deleted by cascade)
      await tx.primary_analytics.delete({
        where: { id: Number(id) },
      });
    });

    sendSuccessResponse(res, null, 'Primary analytic deleted successfully');
  } catch (error) {
    console.error('Error deleting primary analytic:', error);
    sendInternalErrorResponse(res, 'Failed to delete primary analytic');
  }
};

// Get server capacity status
export const getServerCapacityStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const servers = await prisma.servers.findMany({
      include: {
        primary_analytics: {
          include: {
            type_analytic: true,
          },
        },
      },
    });

    const serverCapacityInfo = servers.map((server) => {
      const analyticsByType = server.primary_analytics.reduce(
        (acc, analytic) => {
          const typeName = analytic.type_analytic.name;
          acc[typeName] = (acc[typeName] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        id: server.id,
        ip: server.ip,
        description: server.description,
        max_activity_monitoring: server.max_activity_monitoring,
        cur_activity_monitoring: server.cur_activity_monitoring,
        availableCapacity:
          server.max_activity_monitoring - server.cur_activity_monitoring,
        utilizationPercentage:
          server.max_activity_monitoring > 0
            ? (
                (server.cur_activity_monitoring /
                  server.max_activity_monitoring) *
                100
              ).toFixed(2)
            : 0,
        totalAnalytics: server.primary_analytics.length,
        analyticsByType,
        status:
          server.cur_activity_monitoring >= server.max_activity_monitoring
            ? 'full'
            : server.cur_activity_monitoring / server.max_activity_monitoring >
                0.8
              ? 'high'
              : 'available',
      };
    });

    sendSuccessResponse(
      res,
      serverCapacityInfo,
      'Server capacity status retrieved successfully'
    );
  } catch (error) {
    console.error('Error fetching server capacity status:', error);
    sendInternalErrorResponse(res, 'Failed to fetch server capacity status');
  }
};

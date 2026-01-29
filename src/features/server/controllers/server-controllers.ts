import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  CreateServerInput,
  UpdateServerInput,
  ServerQueryInput,
} from '../validators/server-validators';
import { handlePagination } from '../../../utils/pagination';
import { handleSearch } from '../../../utils/search';
import { handleSorting } from '../../../utils/sorting';

const prisma = new PrismaClient();

// Get all servers with pagination and search
export const getAllServers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validatedQuery = (req as any).validatedQuery as ServerQueryInput;

    // Build where clause for search
    const whereClause = handleSearch(req, {
      searchFields: ['ip', 'description'],
      searchMode: 'contains',
    });

    // Build order by clause for sorting
    const orderByClause = handleSorting(req, {
      allowedFields: [
        'created_at',
        'updated_at',
        'ip',
        'max_activity_monitoring',
        'cur_activity_monitoring',
      ],
      defaultField: 'created_at',
      defaultOrder: 'desc',
    });

    // Use pagination utility
    const result = await handlePagination(
      req,
      // Count function
      () => prisma.servers.count({ where: whereClause }),
      // Data function
      ({ skip, limit }) =>
        prisma.servers.findMany({
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
            _count: {
              select: {
                primary_analytics: true,
              },
            },
          },
        })
    );

    // Transform data to include analytics_count
    const transformedData = result.data.map((server: any) => ({
      ...server,
      analytics_count: server._count.primary_analytics,
      _count: undefined, // Remove _count from response
    }));

    res.json({
      success: true,
      message: 'Servers retrieved successfully',
      data: transformedData,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching servers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get server by ID
export const getServerById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const server = await prisma.servers.findUnique({
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

    if (!server) {
      res.status(404).json({
        success: false,
        message: 'Server not found',
      });
      return;
    }

    // Transform data to include analytics_count
    const transformedServer = {
      ...server,
      analytics_count: server._count.primary_analytics,
      _count: undefined, // Remove _count from response
    };

    res.json({
      success: true,
      message: 'Server retrieved successfully',
      data: transformedServer,
    });
  } catch (error) {
    console.error('Error fetching server:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Create new server
export const createServer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const serverData: CreateServerInput = req.body;

    // Check if IP already exists
    const existingServer = await prisma.servers.findUnique({
      where: { ip: serverData.ip },
    });

    if (existingServer) {
      res.status(409).json({
        success: false,
        message: 'Server with this IP address already exists',
      });
      return;
    }

    const server = await prisma.servers.create({
      data: serverData,
      include: {
        primary_analytics: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        _count: {
          select: {
            primary_analytics: true,
          },
        },
      },
    });

    // Transform data to include analytics_count
    const transformedServer = {
      ...server,
      analytics_count: server._count.primary_analytics,
      _count: undefined, // Remove _count from response
    };

    res.status(201).json({
      success: true,
      message: 'Server created successfully',
      data: transformedServer,
    });
  } catch (error) {
    console.error('Error creating server:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Update server
export const updateServer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateServerInput = req.body;

    // Check if server exists
    const existingServer = await prisma.servers.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingServer) {
      res.status(404).json({
        success: false,
        message: 'Server not found',
      });
      return;
    }

    // Check if IP is being updated and if it already exists
    if (updateData.ip && updateData.ip !== existingServer.ip) {
      const duplicateServer = await prisma.servers.findUnique({
        where: { ip: updateData.ip },
      });

      if (duplicateServer) {
        res.status(409).json({
          success: false,
          message: 'Server with this IP address already exists',
        });
        return;
      }
    }

    const server = await prisma.servers.update({
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
        _count: {
          select: {
            primary_analytics: true,
          },
        },
      },
    });

    // Transform data to include analytics_count
    const transformedServer = {
      ...server,
      analytics_count: server._count.primary_analytics,
      _count: undefined, // Remove _count from response
    };

    res.json({
      success: true,
      message: 'Server updated successfully',
      data: transformedServer,
    });
  } catch (error) {
    console.error('Error updating server:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Delete server
export const deleteServer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if server exists
    const existingServer = await prisma.servers.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            primary_analytics: true,
          },
        },
      },
    });

    if (!existingServer) {
      res.status(404).json({
        success: false,
        message: 'Server not found',
      });
      return;
    }

    // Check if server has related primary analytics
    if (existingServer._count.primary_analytics > 0) {
      res.status(400).json({
        success: false,
        message:
          'Cannot delete server with active primary analytics. Please remove all related analytics first.',
      });
      return;
    }

    await prisma.servers.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: 'Server deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting server:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get server statistics
export const getServerStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const stats = await prisma.servers.aggregate({
      _count: {
        id: true,
      },
      _sum: {
        max_activity_monitoring: true,
        cur_activity_monitoring: true,
      },
      _avg: {
        max_activity_monitoring: true,
        cur_activity_monitoring: true,
      },
    });

    const activeServers = await prisma.servers.count({
      where: {
        primary_analytics: {
          some: {
            status: 'active',
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Server statistics retrieved successfully',
      data: {
        total_servers: stats._count.id,
        active_servers: activeServers,
        total_max_capacity: stats._sum.max_activity_monitoring || 0,
        total_current_usage: stats._sum.cur_activity_monitoring || 0,
        average_max_capacity: Math.round(
          stats._avg.max_activity_monitoring || 0
        ),
        average_current_usage: Math.round(
          stats._avg.cur_activity_monitoring || 0
        ),
      },
    });
  } catch (error) {
    console.error('Error fetching server statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Check type analytic availability in servers
export const checkTypeAnalyticAvailability = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { typeAnalyticId } = req.params;
    const typeAnalyticIdInt = parseInt(typeAnalyticId);

    // Validate type analytic exists
    const typeAnalytic = await prisma.type_analytic.findUnique({
      where: { id: typeAnalyticIdInt },
    });

    if (!typeAnalytic) {
      res.status(404).json({
        success: false,
        message: 'Type analytic not found',
      });
      return;
    }

    // Only check for activity_monitoring (id: 1)
    if (typeAnalyticIdInt !== 1) {
      res.json({
        success: true,
        message: 'Type analytic availability checked',
        data: {
          typeAnalyticId: typeAnalyticIdInt,
          typeAnalyticName: typeAnalytic.name,
          isSupported: false,
          availableServers: [],
          message:
            'Only activity_monitoring type is currently supported for server allocation',
        },
      });
      return;
    }

    // Find servers with available capacity for activity monitoring
    const servers = await prisma.servers.findMany({
      select: {
        id: true,
        ip: true,
        description: true,
        max_activity_monitoring: true,
        cur_activity_monitoring: true,
        _count: {
          select: {
            primary_analytics: true,
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });

    const availableServers = servers
      .filter(
        (server) =>
          server.cur_activity_monitoring < server.max_activity_monitoring
      )
      .map((server) => ({
        id: server.id,
        ip: server.ip,
        description: server.description,
        maxCapacity: server.max_activity_monitoring,
        currentUsage: server.cur_activity_monitoring,
        availableCapacity:
          server.max_activity_monitoring - server.cur_activity_monitoring,
        totalAnalytics: server._count.primary_analytics,
      }));

    const totalCapacity = servers.reduce(
      (sum, server) => sum + server.max_activity_monitoring,
      0
    );
    const totalUsage = servers.reduce(
      (sum, server) => sum + server.cur_activity_monitoring,
      0
    );

    res.json({
      success: true,
      message: 'Type analytic availability checked successfully',
      data: {
        typeAnalyticId: typeAnalyticIdInt,
        typeAnalyticName: typeAnalytic.name,
        isSupported: true,
        totalServers: servers.length,
        availableServers: availableServers.length,
        totalCapacity,
        totalUsage,
        availableCapacity: totalCapacity - totalUsage,
        servers: availableServers,
      },
    });
  } catch (error) {
    console.error('Error checking type analytic availability:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get server by IP with CCTV and analytics data
export const getServerByIpWithCctvAnalytics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { ip } = req.params;
    const { analyticType, cctvId, index } = req.query;

    // console.log('Query parameters:', { analyticType, cctvId, index });

    // Find server by IP
    const server = await prisma.servers.findUnique({
      where: { ip },
      select: {
        id: true,
        ip: true,
      },
    });

    if (!server) {
      res.status(404).json({
        success: false,
        message: 'Server not found',
      });
      return;
    }

    // Build where clause for CCTV filtering
    const cctvWhereClause: any = {
      primary_analytics: {
        some: {
          servers_id: server.id,
        },
      },
    };

    // Add cctvId filter if provided
    if (cctvId) {
      cctvWhereClause.id = parseInt(cctvId as string);
    }

    // Build primary analytics where clause for analytic type filtering
    const primaryAnalyticsWhereClause: any = {
      servers_id: server.id,
    };

    // Add analyticType filter if provided
    if (analyticType) {
      if (isNaN(parseInt(analyticType as string))) {
        // Filter by type analytic name
        primaryAnalyticsWhereClause.type_analytic = {
          name: {
            contains: analyticType as string,
          },
        };
      } else {
        // Filter by type analytic ID
        primaryAnalyticsWhereClause.type_analytic_id = parseInt(
          analyticType as string
        );
      }
    }

    // Find all CCTVs and their primary analytics for this server
    const cctvData = await prisma.cctv.findMany({
      where: cctvWhereClause,
      include: {
        primary_analytics: {
          where: primaryAnalyticsWhereClause,
          include: {
            type_analytic: {
              select: {
                id: true,
                name: true,
              },
            },
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
          },
        },
        users: {
          select: {
            id: true,
          },
        },
      },
    });

    // Get additional data separately for model_has_polygons and model_has_values
    const analyticsIds = cctvData.flatMap((cctv) =>
      cctv.primary_analytics.map((analytics) => analytics.id)
    );

    const modelPolygons = await prisma.model_has_polygons.findMany({
      where: {
        model_id: { in: analyticsIds },
        model_type: 'primary',
      },
    });

    const modelValues = await prisma.model_has_values.findMany({
      where: {
        model_id: { in: analyticsIds },
        model_type: 'primary',
      },
    });

    // Transform the data to match the expected format
    const transformedCctvData = cctvData.map((cctv) => ({
      id: cctv.id,
      cctv_name: cctv.cctv_name,
      rtsp: cctv.rtsp,
      userId: cctv.users.id,
      primaryAnalytics: cctv.primary_analytics.map((analytics) => ({
        id: analytics.id,
        serverId: analytics.servers_id,
        name: analytics.name,
        status: analytics.status,
        typeAnalytic: {
          id: analytics.type_analytic.id,
          name: analytics.type_analytic.name,
        },
        modelHasPolygons: modelPolygons
          .filter((polygon) => polygon.model_id === analytics.id)
          .map((polygon) => ({
            id: polygon.id,
            cctvId: polygon.cctv_id,
            name: polygon.name,
            polygon: polygon.polygon,
          })),
        modelHasValues: modelValues
          .filter((value) => value.model_id === analytics.id)
          .map((value) => ({
            id: value.id,
            valueName: value.value_name,
            value: value.value,
          })),
        subAnalytics: analytics.sub_analytics.map((subAnalytic) => ({
          subTypeAnalytic: {
            id: subAnalytic.sub_type_analytic.id,
            name: subAnalytic.sub_type_analytic.name,
          },
        })),
      })),
    }));

    // Apply index filter if provided
    let finalCctvData = transformedCctvData;
    if (index !== undefined) {
      const indexNumber = parseInt(index as string);
      if (
        !isNaN(indexNumber) &&
        indexNumber >= 0 &&
        indexNumber < transformedCctvData.length
      ) {
        finalCctvData = [transformedCctvData[indexNumber]];
      } else {
        finalCctvData = [];
      }
    }

    res.json({
      success: true,
      message: 'Server data with CCTV analytics retrieved successfully',
      data: {
        server: {
          id: server.id,
          ip: server.ip,
        },
        cctv: finalCctvData,
        filters: {
          analyticType: analyticType || null,
          cctvId: cctvId ? parseInt(cctvId as string) : null,
          index: index !== undefined ? parseInt(index as string) : null,
        },
        totalCctvCount: transformedCctvData.length,
        filteredCctvCount: finalCctvData.length,
      },
    });
  } catch (error) {
    console.error('Error fetching server by IP with CCTV analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ServerCapacityInfo {
  id: number;
  ip: string;
  description: string | null;
  max_activity_monitoring: number;
  cur_activity_monitoring: number;
  availableCapacity: number;
  utilizationPercentage: number;
}

export interface ServerSelectionOptions {
  requiredCapacity?: number;
  preferredUtilizationThreshold?: number; // 0-100, default 80
  excludeServerIds?: number[];
}

/**
 * Get server capacity information for all servers
 */
export const getServerCapacityInfo = async (): Promise<
  ServerCapacityInfo[]
> => {
  const servers = await prisma.servers.findMany({
    select: {
      id: true,
      ip: true,
      description: true,
      max_activity_monitoring: true,
      cur_activity_monitoring: true,
    },
  });

  return servers.map((server) => ({
    ...server,
    availableCapacity:
      server.max_activity_monitoring - server.cur_activity_monitoring,
    utilizationPercentage:
      server.max_activity_monitoring > 0
        ? (server.cur_activity_monitoring / server.max_activity_monitoring) *
          100
        : 0,
  }));
};

/**
 * Select the best available server based on capacity and utilization
 */
export const selectBestServer = async (
  typeAnalyticId: number,
  options: ServerSelectionOptions = {}
): Promise<ServerCapacityInfo | null> => {
  const {
    requiredCapacity = 1,
    preferredUtilizationThreshold = 80,
    excludeServerIds = [],
  } = options;

  // Get all servers with their capacity info
  const servers = await getServerCapacityInfo();

  // Filter out excluded servers
  const availableServers = servers.filter(
    (server) => !excludeServerIds.includes(server.id)
  );

  // Filter servers that have enough capacity
  const serversWithCapacity = availableServers.filter(
    (server) => server.availableCapacity >= requiredCapacity
  );

  if (serversWithCapacity.length === 0) {
    return null; // No servers with enough capacity
  }

  // For activity monitoring analytics, we need to check specific capacity
  if (typeAnalyticId === 1) {
    // activity_monitoring type
    const activityMonitoringServers = serversWithCapacity.filter(
      (server) => server.max_activity_monitoring > 0
    );

    if (activityMonitoringServers.length === 0) {
      return null;
    }

    // Sort by utilization (lowest first), then by available capacity (highest first)
    return activityMonitoringServers.sort((a, b) => {
      if (a.utilizationPercentage !== b.utilizationPercentage) {
        return a.utilizationPercentage - b.utilizationPercentage;
      }
      return b.availableCapacity - a.availableCapacity;
    })[0];
  }

  // For other analytics types, select server with lowest utilization
  return serversWithCapacity.sort((a, b) => {
    if (a.utilizationPercentage !== b.utilizationPercentage) {
      return a.utilizationPercentage - b.utilizationPercentage;
    }
    return b.availableCapacity - a.availableCapacity;
  })[0];
};

/**
 * Reserve capacity on a server (increment current count)
 */
export const reserveServerCapacity = async (
  serverId: number,
  typeAnalyticId: number,
  capacity: number = 1
): Promise<boolean> => {
  try {
    // For activity monitoring analytics, update the activity monitoring capacity
    if (typeAnalyticId === 1) {
      // activity_monitoring type
      const server = await prisma.servers.findUnique({
        where: { id: serverId },
      });

      if (!server) {
        return false;
      }

      // Check if there's enough capacity
      if (
        server.cur_activity_monitoring + capacity >
        server.max_activity_monitoring
      ) {
        return false;
      }

      // Update the current capacity
      await prisma.servers.update({
        where: { id: serverId },
        data: {
          cur_activity_monitoring: server.cur_activity_monitoring + capacity,
        },
      });
    }

    // For other analytics types, you might want to add additional capacity tracking
    // For now, we'll just return true for non-activity-monitoring analytics
    return true;
  } catch (error) {
    console.error('Error reserving server capacity:', error);
    return false;
  }
};

/**
 * Release capacity on a server (decrement current count)
 */
export const releaseServerCapacity = async (
  serverId: number,
  typeAnalyticId: number,
  capacity: number = 1
): Promise<boolean> => {
  try {
    // For activity monitoring analytics, update the activity monitoring capacity
    if (typeAnalyticId === 1) {
      // activity_monitoring type
      const server = await prisma.servers.findUnique({
        where: { id: serverId },
      });

      if (!server) {
        return false;
      }

      // Update the current capacity (don't go below 0)
      const newCapacity = Math.max(
        0,
        server.cur_activity_monitoring - capacity
      );
      await prisma.servers.update({
        where: { id: serverId },
        data: {
          cur_activity_monitoring: newCapacity,
        },
      });
    }

    // For other analytics types, you might want to add additional capacity tracking
    return true;
  } catch (error) {
    console.error('Error releasing server capacity:', error);
    return false;
  }
};

/**
 * Check if a server has enough capacity for a specific analytic type
 */
export const checkServerCapacity = async (
  serverId: number,
  typeAnalyticId: number,
  requiredCapacity: number = 1
): Promise<boolean> => {
  try {
    const server = await prisma.servers.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      return false;
    }

    // For activity monitoring analytics, check activity monitoring capacity
    if (typeAnalyticId === 1) {
      // activity_monitoring type
      return (
        server.cur_activity_monitoring + requiredCapacity <=
        server.max_activity_monitoring
      );
    }

    // For other analytics types, you might want to add additional capacity checks
    return true;
  } catch (error) {
    console.error('Error checking server capacity:', error);
    return false;
  }
};

/**
 * Get detailed server information including analytics count
 */
export const getServerDetails = async (serverId: number) => {
  const server = await prisma.servers.findUnique({
    where: { id: serverId },
    include: {
      primary_analytics: {
        include: {
          type_analytic: true,
        },
      },
    },
  });

  if (!server) {
    return null;
  }

  // Count analytics by type
  const analyticsByType = server.primary_analytics.reduce(
    (acc, analytic) => {
      const typeName = analytic.type_analytic.name;
      acc[typeName] = (acc[typeName] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    ...server,
    totalAnalytics: server.primary_analytics.length,
    analyticsByType,
    availableCapacity:
      server.max_activity_monitoring - server.cur_activity_monitoring,
    utilizationPercentage:
      server.max_activity_monitoring > 0
        ? (server.cur_activity_monitoring / server.max_activity_monitoring) *
          100
        : 0,
  };
};

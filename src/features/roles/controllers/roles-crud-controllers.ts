import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  CreateRoleInput,
  UpdateRoleInput,
} from '../validators/roles-crud-validators';
import { handlePagination } from '../../../utils/pagination';
import { handleSearch } from '../../../utils/search';
import { handleSorting } from '../../../utils/sorting';

const prisma = new PrismaClient();

// Get all roles with pagination and search
export const getAllRoles = async (
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
      () => prisma.roles.count({ where: whereClause }),
      // Data function
      ({ skip, limit }) =>
        prisma.roles.findMany({
          where: whereClause,
          orderBy: orderByClause,
          skip,
          take: limit,
          include: {
            permissions: true,
            users: true,
          },
        })
    );

    // Format response
    const formattedData = result.data.map((role) => ({
      id: role.id,
      name: role.name,
      createdAt: role.created_at,
      updatedAt: role.updated_at,
      permissions: role.permissions,
      users: role.users.map((user) => ({
        id: user.id,
        email: user.email,
      })),
    }));

    res.status(200).json({
      success: true,
      data: formattedData,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get role by ID
export const getRoleById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const roleId = parseInt(req.params.id, 10);
  try {
    const role = await prisma.roles.findUnique({
      where: { id: roleId },
      include: {
        permissions: true,
        users: true,
      },
    });

    if (!role) {
      res.status(404).json({
        success: false,
        message: 'Role not found',
      });
      return;
    }

    const formattedRole = {
      id: role.id,
      name: role.name,
      createdAt: role.created_at,
      updatedAt: role.updated_at,
      permissions: role.permissions,
      users: role.users.map((user) => ({
        id: user.id,
        email: user.email,
      })),
    };

    res.status(200).json({
      success: true,
      data: formattedRole,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Create a new role
export const createRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validatedData: CreateRoleInput = req.body;

    // Check if role name already exists
    const existingRole = await prisma.roles.findUnique({
      where: { name: validatedData.name },
    });

    if (existingRole) {
      res.status(400).json({
        success: false,
        message: 'Role name already exists',
      });
      return;
    }

    const newRole = await prisma.roles.create({
      data: {
        name: validatedData.name,
      },
    });

    const formattedData = {
      id: newRole.id,
      name: newRole.name,
      createdAt: newRole.created_at,
      updatedAt: newRole.updated_at,
    };

    res.status(201).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Update an existing role
export const updateRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  const roleId = parseInt(req.params.id, 10);
  try {
    const validatedData: UpdateRoleInput = req.body;

    // Check if name is being updated and if it already exists
    if (validatedData.name) {
      const existingRole = await prisma.roles.findFirst({
        where: {
          name: validatedData.name,
          NOT: { id: roleId },
        },
      });
      if (existingRole) {
        res.status(400).json({
          success: false,
          message: 'Role name already exists',
        });
        return;
      }
    }

    const updatedRole = await prisma.roles.update({
      where: { id: roleId },
      data: {
        name: validatedData.name,
      },
    });

    const formattedData = {
      id: updatedRole.id,
      name: updatedRole.name,
      createdAt: updatedRole.created_at,
      updatedAt: updatedRole.updated_at,
    };

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Delete a role
export const deleteRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  const roleId = parseInt(req.params.id, 10);
  try {
    //Check if role exists
    const roleExists = await prisma.roles.findUnique({
      where: { id: roleId },
    });

    if (!roleExists) {
      res.status(404).json({
        success: false,
        message: 'Role not found',
      });
      return;
    }

    await prisma.roles.delete({
      where: { id: roleId },
    });

    res.status(204).json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

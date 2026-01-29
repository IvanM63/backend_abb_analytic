import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  AttachRoleToUserInput,
  DetachRoleFromUserInput,
  BulkAttachRolesToUserInput,
  ReplaceUserRolesInput,
} from '../validators/user-role-validators';

const prisma = new PrismaClient();

// Get user with roles
export const getUserWithRoles = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = parseInt(req.params.userId, 10);

  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const formattedUser = {
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      roles: user.roles.map((role) => ({
        id: role.id,
        name: role.name,
        createdAt: role.created_at,
        updatedAt: role.updated_at,
        permissions: role.permissions,
      })),
    };

    res.status(200).json({
      success: true,
      data: formattedUser,
    });
  } catch (error) {
    console.error('Get user with roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Attach role to user
export const attachRoleToUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validatedData: AttachRoleToUserInput = req.body;
    const { userId, roleId } = validatedData;

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { roles: true },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Check if role exists
    const role = await prisma.roles.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      res.status(404).json({
        success: false,
        message: 'Role not found',
      });
      return;
    }

    // Check if user already has this role
    const existingUserRole = user.roles.find((r) => r.id === roleId);
    if (existingUserRole) {
      res.status(400).json({
        success: false,
        message: 'User already has this role',
      });
      return;
    }

    // Attach role to user
    await prisma.users.update({
      where: { id: userId },
      data: {
        roles: {
          connect: { id: roleId },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Role attached to user successfully',
      data: {
        userId,
        roleId,
        roleName: role.name,
      },
    });
  } catch (error) {
    console.error('Attach role to user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Detach role from user
export const detachRoleFromUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validatedData: DetachRoleFromUserInput = req.body;
    const { userId, roleId } = validatedData;

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { roles: true },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Check if role exists
    const role = await prisma.roles.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      res.status(404).json({
        success: false,
        message: 'Role not found',
      });
      return;
    }

    // Check if user has this role
    const userHasRole = user.roles.find((r) => r.id === roleId);
    if (!userHasRole) {
      res.status(400).json({
        success: false,
        message: 'User does not have this role',
      });
      return;
    }

    // Detach role from user
    await prisma.users.update({
      where: { id: userId },
      data: {
        roles: {
          disconnect: { id: roleId },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Role detached from user successfully',
      data: {
        userId,
        roleId,
        roleName: role.name,
      },
    });
  } catch (error) {
    console.error('Detach role from user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Bulk attach roles to user
export const bulkAttachRolesToUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validatedData: BulkAttachRolesToUserInput = req.body;
    const { userId, roleIds } = validatedData;

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { roles: true },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Check if all roles exist
    const roles = await prisma.roles.findMany({
      where: { id: { in: roleIds } },
    });

    if (roles.length !== roleIds.length) {
      const foundRoleIds = roles.map((r) => r.id);
      const missingRoleIds = roleIds.filter((id) => !foundRoleIds.includes(id));

      res.status(404).json({
        success: false,
        message: 'Some roles not found',
        data: { missingRoleIds },
      });
      return;
    }

    // Filter out roles user already has
    const currentRoleIds = user.roles.map((r) => r.id);
    const newRoleIds = roleIds.filter((id) => !currentRoleIds.includes(id));

    if (newRoleIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'User already has all specified roles',
      });
      return;
    }

    // Attach new roles to user
    await prisma.users.update({
      where: { id: userId },
      data: {
        roles: {
          connect: newRoleIds.map((id) => ({ id })),
        },
      },
    });

    const attachedRoles = roles.filter((r) => newRoleIds.includes(r.id));

    res.status(200).json({
      success: true,
      message: 'Roles attached to user successfully',
      data: {
        userId,
        attachedRoles: attachedRoles.map((r) => ({
          id: r.id,
          name: r.name,
        })),
        skippedRoles: roles
          .filter((r) => currentRoleIds.includes(r.id))
          .map((r) => ({
            id: r.id,
            name: r.name,
            reason: 'User already has this role',
          })),
      },
    });
  } catch (error) {
    console.error('Bulk attach roles to user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Replace user roles (remove all current roles and set new ones)
export const replaceUserRoles = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validatedData: ReplaceUserRolesInput = req.body;
    const { userId, roleIds } = validatedData;

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { roles: true },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // If roleIds is empty, just remove all roles
    if (roleIds.length === 0) {
      await prisma.users.update({
        where: { id: userId },
        data: {
          roles: {
            set: [],
          },
        },
      });

      res.status(200).json({
        success: true,
        message: 'All roles removed from user successfully',
        data: {
          userId,
          previousRoles: user.roles.map((r) => ({ id: r.id, name: r.name })),
          newRoles: [],
        },
      });
      return;
    }

    // Check if all roles exist
    const roles = await prisma.roles.findMany({
      where: { id: { in: roleIds } },
    });

    if (roles.length !== roleIds.length) {
      const foundRoleIds = roles.map((r) => r.id);
      const missingRoleIds = roleIds.filter((id) => !foundRoleIds.includes(id));

      res.status(404).json({
        success: false,
        message: 'Some roles not found',
        data: { missingRoleIds },
      });
      return;
    }

    // Replace user roles
    await prisma.users.update({
      where: { id: userId },
      data: {
        roles: {
          set: roleIds.map((id) => ({ id })),
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'User roles replaced successfully',
      data: {
        userId,
        previousRoles: user.roles.map((r) => ({ id: r.id, name: r.name })),
        newRoles: roles.map((r) => ({ id: r.id, name: r.name })),
      },
    });
  } catch (error) {
    console.error('Replace user roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get users by role
export const getUsersByRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  const roleId = parseInt(req.params.roleId, 10);

  try {
    // Check if role exists
    const role = await prisma.roles.findUnique({
      where: { id: roleId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            created_at: true,
            updated_at: true,
          },
        },
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
      users: role.users.map((user) => ({
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      })),
      userCount: role.users.length,
    };

    res.status(200).json({
      success: true,
      data: formattedRole,
    });
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

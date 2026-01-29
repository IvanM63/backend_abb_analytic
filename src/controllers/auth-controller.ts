import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
} from '../validators/auth-validator';

const prisma = new PrismaClient();

// Extend Request interface locally
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role: Array<{ name: string }>;
    [key: string]: any;
  };
}

// Helper function to hash password using bcrypt
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12; // Higher salt rounds for better security
  return await bcrypt.hash(password, saltRounds);
};

// Helper function to verify password using bcrypt
const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
const generateToken = (userId: number, email: string): string => {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign({ userId, email }, secret, { expiresIn: '24h' });
};

export const register = async (
  req: Request<{}, {}, RegisterInput>,
  res: Response
): Promise<void> => {
  try {
    const { email, password, roleId } = req.body;

    // Log registration attempt for security monitoring
    console.log(`Registration attempt for email: ${email} from IP: ${req.ip}`);

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Log potential security issue
      console.warn(
        `Registration attempt with existing email: ${email} from IP: ${req.ip}`
      );

      res.status(400).json({
        success: false,
        message: 'User with this email already exists',
        code: 'EMAIL_ALREADY_EXISTS',
      });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        roles: roleId
          ? {
              connect: { id: roleId },
            }
          : undefined,
      },
      include: {
        roles: true,
      },
    });

    // Generate token
    const token = generateToken(user.id, user.email);

    // Set HTTP-only cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Log successful registration
    console.log(`User registered successfully: ${email} with ID: ${user.id}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: user.id,
        email: user.email,
        roles: user.roles,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
};

export const login = async (
  req: Request<{}, {}, LoginInput>,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Generate new token
    const token = generateToken(user.id, user.email);

    // Set HTTP-only cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        email: user.email,
        roles: user.roles,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // If no user is authenticated, return success with empty data
    if (!req.user) {
      res.json({
        success: true,
        data: null,
        message: 'No authenticated user',
      });
      return;
    }

    // Get user details
    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        created_at: true,
        updated_at: true,
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      res.json({
        success: true,
        data: null,
        message: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const logout = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    // Clear HTTP-only cookie
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const changePassword = async (
  req: Request<{}, {}, ChangePasswordInput> & AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // Get user from database
    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
      return;
    }

    // Check if new password is different from current password
    const isSamePassword = await verifyPassword(newPassword, user.password);
    if (isSamePassword) {
      res.status(400).json({
        success: false,
        message: 'New password must be different from current password',
      });
      return;
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password in database
    await prisma.users.update({
      where: { id: req.user.id },
      data: {
        password: hashedNewPassword,
      },
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

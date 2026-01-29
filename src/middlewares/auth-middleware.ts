import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface JwtPayload {
  userId: number;
  email: string;
}

// Extend Request interface locally
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role: Array<{ name: string }>;
    [key: string]: any;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from HTTP-only cookie
    const token = req.cookies.auth_token;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
      return;
    }

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as JwtPayload;

    // Get user from database to verify user still exists
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      include: {
        roles: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Set user info in request object
    req.user = {
      id: user.id,
      role: user.roles.map((role: { name: any }) => ({ name: role.name })),
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(403).json({
      success: false,
      message: 'Invalid token',
    });
  }
};

// Optional authentication middleware - doesn't block if no token
export const optionalAuthenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from HTTP-only cookie
    const token = req.cookies.auth_token;

    if (!token) {
      // No token, but continue without setting user
      next();
      return;
    }

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as JwtPayload;

    // Get user from database to verify user still exists
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      include: {
        roles: true,
      },
    });

    if (user) {
      // Set user info in request object if user exists
      req.user = {
        id: user.id,
        role: user.roles.map((role: { name: any }) => ({ name: role.name })),
      };
    }

    next();
  } catch (error) {
    // If token is invalid, continue without setting user
    console.error('Optional auth middleware error:', error);
    next();
  }
};

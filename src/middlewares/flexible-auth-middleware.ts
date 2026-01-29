import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { verifySecurityToken } from './security-middleware';

const prisma = new PrismaClient();

interface JwtPayload {
  userId: number;
  email: string;
}

// Extend Request interface locally
interface FlexibleAuthRequest extends Request {
  user?: {
    id: number;
    role: Array<{ name: string }>;
    [key: string]: any;
  };
  securityToken?: {
    token: string;
    purpose?: string;
    verifiedAt: string;
  };
  authMethod?: 'user_auth' | 'general_token';
}

/**
 * Flexible authentication middleware that accepts either:
 * 1. User authentication token (from cookie) - authenticateToken functionality
 * 2. General security token (from headers) - requireGeneralToken functionality
 *
 * This allows both authenticated users and clients with general tokens to access the route
 */
export const flexibleAuth = async (
  req: FlexibleAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // First, try user authentication (cookie-based)
    const authToken = req.cookies.auth_token;

    if (authToken) {
      try {
        const secret = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(authToken, secret) as JwtPayload;

        // Get user from database to verify user still exists
        const user = await prisma.users.findUnique({
          where: { id: decoded.userId },
          include: {
            roles: true,
          },
        });

        if (user) {
          // Set user info in request object
          req.user = {
            id: user.id,
            role: user.roles.map((role: { name: any }) => ({
              name: role.name,
            })),
          };
          req.authMethod = 'user_auth';
          next();
          return;
        }
      } catch (userAuthError) {
        // User auth failed, try general token
        console.log(
          'User authentication failed, trying general token:',
          userAuthError
        );
      }
    }

    // Second, try general security token (header-based)
    const securityToken =
      (req.headers['x-security-token'] as string) ||
      (req.headers['x-api-token'] as string) ||
      req.headers['authorization']?.replace('Bearer ', '') ||
      (req.headers['x-access-token'] as string);

    if (securityToken) {
      const isValidGeneralToken = verifySecurityToken(securityToken, 'general');

      if (isValidGeneralToken) {
        // Add token info to request for logging/audit
        req.securityToken = {
          token: securityToken.substring(0, 8) + '***', // Only store partial token for security
          purpose: 'general',
          verifiedAt: new Date().toISOString(),
        };
        req.authMethod = 'general_token';
        next();
        return;
      }
    }

    // Both authentication methods failed
    res.status(401).json({
      success: false,
      message:
        'Authentication required. Please provide either a valid user session token or a general access token.',
      code: 'AUTHENTICATION_REQUIRED',
      details: {
        acceptedMethods: [
          'User session token (cookie: auth_token)',
          'General access token (header: x-security-token, x-api-token, authorization, or x-access-token)',
        ],
      },
    });
  } catch (error) {
    console.error('Flexible auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication validation error',
      code: 'AUTH_VALIDATION_ERROR',
    });
  }
};

/**
 * Optional flexible authentication middleware
 * Doesn't block if no authentication is provided, but sets auth info if available
 */
export const optionalFlexibleAuth = async (
  req: FlexibleAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // First, try user authentication (cookie-based)
    const authToken = req.cookies.auth_token;

    if (authToken) {
      try {
        const secret = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(authToken, secret) as JwtPayload;

        // Get user from database to verify user still exists
        const user = await prisma.users.findUnique({
          where: { id: decoded.userId },
          include: {
            roles: true,
          },
        });

        if (user) {
          // Set user info in request object
          req.user = {
            id: user.id,
            role: user.roles.map((role: { name: any }) => ({
              name: role.name,
            })),
          };
          req.authMethod = 'user_auth';
          next();
          return;
        }
      } catch (userAuthError) {
        // User auth failed, try general token
        console.log(
          'User authentication failed, trying general token:',
          userAuthError
        );
      }
    }

    // Second, try general security token (header-based)
    const securityToken =
      (req.headers['x-security-token'] as string) ||
      (req.headers['x-api-token'] as string) ||
      req.headers['authorization']?.replace('Bearer ', '') ||
      (req.headers['x-access-token'] as string);

    if (securityToken) {
      const isValidGeneralToken = verifySecurityToken(securityToken, 'general');

      if (isValidGeneralToken) {
        // Add token info to request for logging/audit
        req.securityToken = {
          token: securityToken.substring(0, 8) + '***', // Only store partial token for security
          purpose: 'general',
          verifiedAt: new Date().toISOString(),
        };
        req.authMethod = 'general_token';
        next();
        return;
      }
    }

    // No valid authentication found, but continue anyway (optional)
    next();
  } catch (error) {
    // If any error occurs, continue without authentication (optional behavior)
    console.error('Optional flexible auth middleware error:', error);
    next();
  }
};

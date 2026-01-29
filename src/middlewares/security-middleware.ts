import { Request, Response, NextFunction } from 'express';

// Extend Request interface to include security token
declare global {
  namespace Express {
    interface Request {
      securityToken?: {
        token: string;
        purpose?: string;
        verifiedAt: string;
      };
    }
  }
}

// Static security tokens from environment variables
const getStaticTokens = (): { [purpose: string]: string[] } => {
  return {
    registration:
      process.env.REGISTRATION_TOKENS?.split(',').map((t) => t.trim()) || [],
    admin: process.env.ADMIN_TOKENS?.split(',').map((t) => t.trim()) || [],
    sensitive:
      process.env.SENSITIVE_TOKENS?.split(',').map((t) => t.trim()) || [],
    general: process.env.GENERAL_TOKENS?.split(',').map((t) => t.trim()) || [],
  };
};

// Verify static security token
export const verifySecurityToken = (
  token: string,
  expectedPurpose?: string
): boolean => {
  try {
    const staticTokens = getStaticTokens();

    // If no specific purpose, check all token types
    if (!expectedPurpose) {
      const allTokens = [
        ...staticTokens.registration,
        ...staticTokens.admin,
        ...staticTokens.sensitive,
        ...staticTokens.general,
      ];
      return allTokens.includes(token);
    }

    // Check specific purpose tokens
    const purposeTokens = staticTokens[expectedPurpose] || [];
    return purposeTokens.includes(token);
  } catch (error) {
    console.error('Security token verification failed:', error);
    return false;
  }
};

// Generic security token middleware
export const requireSecurityToken = (purpose?: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Get token from various possible headers
      const token =
        (req.headers['x-security-token'] as string) ||
        (req.headers['x-api-token'] as string) ||
        req.headers['authorization']?.replace('Bearer ', '') ||
        (req.headers['x-access-token'] as string);

      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Security token is required',
          code: 'MISSING_SECURITY_TOKEN',
        });
        return;
      }

      const isValid = verifySecurityToken(token, purpose);

      if (!isValid) {
        res.status(403).json({
          success: false,
          message: 'Invalid security token',
          code: 'INVALID_SECURITY_TOKEN',
        });
        return;
      }

      // Add token info to request for logging/audit
      req.securityToken = {
        token: token.substring(0, 8) + '***', // Only store partial token for security
        purpose,
        verifiedAt: new Date().toISOString(),
      };

      next();
    } catch (error) {
      console.error('Security token middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Security token validation error',
        code: 'TOKEN_VALIDATION_ERROR',
      });
    }
  };
};

// Specific middleware for registration
export const requireRegistrationToken = requireSecurityToken('registration');

// Specific middleware for admin operations
export const requireAdminToken = requireSecurityToken('admin');

// Specific middleware for sensitive operations
export const requireSensitiveToken = requireSecurityToken('sensitive');

// Specific middleware for general operations
export const requireGeneralToken = requireSecurityToken('general');

// Rate limiting helper (basic implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const identifier = req.ip || 'unknown';
    const now = Date.now();

    const record = rateLimitMap.get(identifier);

    if (!record || now > record.resetTime) {
      rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (record.count >= maxRequests) {
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        code: 'RATE_LIMITED',
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
      return;
    }

    record.count++;
    next();
  };
};

import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: Array<{ name: string }>;
        [key: string]: any;
      };
    }
  }
}

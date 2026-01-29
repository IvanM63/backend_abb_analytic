import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Send a successful response
 */
export const sendSuccessResponse = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  res.status(statusCode).json(response);
};

/**
 * Send an error response
 */
export const sendErrorResponse = (
  res: Response,
  message: string,
  statusCode = 500,
  errors?: Array<{ field: string; message: string }>
): void => {
  const response: ApiResponse = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  res.status(statusCode).json(response);
};

/**
 * Send a validation error response
 */
export const sendValidationErrorResponse = (
  res: Response,
  errors: Array<{ field: string; message: string }>,
  message = 'Validation failed'
): void => {
  sendErrorResponse(res, message, 400, errors);
};

/**
 * Send a not found response
 */
export const sendNotFoundResponse = (
  res: Response,
  message = 'Resource not found'
): void => {
  sendErrorResponse(res, message, 404);
};

/**
 * Send a paginated response
 */
export const sendPaginatedResponse = <T>(
  res: Response,
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  },
  message?: string
): void => {
  const response: ApiResponse<T[]> = {
    success: true,
    data,
    pagination,
  };

  if (message) {
    response.message = message;
  }

  res.status(200).json(response);
};

/**
 * Send an internal server error response
 */
export const sendInternalErrorResponse = (
  res: Response,
  message = 'Internal server error'
): void => {
  sendErrorResponse(res, message, 500);
};

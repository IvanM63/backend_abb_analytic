import { Request } from 'express';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  maxLimit?: number;
  defaultLimit?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Extract and validate pagination parameters from request
 */
export const getPaginationParams = (
  req: Request,
  options: PaginationOptions = {}
): PaginationParams => {
  const { maxLimit = 100, defaultLimit = 10 } = options;

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  let limit = parseInt(req.query.limit as string) || defaultLimit;

  // Ensure limit doesn't exceed maxLimit
  limit = Math.min(limit, maxLimit);
  limit = Math.max(1, limit);

  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
};

/**
 * Create pagination metadata
 */
export const createPaginationMeta = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

/**
 * Create a paginated response
 */
export const createPaginatedResponse = <T>(
  data: T[],
  pagination: PaginationMeta
): PaginatedResponse<T> => {
  return {
    success: true,
    data,
    pagination,
  };
};

/**
 * Complete pagination helper that combines all functions
 */
export const handlePagination = async <T>(
  req: Request,
  countFn: () => Promise<number>,
  dataFn: (params: PaginationParams) => Promise<T[]>,
  options: PaginationOptions = {}
): Promise<PaginatedResponse<T>> => {
  const paginationParams = getPaginationParams(req, options);

  const [total, data] = await Promise.all([
    countFn(),
    dataFn(paginationParams),
  ]);

  const paginationMeta = createPaginationMeta(
    paginationParams.page,
    paginationParams.limit,
    total
  );

  return createPaginatedResponse(data, paginationMeta);
};

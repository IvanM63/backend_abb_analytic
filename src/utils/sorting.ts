import { Request } from 'express';

export interface SortOptions {
  allowedFields?: string[];
  defaultField?: string;
  defaultOrder?: 'asc' | 'desc';
}

export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * Extract and validate sorting parameters from request
 */
export const getSortParams = (
  req: Request,
  options: SortOptions = {}
): SortParams => {
  const {
    allowedFields = ['created_at', 'updated_at', 'name'],
    defaultField = 'created_at',
    defaultOrder = 'desc',
  } = options;

  const sortBy = req.query?.sortBy as string;
  const sortOrder = req.query?.sortOrder as string;

  // Validate sort field
  const field =
    sortBy && allowedFields.includes(sortBy) ? sortBy : defaultField;

  // Validate sort order
  const order =
    sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : defaultOrder;

  return {
    field,
    order,
  };
};

/**
 * Build Prisma orderBy clause from sort parameters
 */
export const buildOrderByClause = (
  sortParams: SortParams
): Record<string, 'asc' | 'desc'> => {
  return {
    [sortParams.field]: sortParams.order,
  };
};

/**
 * Complete sorting helper
 */
export const handleSorting = (
  req: Request,
  options: SortOptions = {}
): Record<string, 'asc' | 'desc'> => {
  const sortParams = getSortParams(req, options);
  return buildOrderByClause(sortParams);
};

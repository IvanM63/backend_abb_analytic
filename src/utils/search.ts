import { Request } from 'express';

export interface SearchOptions {
  searchFields?: string[];
  searchMode?: 'contains' | 'startsWith' | 'endsWith';
}

export interface SearchParams {
  search?: string;
  searchFields: string[];
}

/**
 * Extract search parameters from request
 */
export const getSearchParams = (
  req: Request,
  options: SearchOptions = {}
): SearchParams => {
  const { searchFields = ['name'], searchMode = 'contains' } = options;

  const search = req.query?.search as string;

  return {
    search: search?.trim() || undefined,
    searchFields,
  };
};

/**
 * Build Prisma where clause for search
 */
export const buildSearchWhereClause = (
  searchParams: SearchParams,
  options: SearchOptions = {}
): any => {
  const { search, searchFields } = searchParams;
  const { searchMode = 'contains' } = options;

  if (!search) {
    return {};
  }

  if (searchFields.length === 1) {
    // Single field search
    const field = searchFields[0];
    return {
      [field]: {
        [searchMode]: search,
      },
    };
  }

  // Multiple fields search using OR
  return {
    OR: searchFields.map((field) => ({
      [field]: {
        [searchMode]: search,
      },
    })),
  };
};

/**
 * Complete search helper
 */
export const handleSearch = (
  req: Request,
  options: SearchOptions = {}
): any => {
  const searchParams = getSearchParams(req, options);
  return buildSearchWhereClause(searchParams, options);
};

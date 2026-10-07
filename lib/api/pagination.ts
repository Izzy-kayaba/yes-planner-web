export type Pagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaginatedResult<T> = {
  items: T[];
  pagination: Pagination;
};

export type PaginationParams = {
  page: number;
  pageSize: number;
  skip: number;
};

// Read pagination from a URL and reject unsafe values before they reach MongoDB.
// Returning null lets an API route give the caller a consistent 400 response.
export function parsePagination(
  searchParams: URLSearchParams,
  defaultPageSize = 25,
  maxPageSize = 100,
): PaginationParams | null {
  const pageValue = searchParams.get("page");
  const pageSizeValue = searchParams.get("pageSize");
  const page = pageValue === null ? 1 : Number(pageValue);
  const pageSize = pageSizeValue === null ? defaultPageSize : Number(pageSizeValue);

  // Validate before calculating a database offset to prevent invalid or unsafe queries.
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > maxPageSize ||
    !Number.isSafeInteger((page - 1) * pageSize)
  ) {
    return null;
  }

  return { page, pageSize, skip: (page - 1) * pageSize };
}

// Keep every list response on the same shape so browser screens can share controls.
export function paginatedResult<T>(
  items: T[],
  page: number,
  pageSize: number,
  totalItems: number,
): PaginatedResult<T> {
  const totalPages = Math.ceil(totalItems / pageSize);
  // Empty results have no previous page, even when the requested page number is greater than one.
  return {
    items,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1 && totalPages > 0,
    },
  };
}

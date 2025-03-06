export interface PaginationMeta {
    totalItems: number;
    perPage: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
  }
  
  export interface PaginatedResult<T> {
    data: T[];
    pagination: PaginationMeta;
  }
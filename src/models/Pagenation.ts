// Generic type definition for the hook
export interface SpringBootPage<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      unsorted: boolean;
      sorted: boolean;
    };
  };
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  numberOfElements: number;
  empty: boolean;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
}
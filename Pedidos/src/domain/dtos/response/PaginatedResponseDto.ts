export interface PaginationMetaDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponseDto<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: PaginationMetaDto;
}

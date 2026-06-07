export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function clampPage(page: number, totalPages: number): number {
  return Math.min(Math.max(1, page), totalPages);
}

export function toPaginatedResponse<T>(
  items: T[],
  page: number,
  limit: number,
  total: number,
): PaginatedResponse<T> {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { items, page, limit, total, totalPages };
}

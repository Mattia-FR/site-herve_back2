import { query } from "../../models/db";
import {
  clampPage,
  toPaginatedResponse,
  type PaginatedResponse,
} from "../../types/pagination";

interface PaginateQueryOptions<TRow, T> {
  selectSql: string;
  countSql: string;
  params?: unknown[];
  page: number;
  limit: number;
  mapRow: (row: TRow) => T;
}

export async function paginateQuery<TRow, T>({
  selectSql,
  countSql,
  params = [],
  page,
  limit,
  mapRow,
}: PaginateQueryOptions<TRow, T>): Promise<PaginatedResponse<T>> {
  const countRows = await query<Array<{ total: number }>>(countSql, params);
  const total = Number(countRows[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = clampPage(page, totalPages);
  const offset = (safePage - 1) * limit;

  const rows = await query<TRow[]>(
    `${selectSql} LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  return toPaginatedResponse(rows.map(mapRow), safePage, limit, total);
}

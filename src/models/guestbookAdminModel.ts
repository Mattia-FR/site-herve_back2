import type { ResultSetHeader } from "mysql2";
import type { PaginatedResponse } from "../types/pagination";
import type { GuestbookEntry, GuestbookUpdateData } from "../types/guestbook";
import { paginateQuery } from "../utils/db/paginate";
import pool from "./db";
import {
  GUESTBOOK_SELECT,
  type GuestbookEntryRow,
  findById,
  mapRowToEntry,
} from "./guestbookModel";

const findPaginated = async (
  page: number,
  limit: number,
): Promise<PaginatedResponse<GuestbookEntry>> => {
  return paginateQuery<GuestbookEntryRow, GuestbookEntry>({
    selectSql: `${GUESTBOOK_SELECT} ORDER BY created_at DESC`,
    countSql: "SELECT COUNT(*) AS total FROM guestbook_entries",
    page,
    limit,
    mapRow: mapRowToEntry,
  });
};

const update = async (id: number, data: GuestbookUpdateData): Promise<GuestbookEntry | null> => {
  const entry = await findById(id);
  if (!entry) return null;

  await pool.query<ResultSetHeader>("UPDATE guestbook_entries SET status = ? WHERE id = ?", [
    data.status,
    id,
  ]);
  return findById(id);
};

const deleteById = async (id: number): Promise<boolean> => {
  const [result] = await pool.query<ResultSetHeader>("DELETE FROM guestbook_entries WHERE id = ?", [
    id,
  ]);
  return result.affectedRows > 0;
};

export default { findPaginated, findById, update, deleteById };

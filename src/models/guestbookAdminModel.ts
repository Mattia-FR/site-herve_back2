import type { ResultSetHeader } from "mysql2";
import type { GuestbookEntry, GuestbookUpdateData } from "../types/guestbook";
import pool, { query } from "./db";
import { findById, GUESTBOOK_SELECT, type GuestbookEntryRow, mapRowToEntry } from "./guestbookModel";

const findAll = async (): Promise<GuestbookEntry[]> => {
  const rows = await query<GuestbookEntryRow[]>(`${GUESTBOOK_SELECT} ORDER BY created_at DESC`);
  return rows.map(mapRowToEntry);
};

const update = async (id: number, data: GuestbookUpdateData): Promise<GuestbookEntry | null> => {
  const entry = await findById(id);
  if (!entry) return null;

  await pool.query<ResultSetHeader>(
    "UPDATE guestbook_entries SET status = ? WHERE id = ?",
    [data.status, id],
  );
  return findById(id);
};

const deleteById = async (id: number): Promise<boolean> => {
  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM guestbook_entries WHERE id = ?",
    [id],
  );
  return result.affectedRows > 0;
};

export default { findAll, findById, update, deleteById };

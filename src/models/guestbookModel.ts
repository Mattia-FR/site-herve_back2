import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NotFoundError } from "../errors/AppError";
import type { GuestbookCreateData, GuestbookEntry } from "../types/guestbook";
import { toDateString } from "../utils/string/dateHelpers";
import pool, { query } from "./db";

export interface GuestbookEntryRow extends RowDataPacket {
  id: number;
  author_name: string;
  email: string | null;
  message: string;
  status: GuestbookEntry["status"];
  created_at: Date | string;
}

export const mapRowToEntry = (row: GuestbookEntryRow): GuestbookEntry => ({
  id: row.id,
  author_name: row.author_name,
  email: row.email ?? null,
  message: row.message,
  status: row.status,
  created_at: toDateString(row.created_at) ?? "",
});

export const GUESTBOOK_SELECT =
  "SELECT id, author_name, email, message, status, created_at FROM guestbook_entries";

export const findById = async (id: number): Promise<GuestbookEntry | null> => {
  const rows = await query<GuestbookEntryRow[]>(`${GUESTBOOK_SELECT} WHERE id = ?`, [id]);
  return rows[0] ? mapRowToEntry(rows[0]) : null;
};

const findApproved = async (): Promise<GuestbookEntry[]> => {
  const rows = await query<GuestbookEntryRow[]>(
    `${GUESTBOOK_SELECT} WHERE status = 'approved' ORDER BY created_at DESC`
  );
  return rows.map(mapRowToEntry);
};

const create = async (data: GuestbookCreateData): Promise<GuestbookEntry> => {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO guestbook_entries (author_name, email, message) VALUES (?, ?, ?)",
    [data.author_name, data.email ?? null, data.message]
  );
  const entry = await findById(result.insertId);
  if (!entry) throw new NotFoundError("Entrée");
  return entry;
};

export default { findApproved, findById, create };

/**
 * Model admin — livre d'or (pagination + modération).
 *
 * Rôle : lire toutes les entrées paginées (tous statuts), changer le statut
 * et supprimer les entrées depuis le backoffice.
 * Réutilise GUESTBOOK_SELECT, findById et mapRowToEntry de guestbookModel.ts.
 *
 * Table principale : guestbook_entries
 */
import type { ResultSetHeader } from "mysql2";
import type { GuestbookEntry, GuestbookUpdateData } from "../types/guestbook";
import type { PaginatedResponse } from "../types/pagination";
import { paginateQuery } from "../utils/db/paginate";
import pool from "./db";
import {
  GUESTBOOK_SELECT,
  type GuestbookEntryRow,
  findById,
  mapRowToEntry,
} from "./guestbookModel";

/** Retourne toutes les entrées paginées triées par date de création décroissante. */
const findPaginated = async (
  page: number,
  limit: number
): Promise<PaginatedResponse<GuestbookEntry>> => {
  return paginateQuery<GuestbookEntryRow, GuestbookEntry>({
    selectSql: `${GUESTBOOK_SELECT} ORDER BY created_at DESC`,
    countSql: "SELECT COUNT(*) AS total FROM guestbook_entries",
    page,
    limit,
    mapRow: mapRowToEntry,
  });
};

/**
 * Change le statut d'une entrée (pending → approved / spam).
 * Retourne null si l'entrée n'existe pas.
 */
const update = async (id: number, data: GuestbookUpdateData): Promise<GuestbookEntry | null> => {
  const entry = await findById(id);
  if (!entry) return null;

  await pool.query<ResultSetHeader>("UPDATE guestbook_entries SET status = ? WHERE id = ?", [
    data.status,
    id,
  ]);
  return findById(id);
};

/**
 * Supprime une entrée du livre d'or.
 * @returns true si supprimée, false si introuvable
 */
const deleteById = async (id: number): Promise<boolean> => {
  const [result] = await pool.query<ResultSetHeader>("DELETE FROM guestbook_entries WHERE id = ?", [
    id,
  ]);
  return result.affectedRows > 0;
};

export default { findPaginated, findById, update, deleteById };

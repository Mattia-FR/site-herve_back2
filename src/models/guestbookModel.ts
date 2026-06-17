/**
 * Model public — livre d'or (lecture + création).
 *
 * Rôle : lire les entrées approuvées du livre d'or et enregistrer les nouvelles
 * soumissions. Partagé avec guestbookAdminModel qui réutilise les exports.
 *
 * Les entrées créées ont le statut "pending" par défaut (défaut MySQL).
 * Elles ne sont visibles publiquement qu'après approbation par un admin.
 *
 * Table principale : guestbook_entries
 */
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NotFoundResource } from "../config/errorCodes";
import { NotFoundError } from "../errors/AppError";
import type { GuestbookCreateData, GuestbookEntry } from "../types/guestbook";
import { toDateString } from "../utils/string/dateHelpers";
import pool, { query } from "./db";

/** Interface du résultat SQL brut pour une entrée de livre d'or. */
export interface GuestbookEntryRow extends RowDataPacket {
  id: number;
  author_name: string;
  email: string | null;
  message: string;
  status: GuestbookEntry["status"];
  created_at: Date | string;
}

/** Transforme une ligne SQL brute en objet GuestbookEntry typé. */
export const mapRowToEntry = (row: GuestbookEntryRow): GuestbookEntry => ({
  id: row.id,
  author_name: row.author_name,
  email: row.email ?? null,
  message: row.message,
  status: row.status,
  created_at: toDateString(row.created_at) ?? "",
});

/** Fragment SQL de base exporté pour réutilisation dans guestbookAdminModel. */
export const GUESTBOOK_SELECT =
  "SELECT id, author_name, email, message, status, created_at FROM guestbook_entries";

/** Retourne une entrée par son ID. Exportée pour guestbookAdminModel. */
export const findById = async (id: number): Promise<GuestbookEntry | null> => {
  const rows = await query<GuestbookEntryRow[]>(`${GUESTBOOK_SELECT} WHERE id = ?`, [id]);
  return rows[0] ? mapRowToEntry(rows[0]) : null;
};

/** Retourne toutes les entrées approuvées, triées de la plus récente à la plus ancienne. */
const findApproved = async (): Promise<GuestbookEntry[]> => {
  const rows = await query<GuestbookEntryRow[]>(
    `${GUESTBOOK_SELECT} WHERE status = 'approved' ORDER BY created_at DESC`
  );
  return rows.map(mapRowToEntry);
};

/**
 * Enregistre une nouvelle entrée avec statut "pending" (valeur défaut MySQL).
 * L'email est optionnel (les visiteurs peuvent rester anonymes).
 */
const create = async (data: GuestbookCreateData): Promise<GuestbookEntry> => {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO guestbook_entries (author_name, email, message) VALUES (?, ?, ?)",
    [data.author_name, data.email ?? null, data.message]
  );
  const entry = await findById(result.insertId);
  if (!entry) throw new NotFoundError(NotFoundResource.GUESTBOOK_ENTRY);
  return entry;
};

export default { findApproved, findById, create };

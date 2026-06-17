/**
 * Model — messages de contact (création + lecture).
 *
 * Rôle : créer les messages envoyés via le formulaire de contact et les lire
 * par ID. Ce fichier est partagé entre le controller public (création) et
 * le model admin (qui réutilise MESSAGE_SELECT, findById, mapRowToMessage).
 *
 * Table principale : contact_messages
 */
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NotFoundResource } from "../config/errorCodes";
import { NotFoundError } from "../errors/AppError";
import type { Message, MessageCreateData, MessageStatus } from "../types/messages";
import { toDateString } from "../utils/string/dateHelpers";
import pool, { query } from "./db";

/** Interface du résultat SQL brut pour un message de contact. */
export interface MessageRow extends RowDataPacket {
  id: number;
  firstname: string | null;
  lastname: string | null;
  email: string;
  ip: string | null;
  subject: string;
  text: string;
  status: MessageStatus;
  created_at: Date | string;
}

/** Transforme une ligne SQL brute en objet Message typé. */
export const mapRowToMessage = (row: MessageRow): Message => ({
  id: row.id,
  firstname: row.firstname ?? null,
  lastname: row.lastname ?? null,
  email: row.email,
  ip: row.ip ?? null,
  subject: row.subject,
  text: row.text,
  status: row.status,
  created_at: toDateString(row.created_at) ?? "",
});

/** Fragment SQL de base exporté pour réutilisation dans messagesAdminModel. */
export const MESSAGE_SELECT =
  "SELECT id, firstname, lastname, email, ip, subject, text, status, created_at FROM contact_messages";

/** Retourne un message par son ID. Exporté pour messagesAdminModel. */
export const findById = async (id: number): Promise<Message | null> => {
  const rows = await query<MessageRow[]>(`${MESSAGE_SELECT} WHERE id = ?`, [id]);
  return rows[0] ? mapRowToMessage(rows[0]) : null;
};

/**
 * Enregistre un nouveau message de contact.
 * L'IP est stockée pour faciliter la modération (identification des spammeurs).
 */
const create = async (data: MessageCreateData): Promise<Message> => {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO contact_messages (firstname, lastname, email, ip, subject, text)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.firstname ?? null,
      data.lastname ?? null,
      data.email,
      data.ip ?? null,
      data.subject,
      data.text,
    ]
  );
  const msg = await findById(result.insertId);
  if (!msg) throw new NotFoundError(NotFoundResource.MESSAGE);
  return msg;
};

export default { create, findById };

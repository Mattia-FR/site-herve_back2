/**
 * Model admin — messages de contact (pagination + modération).
 *
 * Rôle : lire la liste paginée des messages, modifier leur statut et les supprimer.
 * Réutilise MESSAGE_SELECT, findById et mapRowToMessage de messagesModel.ts.
 *
 * Table principale : contact_messages
 */
import type { ResultSetHeader } from "mysql2";
import type { Message, MessageStatus, MessageUpdateData } from "../types/messages";
import type { PaginatedResponse } from "../types/pagination";
import { paginateQuery } from "../utils/db/paginate";
import pool from "./db";
import { MESSAGE_SELECT, type MessageRow, findById, mapRowToMessage } from "./messagesModel";

type MessageListStatusFilter = MessageStatus | "received";

/** Retourne les messages paginés triés par date de création décroissante. */
const findPaginated = async (
  page: number,
  limit: number,
  status?: MessageListStatusFilter
): Promise<PaginatedResponse<Message>> => {
  let whereClause = "";
  let params: string[] = [];

  if (status === "received") {
    whereClause = " WHERE status IN ('unread', 'read')";
  } else if (status) {
    whereClause = " WHERE status = ?";
    params = [status];
  }

  return paginateQuery<MessageRow, Message>({
    selectSql: `${MESSAGE_SELECT}${whereClause} ORDER BY created_at DESC`,
    countSql: `SELECT COUNT(*) AS total FROM contact_messages${whereClause}`,
    params,
    page,
    limit,
    mapRow: mapRowToMessage,
  });
};

/**
 * Retourne un message par ID et le marque lu s'il était non lu.
 * Idempotent : archived / spam / read inchangés.
 */
const findByIdAndMarkRead = async (id: number): Promise<Message | null> => {
  await pool.query<ResultSetHeader>(
    "UPDATE contact_messages SET status = 'read' WHERE id = ? AND status = 'unread'",
    [id]
  );
  return findById(id);
};

/**
 * Met à jour le statut d'un message (unread / read / archived / spam).
 * Retourne null si le message n'existe pas.
 */
const update = async (id: number, data: MessageUpdateData): Promise<Message | null> => {
  const msg = await findById(id);
  if (!msg) return null;
  if (data.status === undefined) return msg;

  await pool.query<ResultSetHeader>("UPDATE contact_messages SET status = ? WHERE id = ?", [
    data.status,
    id,
  ]);
  return findById(id);
};

/**
 * Supprime un message par son ID.
 * @returns true si supprimé, false si introuvable
 */
const deleteById = async (id: number): Promise<boolean> => {
  const [result] = await pool.query<ResultSetHeader>("DELETE FROM contact_messages WHERE id = ?", [
    id,
  ]);
  return result.affectedRows > 0;
};

export default { findPaginated, findById, findByIdAndMarkRead, update, deleteById };

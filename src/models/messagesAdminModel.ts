/**
 * Model admin — messages de contact (pagination + modération).
 *
 * Rôle : lire la liste paginée des messages, modifier leur statut et les supprimer.
 * Réutilise MESSAGE_SELECT, findById et mapRowToMessage de messagesModel.ts.
 *
 * Table principale : contact_messages
 */
import type { ResultSetHeader } from "mysql2";
import type { Message, MessageUpdateData } from "../types/messages";
import type { PaginatedResponse } from "../types/pagination";
import { paginateQuery } from "../utils/db/paginate";
import pool from "./db";
import { MESSAGE_SELECT, type MessageRow, findById, mapRowToMessage } from "./messagesModel";

/** Retourne les messages paginés triés par date de création décroissante. */
const findPaginated = async (page: number, limit: number): Promise<PaginatedResponse<Message>> => {
  return paginateQuery<MessageRow, Message>({
    selectSql: `${MESSAGE_SELECT} ORDER BY created_at DESC`,
    countSql: "SELECT COUNT(*) AS total FROM contact_messages",
    page,
    limit,
    mapRow: mapRowToMessage,
  });
};

/**
 * Met à jour le statut d'un message (unread / read / spam).
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

export default { findPaginated, findById, update, deleteById };

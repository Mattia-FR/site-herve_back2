import type { ResultSetHeader } from "mysql2";
import type { Message, MessageUpdateData } from "../types/messages";
import pool, { query } from "./db";
import { MESSAGE_SELECT, type MessageRow, findById, mapRowToMessage } from "./messagesModel";

const findAll = async (): Promise<Message[]> => {
  const rows = await query<MessageRow[]>(`${MESSAGE_SELECT} ORDER BY created_at DESC`);
  return rows.map(mapRowToMessage);
};

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

const deleteById = async (id: number): Promise<boolean> => {
  const [result] = await pool.query<ResultSetHeader>("DELETE FROM contact_messages WHERE id = ?", [
    id,
  ]);
  return result.affectedRows > 0;
};

export default { findAll, findById, update, deleteById };

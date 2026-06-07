import type { ResultSetHeader } from "mysql2";
import type { PaginatedResponse } from "../types/pagination";
import type { Message, MessageUpdateData } from "../types/messages";
import { paginateQuery } from "../utils/db/paginate";
import pool from "./db";
import { MESSAGE_SELECT, type MessageRow, findById, mapRowToMessage } from "./messagesModel";

const findPaginated = async (
  page: number,
  limit: number,
): Promise<PaginatedResponse<Message>> => {
  return paginateQuery<MessageRow, Message>({
    selectSql: `${MESSAGE_SELECT} ORDER BY created_at DESC`,
    countSql: "SELECT COUNT(*) AS total FROM contact_messages",
    page,
    limit,
    mapRow: mapRowToMessage,
  });
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

export default { findPaginated, findById, update, deleteById };

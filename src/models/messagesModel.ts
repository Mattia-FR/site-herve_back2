import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NotFoundError } from "../errors/AppError";
import type { Message, MessageCreateData, MessageStatus } from "../types/messages";
import { toDateString } from "../utils/string/dateHelpers";
import pool, { query } from "./db";

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

export const MESSAGE_SELECT =
  "SELECT id, firstname, lastname, email, ip, subject, text, status, created_at FROM contact_messages";

export const findById = async (id: number): Promise<Message | null> => {
  const rows = await query<MessageRow[]>(`${MESSAGE_SELECT} WHERE id = ?`, [id]);
  return rows[0] ? mapRowToMessage(rows[0]) : null;
};

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
  if (!msg) throw new NotFoundError("Message");
  return msg;
};

export default { create, findById };

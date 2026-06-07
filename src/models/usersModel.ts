import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NotFoundError } from "../errors/AppError";
import type { User, UserCreateData } from "../types/users";
import { toDateString } from "../utils/string/dateHelpers";
import pool, { query } from "./db";

export interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  tagline: string | null;
  bio: string | null;
  profile_image_id: number | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface UserWithPasswordRow extends UserRow {
  password: string;
}

export const mapRowToUser = (row: UserRow): User => ({
  id: row.id,
  username: row.username,
  email: row.email,
  first_name: row.first_name ?? null,
  last_name: row.last_name ?? null,
  tagline: row.tagline ?? null,
  bio: row.bio ?? null,
  profile_image_id: row.profile_image_id ?? null,
  created_at: toDateString(row.created_at) ?? "",
  updated_at: toDateString(row.updated_at) ?? "",
});

export const findById = async (id: number): Promise<User | null> => {
  const rows = await query<UserRow[]>(
    "SELECT id, username, email, first_name, last_name, tagline, bio, profile_image_id, created_at, updated_at FROM users WHERE id = ?",
    [id]
  );
  return rows[0] ? mapRowToUser(rows[0]) : null;
};

const findByEmail = async (email: string): Promise<(User & { password: string }) | null> => {
  const rows = await query<UserWithPasswordRow[]>(
    "SELECT id, username, email, password, first_name, last_name, tagline, bio, profile_image_id, created_at, updated_at FROM users WHERE email = ?",
    [email]
  );
  if (!rows[0]) return null;
  return { ...mapRowToUser(rows[0]), password: rows[0].password };
};

const create = async (data: UserCreateData): Promise<User> => {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    [data.username, data.email, data.password]
  );
  const user = await findById(result.insertId);
  if (!user) throw new NotFoundError("Utilisateur");
  return user;
};

const saveRefreshToken = async (userId: number, tokenHash: string): Promise<void> => {
  await pool.query("UPDATE users SET refresh_token_hash = ? WHERE id = ?", [tokenHash, userId]);
};

interface RefreshTokenRow extends RowDataPacket {
  refresh_token_hash: string | null;
}

const findRefreshTokenHash = async (userId: number): Promise<string | null> => {
  const rows = await query<RefreshTokenRow[]>("SELECT refresh_token_hash FROM users WHERE id = ?", [
    userId,
  ]);
  return rows[0]?.refresh_token_hash ?? null;
};

const clearRefreshToken = async (userId: number): Promise<void> => {
  await pool.query("UPDATE users SET refresh_token_hash = NULL WHERE id = ?", [userId]);
};

const rotateRefreshToken = async (
  userId: number,
  expectedTokenHash: string,
  newTokenHash: string
): Promise<boolean> => {
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE users SET refresh_token_hash = ? WHERE id = ? AND refresh_token_hash = ?",
    [newTokenHash, userId, expectedTokenHash]
  );
  return result.affectedRows === 1;
};

export default {
  findById,
  findByEmail,
  create,
  saveRefreshToken,
  findRefreshTokenHash,
  clearRefreshToken,
  rotateRefreshToken,
};

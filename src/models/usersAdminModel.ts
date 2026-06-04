import type { ResultSetHeader } from "mysql2";
import type { User, UserUpdateData } from "../types/users";
import { buildUpdateQuery } from "../utils/db/buildUpdateQuery";
import pool from "./db";
import { findById } from "./usersModel";

const update = async (id: number, data: UserUpdateData): Promise<User | null> => {
  const user = await findById(id);
  if (!user) return null;

  const q = buildUpdateQuery("users", data);
  if (!q) return user;

  await pool.query<ResultSetHeader>(q.sql, [...q.values, id]);
  return findById(id);
};

export default { update };

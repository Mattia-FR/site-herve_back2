import mysql, { type Pool } from "mysql2/promise";
import { env } from "../config/env";

type PoolQueryParams = Parameters<Pool["query"]>[1];

const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

export async function query<T>(sql: string, params?: PoolQueryParams): Promise<T> {
  const [rows] = await pool.query(sql, params);
  return rows as T;
}

export default pool;

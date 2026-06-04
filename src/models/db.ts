import mysql, { type Pool } from "mysql2/promise";

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  throw new Error("Variables d'environnement de base de données manquantes (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)");
}

type PoolExecuteParams = Parameters<Pool["execute"]>[1];

const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT ? Number(DB_PORT) : 3306,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

export async function query<T>(sql: string, params?: PoolExecuteParams): Promise<T> {
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}

export default pool;

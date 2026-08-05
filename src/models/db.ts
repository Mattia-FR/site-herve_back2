/**
 * Pool de connexions MySQL — instance partagée par tous les models.
 *
 * Rôle : créer et exporter le pool de connexions MySQL2 utilisé dans toute
 * l'application. Un pool gère automatiquement la mise en file d'attente et
 * la réutilisation des connexions.
 *
 * Configuration :
 *   - connectionLimit : 10 connexions simultanées max
 *   - waitForConnections : les requêtes attendent si toutes les connexions sont occupées
 *
 * Export double :
 *   - `pool` (default) : le pool MySQL2 pour les transactions et les requêtes avancées
 *   - `query<T>` (named) : wrapper utilitaire typé pour les requêtes simples (SELECT, INSERT, etc.)
 */
import mysql, { type Pool, type PoolConnection } from "mysql2/promise";
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

/**
 * Wrapper utilitaire pour exécuter une requête SQL typée sur le pool.
 * @param sql    - Requête SQL avec placeholders ?
 * @param params - Paramètres de la requête (protègent contre l'injection SQL)
 * @returns Le résultat de la requête casté vers le type T
 */
export async function query<T>(sql: string, params?: PoolQueryParams): Promise<T> {
  const [rows] = await pool.query(sql, params);
  return rows as T;
}

/**
 * Exécute `fn` dans une transaction MySQL (BEGIN / COMMIT / ROLLBACK).
 * Libère toujours la connexion du pool, même en cas d'erreur.
 */
export async function withTransaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export default pool;

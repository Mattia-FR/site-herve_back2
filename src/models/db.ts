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

export default pool;

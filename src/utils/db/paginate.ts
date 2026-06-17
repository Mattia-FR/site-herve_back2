/**
 * Utilitaire de pagination générique pour les requêtes MySQL.
 *
 * Rôle : exécuter une requête COUNT + une requête SELECT avec LIMIT/OFFSET,
 * et retourner un objet PaginatedResponse<T> contenant les données et les
 * métadonnées de pagination.
 *
 * Fonctionnement :
 *   1. Exécute countSql pour obtenir le nombre total de lignes
 *   2. Calcule le nombre de pages et clamp la page demandée
 *   3. Exécute selectSql avec LIMIT et OFFSET calculés
 *   4. Applique mapRow à chaque ligne pour obtenir les objets typés
 *
 * Utilisé dans tous les models admin qui exposent des listes paginées.
 */
import { query } from "../../models/db";
import { type PaginatedResponse, clampPage, toPaginatedResponse } from "../../types/pagination";

/** Options de la requête paginée. */
interface PaginateQueryOptions<TRow, T> {
  selectSql: string; // requête SELECT complète (sans LIMIT/OFFSET)
  countSql: string; // requête COUNT pour le total
  params?: unknown[]; // paramètres partagés par selectSql et countSql
  page: number; // numéro de page demandé (1-indexé)
  limit: number; // nombre de lignes par page
  mapRow: (row: TRow) => T; // fonction de mapping ligne → type TS
}

/**
 * Exécute une requête paginée et retourne les données avec les métadonnées.
 * La page est automatiquement "clampée" entre 1 et totalPages.
 */
export async function paginateQuery<TRow, T>({
  selectSql,
  countSql,
  params = [],
  page,
  limit,
  mapRow,
}: PaginateQueryOptions<TRow, T>): Promise<PaginatedResponse<T>> {
  // Compter le total d'abord pour calculer le nombre de pages
  const countRows = await query<Array<{ total: number }>>(countSql, params);
  const total = Number(countRows[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  // Évite une page hors limites (ex: page 5 si totalPages = 3)
  const safePage = clampPage(page, totalPages);
  const offset = (safePage - 1) * limit;

  const rows = await query<TRow[]>(`${selectSql} LIMIT ? OFFSET ?`, [...params, limit, offset]);

  return toPaginatedResponse(rows.map(mapRow), safePage, limit, total);
}

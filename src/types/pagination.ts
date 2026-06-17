/**
 * Types et utilitaires pour la pagination des listes.
 *
 * Rôle : définir le contrat de réponse paginée utilisé par toutes les routes
 * admin qui retournent des listes (articles, images, messages, livre d'or).
 *
 * Format de réponse :
 *   { items: T[], page: 2, limit: 20, total: 45, totalPages: 3 }
 *
 * clampPage      : normalise une page demandée entre 1 et totalPages
 * toPaginatedResponse : construit l'objet PaginatedResponse depuis les items
 */

/** Structure de réponse paginée générique. */
export interface PaginatedResponse<T> {
  items: T[];
  page: number; // page actuelle (1-indexée)
  limit: number; // nombre d'items par page
  total: number; // nombre total d'items (toutes pages)
  totalPages: number; // nombre total de pages
}

/**
 * Normalise une page demandée entre 1 et totalPages.
 * Évite les pages hors limites (ex: page -1 ou page 999 si seulement 3 pages).
 */
export function clampPage(page: number, totalPages: number): number {
  return Math.min(Math.max(1, page), totalPages);
}

/**
 * Construit un objet PaginatedResponse à partir des items et des paramètres de pagination.
 * @param items      - Items de la page courante
 * @param page       - Numéro de page (après clamp)
 * @param limit      - Nombre d'items par page
 * @param total      - Nombre total d'items
 */
export function toPaginatedResponse<T>(
  items: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { items, page, limit, total, totalPages };
}

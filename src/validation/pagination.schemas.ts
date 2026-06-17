/**
 * Schémas Zod de validation pour la pagination des listes admin.
 *
 * Rôle : fournir des schémas réutilisables pour les paramètres de pagination
 * (page, limit) des routes GET admin qui retournent des listes paginées.
 *
 * createPaginationQuerySchema : fabrique un schéma avec des limites configurables
 *   → utilisé par chaque router pour créer des schémas adaptés à son endpoint
 * adminPaginationQuerySchema  : instance par défaut (limit: 1-50, défaut 20)
 *
 * Coerce : z.coerce.number() convertit la query string (toujours texte) en nombre.
 */
import { z } from "zod";

/**
 * Fabrique un schéma de pagination avec des limites paramétrables.
 * @param opts.defaultLimit - Valeur de limit si absente de la query
 * @param opts.maxLimit     - Valeur maximale autorisée pour limit
 */
export function createPaginationQuerySchema(opts: {
  defaultLimit: number;
  maxLimit: number;
}) {
  return z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(opts.maxLimit).default(opts.defaultLimit),
  });
}

/** Instance par défaut : page 1, limit 20, max 50 — utilisée par la plupart des routes admin. */
export const adminPaginationQuerySchema = createPaginationQuerySchema({
  defaultLimit: 20,
  maxLimit: 50,
});

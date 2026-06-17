/**
 * Parsing des variantes d'image depuis la base de données.
 *
 * Rôle : normaliser le champ `variants` qui peut être stocké de deux façons :
 *   1. Comme chaîne JSON (stockage MySQL TEXT) → à parser
 *   2. Comme objet JS (si déjà désérialisé par mysql2) → à utiliser tel quel
 *
 * Retourne null en cas de valeur absente, JSON invalide ou type inattendu.
 * Utilisé dans mapRowToImage (imagesModel) et buildVariantUrls (imageUrl).
 */
import type { ImageVariants } from "../../types/images";

/**
 * Normalise les variants depuis une chaîne JSON ou un objet déjà parsé.
 * @param raw - Valeur brute depuis la DB (string JSON, objet, ou null)
 * @returns Objet ImageVariants ou null si absent/invalide
 */
export function parseVariants(raw: string | ImageVariants | null): ImageVariants | null {
  if (!raw) return null;
  if (typeof raw === "object") return raw; // mysql2 peut renvoyer un objet si JSON_COLUMN
  try {
    return JSON.parse(raw) as ImageVariants;
  } catch {
    return null; // JSON corrompu — on retourne null plutôt que de lever une erreur
  }
}

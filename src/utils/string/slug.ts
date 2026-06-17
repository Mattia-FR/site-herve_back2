/**
 * Génération de slugs URL-safe.
 *
 * Rôle : convertir des chaînes de caractères (titres d'articles, noms de
 * catégories) en slugs normalisés, utilisables dans les URLs.
 *
 * Exemples :
 *   buildSlug("Mon processus de création") → "mon-processus-de-creation"
 *   buildSlug("Portraits & Paysages")       → "portraits-paysages"
 *
 * applySlugIfChanged est utilisé dans les models update pour régénérer
 * le slug uniquement si le nom a changé, évitant ainsi d'écraser un slug
 * personnalisé lors d'une mise à jour partielle.
 */
import slugify from "slugify";

/**
 * Génère un slug URL-safe à partir d'une chaîne.
 * - lower: true  → tout en minuscules
 * - strict: true → supprime les caractères non alphanumériques (sauf les tirets)
 */
export function buildSlug(value: string): string {
  return slugify(value, { lower: true, strict: true });
}

/**
 * Met à jour le slug du payload si le nom a changé, sinon retire le champ slug.
 * Évite d'écraser le slug existant lors d'un PATCH sans changement de titre.
 * @param payload      - Objet de données à mettre à jour
 * @param newName      - Nouveau nom (peut être undefined si non fourni)
 * @param existingName - Nom actuel en base
 * @returns Payload avec ou sans champ slug selon si le nom a changé
 */
export function applySlugIfChanged(
  payload: Record<string, unknown>,
  newName: string | undefined,
  existingName: string
): Record<string, unknown> {
  if (newName !== undefined && newName !== existingName) {
    return { ...payload, slug: buildSlug(newName) };
  }
  // Retirer explicitement le slug du payload pour ne pas l'écraser inutilement
  const { slug: _omit, ...rest } = payload;
  return rest;
}

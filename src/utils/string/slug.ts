import slugify from "slugify";

/** Génère un slug URL-safe à partir d'une chaîne. */
export function buildSlug(value: string): string {
  return slugify(value, { lower: true, strict: true });
}

/**
 * Met à jour le slug du payload si le nom a changé, sinon retire le champ slug.
 * Évite d'écraser le slug existant lors d'un PATCH sans changement de titre.
 */
export function applySlugIfChanged(
  payload: Record<string, unknown>,
  newName: string | undefined,
  existingName: string,
): Record<string, unknown> {
  if (newName !== undefined && newName !== existingName) {
    return { ...payload, slug: buildSlug(newName) };
  }
  const { slug: _omit, ...rest } = payload;
  return rest;
}

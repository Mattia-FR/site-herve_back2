import type { ImageVariants } from "../../types/images";

/**
 * Normalise variants depuis une chaîne JSON ou un objet déjà parsé.
 * Retourne null si absent, invalide ou JSON corrompu.
 */
export function parseVariants(raw: string | ImageVariants | null): ImageVariants | null {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw) as ImageVariants;
  } catch {
    return null;
  }
}

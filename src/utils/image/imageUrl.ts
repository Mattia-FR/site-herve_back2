import { env } from "../../config/env";
/**
 * Construction des URLs publiques des images.
 *
 * Rôle : préfixer les chemins relatifs d'images stockés en base (/uploads/...)
 * avec la base URL publique de l'API (IMAGE_BASE_URL) pour obtenir des URLs
 * absolues accessibles par le frontend.
 *
 * IMAGE_BASE_URL peut être différent de API_URL en production si les images
 * sont servies depuis un CDN distinct.
 *
 * Exemple :
 *   buildImageUrl("/uploads/gallery/portrait.jpg")
 *   → "https://api.herve-petit.com/uploads/gallery/portrait.jpg"
 */
import type { ImageVariantUrls, ImageVariants } from "../../types/images";
import { parseVariants } from "./parseVariants";

const IMAGE_BASE_URL = env.IMAGE_BASE_URL;

/**
 * Préfixe un chemin relatif avec la base URL publique de l'API.
 * @param path - Chemin relatif (ex: "/uploads/gallery/img.jpg")
 * @returns URL absolue, ou undefined si le chemin est vide/null
 */
export function buildImageUrl(path: string | null | undefined): string | undefined {
  if (path == null || path === "") return undefined;
  const base = IMAGE_BASE_URL.replace(/\/$/, ""); // supprimer le slash final éventuel
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

/**
 * Construit les URLs publiques des variantes image (thumb, md, lg).
 * Accepte des variants déjà parsés (objet) ou sous forme de chaîne JSON brute.
 * @param raw - Variants depuis la base de données (JSON string ou objet)
 * @returns { thumb, md, lg } avec URLs absolues, ou undefined si absent
 */
export function buildVariantUrls(
  raw: string | ImageVariants | null | undefined
): ImageVariantUrls | undefined {
  const variants = parseVariants(raw ?? null);
  if (!variants) return undefined;
  return {
    thumb: buildImageUrl(variants.thumb),
    md: buildImageUrl(variants.md),
    lg: buildImageUrl(variants.lg),
  };
}

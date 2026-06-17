/**
 * Paramètres de traitement des images.
 *
 * Rôle : centraliser les constantes utilisées par le pipeline Sharp
 * (processImage.ts) pour générer les variantes WebP des images uploadées.
 *
 * IMAGE_MAX_DIMENSION : dimension maximale acceptée en entrée (largeur ou hauteur).
 *   Au-delà, l'image est rejetée avant traitement pour éviter les "image bombs".
 *
 * IMAGE_WEBP_QUALITY : qualité de compression WebP (0-100).
 *   85 offre un bon compromis taille/qualité pour des images artistiques.
 *
 * IMAGE_VARIANT_SIZES : tableau des variantes générées pour chaque image uploadée.
 *   - thumb (400px) : utilisé pour les listes, carrousels, aperçus
 *   - md    (900px) : affiché dans les grilles de galerie
 *   - lg   (1600px) : affiché en plein écran / lightbox
 *   Sharp redimensionne en préservant le ratio d'aspect (fit: "inside").
 */

/** Dimension maximale acceptée en entrée (pixels). Au-delà → rejet. */
export const IMAGE_MAX_DIMENSION = 10_000;

/** Qualité de compression WebP (0–100). */
export const IMAGE_WEBP_QUALITY = 85;

/** Variantes générées par Sharp pour chaque image uploadée. */
export const IMAGE_VARIANT_SIZES = [
  { key: "thumb" as const, width: 400 },
  { key: "md" as const, width: 900 },
  { key: "lg" as const, width: 1600 },
] as const;

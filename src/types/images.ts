/**
 * Types TypeScript — Images.
 *
 * Rôle : définir tous les types liés aux images de la galerie.
 *
 * Hiérarchie :
 *   Image          → données brutes de la table `images` (sans URL)
 *   ImageWithUrl   → étend Image avec les URLs absolues construites depuis path
 *   GalleryImage   → étend ImageWithUrl avec la catégorie associée
 *
 * Variants vs VariantUrls :
 *   ImageVariants    → chemins relatifs stockés en JSON dans la colonne `variants`
 *                      ex: { thumb: "/uploads/gallery/variants/img-thumb.webp", ... }
 *   ImageVariantUrls → URLs absolues construites par buildVariantUrls (avec IMAGE_BASE_URL)
 *                      Tous les champs sont optionnels (absent = variante non générée)
 */

/** Chemins relatifs des variantes WebP (stockés en JSON dans la colonne `variants`). */
export interface ImageVariants {
  thumb: string; // 400px de large
  md: string; // 900px de large
  lg: string; // 1600px de large
}

/** URLs absolues des variantes WebP (construites depuis IMAGE_BASE_URL). */
export interface ImageVariantUrls {
  thumb?: string;
  md?: string;
  lg?: string;
}

/** Données brutes d'une image (correspond à la table `images`). */
export interface Image {
  id: number;
  title: string | null;
  description: string | null;
  path: string; // chemin relatif, ex: "/uploads/gallery/portrait.jpg"
  is_in_gallery: boolean; // visible dans la galerie publique
  display_order: number; // ordre d'affichage dans la galerie (tri ASC)
  user_id: number;
  article_id: number | null; // ID de l'article associé (ou null si image autonome)
  category_id: number | null; // ID de la galerie d'appartenance (null si non catégorisée)
  variants?: ImageVariants | null; // chemins des variantes WebP
  created_at: string;
  updated_at: string;
}

/** Image avec URLs absolues (retournée par l'API). */
export interface ImageWithUrl extends Image {
  imageUrl?: string; // URL absolue de l'image originale
  variantUrls?: ImageVariantUrls; // URLs absolues des variantes WebP
}

/** Image de galerie avec sa catégorie associée. */
export interface GalleryImage extends ImageWithUrl {
  categories: { id: number; name: string }[];
}

/** Données pour créer une image (utilisées par imagesAdminModel.create). */
export interface ImageCreateData {
  title?: string | null;
  description?: string | null;
  path: string;
  is_in_gallery?: boolean;
  display_order?: number;
  user_id: number;
  article_id?: number | null;
  category_id?: number | null;
  variants?: ImageVariants | null; // sérialisé en JSON pour le stockage MySQL
}

/** Données partielles pour mettre à jour les métadonnées d'une image. */
export interface ImageUpdateData {
  title?: string | null;
  description?: string | null;
  is_in_gallery?: boolean;
  display_order?: number;
  article_id?: number | null;
  category_id?: number | null;
  path?: string;
  variants?: ImageVariants | null;
}

/**
 * Types TypeScript — Catégories d'images.
 *
 * Rôle : définir le contrat des catégories utilisées pour organiser
 * la galerie d'images.
 *
 * CategoryCoverImage : première image de la catégorie (affichée comme couverture)
 * Category           : catégorie complète avec compteur et couverture
 * CategoryCreateData : données pour créer une catégorie
 * CategoryUpdateData : données partielles pour mettre à jour une catégorie
 */
import type { ImageVariantUrls } from "./images";

/** Image de couverture d'une catégorie (première image de la galerie dans cette catégorie). */
export interface CategoryCoverImage {
  imageUrl: string;
  alt_descr: string | null;
  variantUrls?: ImageVariantUrls;
}

/** Catégorie complète retournée par l'API. */
export interface Category {
  id: number;
  name: string;
  slug: string;
  display_order: number; // ordre d'affichage dans la navigation
  created_at: string;
  image_count: number; // nombre d'images en galerie (is_in_gallery = true)
  cover_image: CategoryCoverImage | null; // null si aucune image en galerie
}

/** Données pour créer une catégorie. Le slug est généré automatiquement depuis name. */
export interface CategoryCreateData {
  name: string;
  display_order?: number;
}

/** Données partielles pour mettre à jour une catégorie. */
export interface CategoryUpdateData {
  name?: string;
  display_order?: number;
  slug?: string; // géré automatiquement par applySlugIfChanged
}

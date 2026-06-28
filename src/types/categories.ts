/**
 * Types TypeScript — Catégories d'images (= Galeries).
 *
 * Rôle : définir le contrat des catégories utilisées pour organiser
 * la galerie d'images.
 *
 * CategoryCoverImage : image de couverture (manuelle via cover_image_id ou
 *                      première image par display_order)
 * Category           : catégorie complète avec compteur, couverture et cover_image_id
 * CategoryCreateData : données pour créer une catégorie
 * CategoryUpdateData : données partielles pour mettre à jour une catégorie
 */
import type { ImageVariantUrls } from "./images";

/** Image de couverture d'une catégorie. */
export interface CategoryCoverImage {
  imageUrl: string;
  variantUrls?: ImageVariantUrls;
}

/** Catégorie complète retournée par l'API. */
export interface Category {
  id: number;
  name: string;
  slug: string;
  display_order: number; // ordre d'affichage dans la navigation
  cover_image_id: number | null; // ID de l'image de couverture choisie manuellement
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
  cover_image_id?: number | null;
}

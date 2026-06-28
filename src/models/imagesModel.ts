/**
 * Model public — images de la galerie.
 *
 * Rôle : lire les images depuis la base MySQL pour les pages publiques
 * (galerie filtrée par catégorie, carrousel).
 *
 * Ce fichier exporte également les types, interfaces et fonctions utilitaires
 * réutilisés par imagesAdminModel.ts pour éviter la duplication.
 *
 * Table principale : images
 * Jointure : categories (via images.category_id — relation 1:N directe)
 *
 * Tri : display_order ASC (ordre choisi par l'artiste) avec id ASC en tiebreaker.
 */
import type { RowDataPacket } from "mysql2";
import type { GalleryImage, Image, ImageVariants, ImageWithUrl } from "../types/images";
import { buildImageUrl, buildVariantUrls } from "../utils/image/imageUrl";
import { parseVariants } from "../utils/image/parseVariants";
import { toDateString } from "../utils/string/dateHelpers";
import { query } from "./db";

/** Interface du résultat SQL brut pour une image (sans catégorie). */
export interface ImageRow extends RowDataPacket {
  id: number;
  title: string | null;
  description: string | null;
  path: string;
  is_in_gallery: number | boolean;
  display_order: number;
  user_id: number;
  article_id: number | null;
  category_id: number | null;
  variants: string | ImageVariants | null;
  created_at: Date | string;
  updated_at: Date | string;
}

/** Étend ImageRow avec la catégorie associée via LEFT JOIN. */
export interface GalleryImageRow extends ImageRow {
  category_name: string | null;
}

/** Transforme une ligne SQL brute en objet Image typé (sans URL). */
export const mapRowToImage = (row: ImageRow): Image => ({
  id: row.id,
  title: row.title ?? null,
  description: row.description ?? null,
  path: row.path,
  is_in_gallery: Boolean(row.is_in_gallery),
  display_order: row.display_order ?? 0,
  user_id: row.user_id,
  article_id: row.article_id ?? null,
  category_id: row.category_id ?? null,
  variants: parseVariants(row.variants),
  created_at: toDateString(row.created_at) ?? "",
  updated_at: toDateString(row.updated_at) ?? "",
});

/** Ajoute l'URL absolue et les URLs de variantes à un objet Image. */
export const mapToImageWithUrl = (img: Image): ImageWithUrl => ({
  ...img,
  imageUrl: buildImageUrl(img.path),
  variantUrls: buildVariantUrls(img.variants),
});

/** Fragments SQL de base pour sélectionner tous les champs d'une image. */
export const IMAGE_BASE_SELECT =
  "SELECT id, title, description, path, is_in_gallery, display_order, user_id, article_id, category_id, variants, created_at, updated_at FROM images";

/** Nombre d'images retournées par le carrousel. */
const CAROUSEL_LIMIT = 6;

/**
 * SELECT pour la galerie avec la catégorie associée (JOIN direct via category_id).
 * Plus simple que l'ancien GROUP_CONCAT — une image = une ligne, une catégorie max.
 */
const GALLERY_SELECT = `
  SELECT i.id, i.title, i.description, i.path, i.is_in_gallery,
         i.display_order, i.user_id, i.article_id, i.category_id, i.variants,
         i.created_at, i.updated_at,
         c.name AS category_name
  FROM images i
  LEFT JOIN categories c ON i.category_id = c.id`;

/** Transforme les lignes de galerie en objets GalleryImage. */
function mapGalleryRows(rows: GalleryImageRow[]): GalleryImage[] {
  return rows.map((r) => {
    const img = mapToImageWithUrl(mapRowToImage(r));
    const categories =
      r.category_id != null ? [{ id: r.category_id, name: r.category_name ?? "" }] : [];
    return { ...img, categories };
  });
}

/** Retourne une image par son ID (avec URL). Exportée pour réutilisation dans imagesAdminModel. */
export const findById = async (id: number): Promise<ImageWithUrl | null> => {
  const rows = await query<ImageRow[]>(`${IMAGE_BASE_SELECT} WHERE id = ?`, [id]);
  return rows[0] ? mapToImageWithUrl(mapRowToImage(rows[0])) : null;
};

/**
 * Retourne les images de la galerie (is_in_gallery = 1), triées par display_order ASC.
 * @param categorySlug - Filtre optionnel par slug de catégorie
 */
const findByGallery = async (categorySlug?: string): Promise<GalleryImage[]> => {
  let sql = `${GALLERY_SELECT} WHERE i.is_in_gallery = 1`;
  const params: string[] = [];

  if (categorySlug) {
    sql += " AND c.slug = ?";
    params.push(categorySlug);
  }

  sql += " ORDER BY i.display_order ASC, i.id ASC";
  const rows = await query<GalleryImageRow[]>(sql, params);
  return mapGalleryRows(rows);
};

/** Retourne les premières images de la galerie pour le carrousel (les plus récentes). */
const findCarouselPreview = async (limit = CAROUSEL_LIMIT): Promise<GalleryImage[]> => {
  const sql = `${GALLERY_SELECT}
    WHERE i.is_in_gallery = 1
    ORDER BY i.created_at DESC
    LIMIT ?`;
  const rows = await query<GalleryImageRow[]>(sql, [limit]);
  return mapGalleryRows(rows);
};

export default { findById, findByGallery, findCarouselPreview };

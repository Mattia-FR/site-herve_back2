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
 * Jointures : images_categories, categories (pour les catégories et la cover)
 *
 * Technique GROUP_CONCAT : les catégories d'une image sont agrégées en deux
 * chaînes séparées par "," (IDs et noms) puis découpées côté JS dans mapGalleryRows.
 */
import type { RowDataPacket } from "mysql2";
import type { GalleryImage, Image, ImageVariants, ImageWithUrl } from "../types/images";
import { buildImageUrl, buildVariantUrls } from "../utils/image/imageUrl";
import { parseVariants } from "../utils/image/parseVariants";
import { toDateString } from "../utils/string/dateHelpers";
import { query } from "./db";

/** Interface du résultat SQL brut pour une image (sans catégories). */
export interface ImageRow extends RowDataPacket {
  id: number;
  title: string | null;
  description: string | null;
  path: string;
  alt_descr: string | null;
  is_in_gallery: number | boolean;
  display_order: number;
  user_id: number;
  article_id: number | null;
  variants: string | ImageVariants | null;
  created_at: Date | string;
  updated_at: Date | string;
}

/** Étend ImageRow avec les catégories agrégées via GROUP_CONCAT. */
export interface GalleryImageRow extends ImageRow {
  category_ids: string | null; // ex: "1,2,3"
  category_names: string | null; // ex: "Portraits,Paysages,Projets"
}

/** Transforme une ligne SQL brute en objet Image typé (sans URL). */
export const mapRowToImage = (row: ImageRow): Image => ({
  id: row.id,
  title: row.title ?? null,
  description: row.description ?? null,
  path: row.path,
  alt_descr: row.alt_descr ?? null,
  is_in_gallery: Boolean(row.is_in_gallery),
  display_order: row.display_order ?? 0,
  user_id: row.user_id,
  article_id: row.article_id ?? null,
  variants: parseVariants(row.variants), // parse le JSON stocké en colonne TEXT
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
  "SELECT id, title, description, path, alt_descr, is_in_gallery, display_order, user_id, article_id, variants, created_at, updated_at FROM images";

/** Nombre d'images retournées par le carrousel. */
const CAROUSEL_LIMIT = 6;

/** SELECT pour la galerie avec catégories agrégées (GROUP_CONCAT). */
const GALLERY_SELECT = `
  SELECT i.id, i.title, i.description, i.path, i.alt_descr, i.is_in_gallery,
         i.display_order, i.user_id, i.article_id, i.variants, i.created_at, i.updated_at,
         GROUP_CONCAT(c.id ORDER BY c.display_order SEPARATOR ',') AS category_ids,
         GROUP_CONCAT(c.name ORDER BY c.display_order SEPARATOR ',') AS category_names
  FROM images i
  LEFT JOIN images_categories ic ON i.id = ic.image_id
  LEFT JOIN categories c ON ic.category_id = c.id`;

/**
 * Transforme les lignes de galerie (avec GROUP_CONCAT) en objets GalleryImage
 * incluant le tableau de catégories { id, name }.
 */
function mapGalleryRows(rows: GalleryImageRow[]): GalleryImage[] {
  return rows.map((r) => {
    const img = mapToImageWithUrl(mapRowToImage(r));
    // Découpage des chaînes GROUP_CONCAT en tableaux
    const ids = r.category_ids ? String(r.category_ids).split(",").map(Number) : [];
    const names = r.category_names ? String(r.category_names).split(",") : [];
    return {
      ...img,
      categories: ids.map((id, i) => ({ id, name: names[i] ?? "" })),
    };
  });
}

/** Retourne une image par son ID (avec URL). Exportée pour réutilisation dans imagesAdminModel. */
export const findById = async (id: number): Promise<ImageWithUrl | null> => {
  const rows = await query<ImageRow[]>(`${IMAGE_BASE_SELECT} WHERE id = ?`, [id]);
  return rows[0] ? mapToImageWithUrl(mapRowToImage(rows[0])) : null;
};

/**
 * Retourne les images de la galerie (is_in_gallery = 1).
 * @param categorySlug - Filtre optionnel par slug de catégorie
 */
const findByGallery = async (categorySlug?: string): Promise<GalleryImage[]> => {
  let sql = `${GALLERY_SELECT} WHERE i.is_in_gallery = 1`;
  const params: string[] = [];

  if (categorySlug) {
    // Sous-requête EXISTS pour filtrer sur le slug de catégorie sans perturber le GROUP_CONCAT
    sql += ` AND EXISTS (
      SELECT 1 FROM images_categories ic2
      JOIN categories c2 ON ic2.category_id = c2.id
      WHERE ic2.image_id = i.id AND c2.slug = ?
    )`;
    params.push(categorySlug);
  }

  sql += " GROUP BY i.id ORDER BY i.display_order ASC, i.created_at DESC";
  const rows = await query<GalleryImageRow[]>(sql, params);
  return mapGalleryRows(rows);
};

/** Retourne les premières images de la galerie pour le carrousel. */
const findCarouselPreview = async (limit = CAROUSEL_LIMIT): Promise<GalleryImage[]> => {
  const sql = `${GALLERY_SELECT}
    WHERE i.is_in_gallery = 1
    GROUP BY i.id ORDER BY i.display_order ASC, i.created_at DESC
    LIMIT ?`;
  const rows = await query<GalleryImageRow[]>(sql, [limit]);
  return mapGalleryRows(rows);
};

export default { findById, findByGallery, findCarouselPreview };

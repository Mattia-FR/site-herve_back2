/**
 * Model public — catégories.
 *
 * Rôle : lire les catégories avec leur compteur d'images en galerie et leur image
 * de couverture (première image de la catégorie selon display_order).
 *
 * Exporte également mapRowToCategory et findById pour réutilisation dans
 * categoriesAdminModel.ts.
 *
 * Technique : Les compteurs et la cover sont calculés via des sous-requêtes SQL
 * scalaires plutôt que des jointures pour éviter la multiplication des lignes
 * (une seule ligne par catégorie dans le résultat).
 *
 * Table principale : categories
 */
import type { RowDataPacket } from "mysql2";
import type { Category, CategoryCoverImage } from "../types/categories";
import { buildImageUrl, buildVariantUrls } from "../utils/image/imageUrl";
import { toDateString } from "../utils/string/dateHelpers";
import { query } from "./db";

/** Interface du résultat SQL brut pour une catégorie avec cover et compteur. */
export interface CategoryRow extends RowDataPacket {
  id: number;
  name: string;
  slug: string;
  display_order: number;
  created_at: Date | string;
  image_count: number; // nombre d'images en galerie pour cette catégorie
  cover_path: string | null; // chemin de la première image (cover)
  cover_variants: string | null;
  cover_alt_descr: string | null;
}

/**
 * Construit l'objet image de couverture depuis les colonnes de cover.
 * Retourne null si la catégorie n'a pas d'image en galerie.
 */
const mapCoverImage = (
  path: string | null,
  variantsRaw: string | null,
  altDescr: string | null
): CategoryCoverImage | null => {
  if (!path) return null;
  const imageUrl = buildImageUrl(path);
  if (!imageUrl) return null;

  const variantUrls = buildVariantUrls(variantsRaw);
  const cover: CategoryCoverImage = { imageUrl, alt_descr: altDescr ?? null };

  if (variantUrls) {
    cover.variantUrls = variantUrls;
  }

  return cover;
};

/** Transforme une ligne SQL brute en objet Category typé. */
export const mapRowToCategory = (row: CategoryRow): Category => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  display_order: row.display_order ?? 0,
  created_at: toDateString(row.created_at) ?? "",
  image_count: Number(row.image_count) || 0,
  cover_image: mapCoverImage(row.cover_path, row.cover_variants, row.cover_alt_descr),
});

/**
 * Fragment SQL commun : sélectionne les catégories avec compteur d'images
 * et image de couverture (via sous-requêtes scalaires).
 * La cover est la première image visible en galerie (display_order ASC, puis created_at DESC).
 */
const CATEGORY_SELECT = `
  SELECT
    c.id, c.name, c.slug, c.display_order, c.created_at,
    (
      SELECT COUNT(*)
      FROM images_categories ic
      JOIN images i ON i.id = ic.image_id
      WHERE ic.category_id = c.id AND i.is_in_gallery = 1
    ) AS image_count,
    (
      SELECT i.path FROM images_categories ic JOIN images i ON i.id = ic.image_id
      WHERE ic.category_id = c.id AND i.is_in_gallery = 1
      ORDER BY i.display_order ASC, i.created_at DESC LIMIT 1
    ) AS cover_path,
    (
      SELECT i.variants FROM images_categories ic JOIN images i ON i.id = ic.image_id
      WHERE ic.category_id = c.id AND i.is_in_gallery = 1
      ORDER BY i.display_order ASC, i.created_at DESC LIMIT 1
    ) AS cover_variants,
    (
      SELECT i.alt_descr FROM images_categories ic JOIN images i ON i.id = ic.image_id
      WHERE ic.category_id = c.id AND i.is_in_gallery = 1
      ORDER BY i.display_order ASC, i.created_at DESC LIMIT 1
    ) AS cover_alt_descr
  FROM categories c`;

/** Retourne une catégorie par son ID. Exportée pour categoriesAdminModel. */
export const findById = async (id: number): Promise<Category | null> => {
  const rows = await query<CategoryRow[]>(`${CATEGORY_SELECT} WHERE c.id = ?`, [id]);
  return rows[0] ? mapRowToCategory(rows[0]) : null;
};

/** Retourne toutes les catégories triées par display_order puis par ID. */
const findAll = async (): Promise<Category[]> => {
  const rows = await query<CategoryRow[]>(
    `${CATEGORY_SELECT} ORDER BY c.display_order ASC, c.id ASC`
  );
  return rows.map(mapRowToCategory);
};

export default { findAll, findById };

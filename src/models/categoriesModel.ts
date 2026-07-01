/**
 * Model public — catégories (= galeries).
 *
 * Rôle : lire les catégories avec leur compteur d'images en galerie et leur image
 * de couverture.
 *
 * Couverture : cover_image_id si défini manuellement, sinon première image de la
 * catégorie selon display_order ASC.
 *
 * Exporte également mapRowToCategory et findById pour réutilisation dans
 * categoriesAdminModel.ts.
 *
 * Table principale : categories
 * Jointure : images (via categories.cover_image_id ou sous-requête display_order)
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
  cover_image_id: number | null;
  created_at: Date | string;
  image_count: number;
  cover_path: string | null;
  cover_variants: string | null;
}

/**
 * Construit l'objet image de couverture depuis les colonnes de cover.
 * Retourne null si la catégorie n'a pas d'image en galerie.
 */
const mapCoverImage = (
  path: string | null,
  variantsRaw: string | null
): CategoryCoverImage | null => {
  if (!path) return null;
  const imageUrl = buildImageUrl(path);
  if (!imageUrl) return null;

  const variantUrls = buildVariantUrls(variantsRaw);
  const cover: CategoryCoverImage = { imageUrl };

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
  cover_image_id: row.cover_image_id ?? null,
  created_at: toDateString(row.created_at) ?? "",
  image_count: Number(row.image_count) || 0,
  cover_image: mapCoverImage(row.cover_path, row.cover_variants),
});

/**
 * Fragment SQL commun : sélectionne les catégories avec compteur d'images
 * et image de couverture.
 *
 * Couverture : JOIN sur cover_image_id si défini, sinon sur la première image
 * de la catégorie (display_order ASC, id ASC).
 * Le COALESCE(c.cover_image_id, sous-requête) résout l'ID de la cover dans un seul JOIN.
 */
const CATEGORY_SELECT = `
  SELECT
    c.id, c.name, c.slug, c.display_order, c.cover_image_id, c.created_at,
    (
      SELECT COUNT(*)
      FROM images i
      WHERE i.category_id = c.id AND i.is_in_gallery = 1
    ) AS image_count,
    cover.path       AS cover_path,
    cover.variants   AS cover_variants
  FROM categories c
  LEFT JOIN images cover ON cover.id = COALESCE(
    c.cover_image_id,
    (
      SELECT id FROM images
      WHERE category_id = c.id AND is_in_gallery = 1
      ORDER BY display_order ASC, id ASC
      LIMIT 1
    )
  )`;

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

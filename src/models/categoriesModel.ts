import type { RowDataPacket } from "mysql2";
import type { Category, CategoryCoverImage } from "../types/categories";
import { buildImageUrl } from "../utils/image/imageUrl";
import { parseVariants } from "../utils/image/parseVariants";
import { toDateString } from "../utils/string/dateHelpers";
import { query } from "./db";

export interface CategoryRow extends RowDataPacket {
  id: number;
  name: string;
  slug: string;
  display_order: number;
  created_at: Date | string;
  image_count: number;
  cover_path: string | null;
  cover_variants: string | null;
  cover_alt_descr: string | null;
}

const mapCoverImage = (
  path: string | null,
  variantsRaw: string | null,
  altDescr: string | null,
): CategoryCoverImage | null => {
  if (!path) return null;
  const imageUrl = buildImageUrl(path);
  if (!imageUrl) return null;

  const variants = parseVariants(variantsRaw);
  const cover: CategoryCoverImage = { imageUrl, alt_descr: altDescr ?? null };

  if (variants) {
    cover.variantUrls = {
      thumb: buildImageUrl(variants.thumb) ?? variants.thumb,
      md: buildImageUrl(variants.md) ?? variants.md,
      lg: buildImageUrl(variants.lg) ?? variants.lg,
    };
  }

  return cover;
};

export const mapRowToCategory = (row: CategoryRow): Category => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  display_order: row.display_order ?? 0,
  created_at: toDateString(row.created_at) ?? "",
  image_count: Number(row.image_count) || 0,
  cover_image: mapCoverImage(row.cover_path, row.cover_variants, row.cover_alt_descr),
});

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

export const findById = async (id: number): Promise<Category | null> => {
  const rows = await query<CategoryRow[]>(`${CATEGORY_SELECT} WHERE c.id = ?`, [id]);
  return rows[0] ? mapRowToCategory(rows[0]) : null;
};

const findAll = async (): Promise<Category[]> => {
  const rows = await query<CategoryRow[]>(`${CATEGORY_SELECT} ORDER BY c.display_order ASC, c.id ASC`);
  return rows.map(mapRowToCategory);
};

export default { findAll, findById };

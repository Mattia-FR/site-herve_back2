import type { RowDataPacket } from "mysql2";
import type { GalleryImage, Image, ImageVariants, ImageWithUrl } from "../types/images";
import { buildImageUrl } from "../utils/image/imageUrl";
import { parseVariants } from "../utils/image/parseVariants";
import { toDateString } from "../utils/string/dateHelpers";
import { query } from "./db";

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

export interface GalleryImageRow extends ImageRow {
  category_ids: string | null;
  category_names: string | null;
}

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
  variants: parseVariants(row.variants),
  created_at: toDateString(row.created_at) ?? "",
  updated_at: toDateString(row.updated_at) ?? "",
});

export const mapToImageWithUrl = (img: Image): ImageWithUrl => {
  const v = img.variants;
  return {
    ...img,
    imageUrl: buildImageUrl(img.path),
    variantUrls: v
      ? {
          thumb: buildImageUrl(v.thumb),
          md: buildImageUrl(v.md),
          lg: buildImageUrl(v.lg),
        }
      : undefined,
  };
};

const IMAGE_SELECT =
  "SELECT id, title, description, path, alt_descr, is_in_gallery, display_order, user_id, article_id, variants, created_at, updated_at FROM images";

const CAROUSEL_LIMIT = 6;

const GALLERY_SELECT = `
  SELECT i.id, i.title, i.description, i.path, i.alt_descr, i.is_in_gallery,
         i.display_order, i.user_id, i.article_id, i.variants, i.created_at, i.updated_at,
         GROUP_CONCAT(c.id ORDER BY c.display_order SEPARATOR ',') AS category_ids,
         GROUP_CONCAT(c.name ORDER BY c.display_order SEPARATOR ',') AS category_names
  FROM images i
  LEFT JOIN images_categories ic ON i.id = ic.image_id
  LEFT JOIN categories c ON ic.category_id = c.id`;

function mapGalleryRows(rows: GalleryImageRow[]): GalleryImage[] {
  return rows.map((r) => {
    const img = mapToImageWithUrl(mapRowToImage(r));
    const ids = r.category_ids ? String(r.category_ids).split(",").map(Number) : [];
    const names = r.category_names ? String(r.category_names).split(",") : [];
    return {
      ...img,
      categories: ids.map((id, i) => ({ id, name: names[i] ?? "" })),
    };
  });
}

export const findById = async (id: number): Promise<ImageWithUrl | null> => {
  const rows = await query<ImageRow[]>(`${IMAGE_SELECT} WHERE id = ?`, [id]);
  return rows[0] ? mapToImageWithUrl(mapRowToImage(rows[0])) : null;
};

const findByGallery = async (categorySlug?: string): Promise<GalleryImage[]> => {
  let sql = `${GALLERY_SELECT} WHERE i.is_in_gallery = 1`;
  const params: string[] = [];

  if (categorySlug) {
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

const findCarouselPreview = async (limit = CAROUSEL_LIMIT): Promise<GalleryImage[]> => {
  const sql = `${GALLERY_SELECT}
    WHERE i.is_in_gallery = 1
    GROUP BY i.id ORDER BY i.display_order ASC, i.created_at DESC
    LIMIT ?`;
  const rows = await query<GalleryImageRow[]>(sql, [limit]);
  return mapGalleryRows(rows);
};

export default { findById, findByGallery, findCarouselPreview };

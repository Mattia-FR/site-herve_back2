import fs from "node:fs/promises";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { resolveUploadPath } from "../config/uploadsPaths";
import { NotFoundError, ValidationError } from "../errors/AppError";
import type { ImageCreateData, ImageUpdateData, ImageWithUrl } from "../types/images";
import { buildUpdateQuery } from "../utils/db/buildUpdateQuery";
import pool, { query } from "./db";
import { type ImageRow, findById, mapRowToImage, mapToImageWithUrl } from "./imagesModel";

async function unlinkSilent(relativePath: string): Promise<void> {
  try {
    await fs.unlink(resolveUploadPath(relativePath));
  } catch {
    // Fichier déjà absent
  }
}

const findAll = async (): Promise<ImageWithUrl[]> => {
  const rows = await query<ImageRow[]>(
    "SELECT id, title, description, path, alt_descr, is_in_gallery, display_order, user_id, article_id, variants, created_at, updated_at FROM images ORDER BY created_at DESC"
  );
  return rows.map((r) => mapToImageWithUrl(mapRowToImage(r)));
};

interface ImageCategoryRow extends RowDataPacket {
  category_id: number;
}

const findCategoriesByImageId = async (imageId: number): Promise<number[]> => {
  const rows = await query<ImageCategoryRow[]>(
    "SELECT category_id FROM images_categories WHERE image_id = ?",
    [imageId]
  );
  return rows.map((r) => r.category_id);
};

const create = async (data: ImageCreateData): Promise<ImageWithUrl> => {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO images (title, description, path, alt_descr, is_in_gallery, display_order, user_id, article_id, variants)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title ?? null,
      data.description ?? null,
      data.path,
      data.alt_descr ?? null,
      data.is_in_gallery ?? false,
      data.display_order ?? 0,
      data.user_id,
      data.article_id ?? null,
      data.variants ? JSON.stringify(data.variants) : null,
    ]
  );
  const created = await findById(result.insertId);
  if (!created) throw new NotFoundError("Image");
  return created;
};

const update = async (id: number, data: ImageUpdateData): Promise<ImageWithUrl | null> => {
  const img = await findById(id);
  if (!img) return null;

  const q = buildUpdateQuery("images", data);
  if (!q) return img;

  await pool.query<ResultSetHeader>(q.sql, [...q.values, id]);
  return findById(id);
};

const setCategories = async (imageId: number, categoryIds: number[]): Promise<void> => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute("DELETE FROM images_categories WHERE image_id = ?", [imageId]);

    if (categoryIds.length > 0) {
      const placeholders = categoryIds.map(() => "(?, ?)").join(", ");
      const values = categoryIds.flatMap((cid) => [imageId, cid]);
      await conn.execute(
        `INSERT INTO images_categories (image_id, category_id) VALUES ${placeholders}`,
        values
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    const mysqlErr = err as { code?: string };
    if (mysqlErr.code === "ER_NO_REFERENCED_ROW_2") {
      throw new ValidationError("Une ou plusieurs catégories sont invalides");
    }
    throw err;
  } finally {
    conn.release();
  }
};

const deleteById = async (id: number): Promise<boolean> => {
  const img = await findById(id);

  const [result] = await pool.query<ResultSetHeader>("DELETE FROM images WHERE id = ?", [id]);

  if (result.affectedRows > 0 && img) {
    await unlinkSilent(img.path);
    if (img.variants) {
      await Promise.all([
        unlinkSilent(img.variants.thumb),
        unlinkSilent(img.variants.md),
        unlinkSilent(img.variants.lg),
      ]);
    }
  }

  return result.affectedRows > 0;
};

export default {
  findAll,
  findById,
  findCategoriesByImageId,
  create,
  update,
  setCategories,
  deleteById,
};

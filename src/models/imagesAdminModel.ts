/**
 * Model admin — images (CRUD complet + gestion des catégories).
 *
 * Rôle : créer, mettre à jour, catégoriser et supprimer les images de la galerie
 * pour le backoffice.
 *
 * Réutilise IMAGE_BASE_SELECT, findById, mapRowToImage, mapToImageWithUrl
 * de imagesModel.ts pour éviter la duplication.
 *
 * Spécificités :
 *   - setCategories : utilise une transaction (DELETE + INSERT) pour remplacer
 *     atomiquement toutes les catégories d'une image
 *   - deleteById : supprime l'entrée en base ET les fichiers physiques sur le disque
 *     (fichier original + 3 variantes WebP thumb/md/lg)
 *   - Les variants sont stockés en JSON dans la colonne TEXT `variants`
 *
 * Table principale : images
 * Table de jointure : images_categories
 */
import fs from "node:fs/promises";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { DEFAULT_ERROR_MESSAGES, ErrorCode, NotFoundResource } from "../config/errorCodes";
import { resolveUploadPath } from "../config/uploadsPaths";
import { BadRequestError, NotFoundError } from "../errors/AppError";
import type { ImageCreateData, ImageUpdateData, ImageWithUrl } from "../types/images";
import type { PaginatedResponse } from "../types/pagination";
import { buildUpdateQuery } from "../utils/db/buildUpdateQuery";
import { paginateQuery } from "../utils/db/paginate";
import pool, { query } from "./db";
import {
  IMAGE_BASE_SELECT,
  type ImageRow,
  findById,
  mapRowToImage,
  mapToImageWithUrl,
} from "./imagesModel";

/**
 * Supprime un fichier de façon silencieuse (sans lever d'erreur s'il est absent).
 * Utilisé lors de la suppression d'une image pour nettoyer le disque.
 */
async function unlinkSilent(relativePath: string): Promise<void> {
  try {
    await fs.unlink(resolveUploadPath(relativePath));
  } catch {
    // Fichier déjà absent ou inaccessible — on ignore l'erreur
  }
}

/** Retourne la liste paginée des images de galerie (triées par date de création). */
const findPaginated = async (
  page: number,
  limit: number
): Promise<PaginatedResponse<ImageWithUrl>> => {
  return paginateQuery<ImageRow, ImageWithUrl>({
    selectSql: `${IMAGE_BASE_SELECT} WHERE is_in_gallery = 1 ORDER BY created_at DESC`,
    countSql: "SELECT COUNT(*) AS total FROM images WHERE is_in_gallery = 1",
    page,
    limit,
    mapRow: (r) => mapToImageWithUrl(mapRowToImage(r)),
  });
};

/** Interface de la ligne de jointure images_categories. */
interface ImageCategoryRow extends RowDataPacket {
  category_id: number;
}

/** Retourne la liste des IDs de catégories associées à une image. */
const findCategoriesByImageId = async (imageId: number): Promise<number[]> => {
  const rows = await query<ImageCategoryRow[]>(
    "SELECT category_id FROM images_categories WHERE image_id = ?",
    [imageId]
  );
  return rows.map((r) => r.category_id);
};

/**
 * Crée une image en base.
 * Les variants (URLs WebP générées par Sharp) sont stockés en JSON dans la colonne TEXT.
 */
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
  if (!created) throw new NotFoundError(NotFoundResource.IMAGE);
  return created;
};

/** Met à jour les métadonnées d'une image (sans toucher au fichier physique). */
const update = async (id: number, data: ImageUpdateData): Promise<ImageWithUrl | null> => {
  const img = await findById(id);
  if (!img) return null;

  const q = buildUpdateQuery("images", data);
  if (!q) return img; // Aucun champ à mettre à jour

  await pool.query<ResultSetHeader>(q.sql, [...q.values, id]);
  return findById(id);
};

/**
 * Remplace atomiquement toutes les catégories d'une image.
 * Utilise une transaction (BEGIN → DELETE → INSERT → COMMIT/ROLLBACK)
 * pour éviter un état incohérent en cas d'erreur.
 * Lance BadRequestError si un categoryId n'existe pas en base (FK violation).
 */
const setCategories = async (imageId: number, categoryIds: number[]): Promise<void> => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // Supprime toutes les associations existantes pour cet imageId
    await conn.execute("DELETE FROM images_categories WHERE image_id = ?", [imageId]);

    if (categoryIds.length > 0) {
      // Construit un INSERT multi-valeurs : (imageId, cat1), (imageId, cat2), ...
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
    // ER_NO_REFERENCED_ROW_2 : un ou plusieurs categoryIds n'existent pas
    if (mysqlErr.code === "ER_NO_REFERENCED_ROW_2") {
      throw new BadRequestError(
        DEFAULT_ERROR_MESSAGES[ErrorCode.INVALID_CATEGORIES],
        ErrorCode.INVALID_CATEGORIES
      );
    }
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Supprime une image de la base ET ses fichiers physiques (original + variants WebP).
 * La suppression des fichiers est non-bloquante (unlinkSilent ignore les erreurs).
 * @returns true si une ligne a été supprimée, false si l'image n'existait pas
 */
const deleteById = async (id: number): Promise<boolean> => {
  // Charger l'image avant suppression pour connaître les chemins des fichiers
  const img = await findById(id);

  const [result] = await pool.query<ResultSetHeader>("DELETE FROM images WHERE id = ?", [id]);

  if (result.affectedRows > 0 && img) {
    // Supprimer le fichier original et toutes les variantes WebP
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
  findPaginated,
  findById,
  findCategoriesByImageId,
  create,
  update,
  setCategories,
  deleteById,
};

/**
 * Model admin — images (CRUD complet).
 *
 * Rôle : créer, mettre à jour et supprimer les images de la galerie
 * pour le backoffice.
 *
 * Réutilise IMAGE_BASE_SELECT, findById, mapRowToImage, mapToImageWithUrl
 * de imagesModel.ts pour éviter la duplication.
 *
 * Spécificités :
 *   - create : INSERT avec category_id (upload atomique — pas de 2e appel nécessaire)
 *   - reorderInCategory : transaction UPDATE display_order pour toutes les images d'une galerie
 *   - deleteById : supprime l'entrée en base ET les fichiers physiques sur le disque
 *   - findByCategory : retourne toutes les images d'une galerie, triées par display_order ASC
 *
 * Table principale : images
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
import pool, { query, withTransaction } from "./db";
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

/** Retourne la liste paginée des images de galerie (triées par date de création desc). */
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

/**
 * Retourne toutes les images d'une galerie (catégorie), triées par display_order ASC.
 * Utilisé par AdminGalleryDetailPage pour afficher la grille de réordonnancement.
 */
const findByCategory = async (categoryId: number): Promise<ImageWithUrl[]> => {
  const rows = await query<ImageRow[]>(
    `${IMAGE_BASE_SELECT} WHERE category_id = ? AND is_in_gallery = 1 ORDER BY display_order ASC, id ASC`,
    [categoryId]
  );
  return rows.map((r) => mapToImageWithUrl(mapRowToImage(r)));
};

/**
 * Crée une image en base avec sa catégorie (upload atomique).
 * Les variants (URLs WebP générées par Sharp) sont stockés en JSON dans la colonne TEXT.
 */
const create = async (data: ImageCreateData): Promise<ImageWithUrl> => {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO images (title, description, path, is_in_gallery, display_order, user_id, article_id, category_id, variants)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title ?? null,
      data.description ?? null,
      data.path,
      data.is_in_gallery ?? false,
      data.display_order ?? 0,
      data.user_id,
      data.article_id ?? null,
      data.category_id ?? null,
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
 * Réordonne les images d'une galerie.
 * Reçoit la liste complète des IDs dans le nouvel ordre et met à jour
 * display_order de chaque image dans une transaction.
 * Seules les images appartenant à la catégorie donnée sont modifiées.
 */
const reorderInCategory = async (categoryId: number, imageIds: number[]): Promise<void> => {
  if (imageIds.length === 0) return;

  await withTransaction(async (conn) => {
    for (let i = 0; i < imageIds.length; i++) {
      await conn.execute("UPDATE images SET display_order = ? WHERE id = ? AND category_id = ?", [
        i,
        imageIds[i],
        categoryId,
      ]);
    }
  });
};

/**
 * Supprime une image de la base ET ses fichiers physiques (original + variants WebP).
 * @returns true si une ligne a été supprimée, false si l'image n'existait pas
 */
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
  findPaginated,
  findById,
  findByCategory,
  create,
  update,
  reorderInCategory,
  deleteById,
};

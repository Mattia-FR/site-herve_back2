/**
 * Controller admin — gestion de la galerie d'images.
 *
 * Rôle : CRUD des images de la galerie avec pipeline de traitement Sharp.
 *
 * Routes correspondantes (voir imagesAdminRouter.ts, préfixe /api/admin/images) :
 *   GET    /                  → liste paginée des images de galerie
 *   GET    /:id               → détail d'une image
 *   POST   /                  → ajouter une image (upload atomique avec category_id)
 *   PUT    /:id               → modifier les métadonnées + catégorie d'une image
 *   PUT    /:id/file          → remplacer le fichier physique d'une image
 *   DELETE /:id               → supprimer image (fichiers disque + DB)
 *
 * Pipeline d'upload (POST /) :
 *   Multer (écriture disque) → validateMagicBytes → validateBody → add()
 *   → processUploadedImage (Sharp : 3 variantes WebP) → imagesAdminModel.create
 *   L'association catégorie est atomique : category_id inclus dans l'INSERT.
 */
import fs from "node:fs/promises";
import type { Request, Response } from "express";
import type { z } from "zod";
import { NotFoundResource } from "../config/errorCodes";
import { UPLOADS_GALLERY_VARIANTS_DIR, resolveUploadPath } from "../config/uploadsPaths";
import { NotFoundError } from "../errors/AppError";
import imagesAdminModel from "../models/imagesAdminModel";
import { asyncHandler } from "../utils/asyncHandler";
import {
  getAuthUserId,
  getUploadedFile,
  getValidatedBody,
  getValidatedId,
  getValidatedQuery,
} from "../utils/http/requestHelpers";
import { cleanupUploadedFile } from "../utils/image/cleanupUploadedFile";
import { processUploadedImage } from "../utils/image/processUploadedImage";
import type { imageMetadataSchema, imageUpdateSchema } from "../validation/images.schemas";
import type { adminPaginationQuerySchema } from "../validation/pagination.schemas";

/** GET /api/admin/images — liste paginée des images de galerie. */
const browse = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getValidatedQuery<z.infer<typeof adminPaginationQuerySchema>>(req);
  const result = await imagesAdminModel.findPaginated(page, limit);
  res.status(200).json(result);
});

/**
 * POST /api/admin/images
 * Upload atomique : génère les variantes WebP puis crée l'image avec sa catégorie en un seul INSERT.
 */
const add = asyncHandler(async (req: Request, res: Response) => {
  const file = getUploadedFile(req);
  const userId = getAuthUserId(req);
  const meta = getValidatedBody<z.infer<typeof imageMetadataSchema>>(req);

  const variants = await processUploadedImage(file.path, UPLOADS_GALLERY_VARIANTS_DIR);

  const image = await imagesAdminModel.create({
    title: meta.title ?? null,
    description: meta.description ?? null,
    is_in_gallery: true,
    display_order: meta.display_order ?? 0,
    article_id: meta.article_id ?? null,
    category_id: meta.category_id ?? null,
    path: `/uploads/gallery/${file.filename}`,
    variants,
    user_id: userId,
  });
  res.status(201).json(image);
});

/** GET /api/admin/images/:id — retourne une image. */
const read = asyncHandler(async (req: Request, res: Response) => {
  const id = getValidatedId(req);
  const image = await imagesAdminModel.findById(id);
  if (!image) throw new NotFoundError(NotFoundResource.IMAGE);
  res.status(200).json(image);
});

/** PUT /api/admin/images/:id — met à jour les métadonnées et/ou la catégorie de l'image. */
const edit = asyncHandler(async (req: Request, res: Response) => {
  const body = getValidatedBody<z.infer<typeof imageUpdateSchema>>(req);
  const image = await imagesAdminModel.update(getValidatedId(req), {
    ...body,
    is_in_gallery: true,
  });
  if (!image) throw new NotFoundError(NotFoundResource.IMAGE);
  res.status(200).json(image);
});

/**
 * PUT /api/admin/images/:id/file
 * Remplace le fichier physique d'une image existante :
 *   1. Traite le nouveau fichier avec Sharp (3 variantes WebP)
 *   2. Supprime les anciens fichiers (original + variantes)
 *   3. Met à jour path et variants en base
 */
const replaceFile = asyncHandler(async (req: Request, res: Response) => {
  const id = getValidatedId(req);
  const file = getUploadedFile(req);

  const existing = await imagesAdminModel.findById(id);
  if (!existing) {
    await cleanupUploadedFile(file.path);
    throw new NotFoundError(NotFoundResource.IMAGE);
  }

  const variants = await processUploadedImage(file.path, UPLOADS_GALLERY_VARIANTS_DIR);

  // Supprimer les anciens fichiers après succès du traitement Sharp
  const unlinkSilent = async (p: string) => {
    try {
      await fs.unlink(resolveUploadPath(p));
    } catch {
      /* ignore */
    }
  };
  await unlinkSilent(existing.path);
  if (existing.variants) {
    await Promise.all([
      unlinkSilent(existing.variants.thumb),
      unlinkSilent(existing.variants.md),
      unlinkSilent(existing.variants.lg),
    ]);
  }

  const updated = await imagesAdminModel.update(id, {
    path: `/uploads/gallery/${file.filename}`,
    variants,
  });
  if (!updated) throw new NotFoundError(NotFoundResource.IMAGE);
  res.status(200).json(updated);
});

/**
 * DELETE /api/admin/images/:id
 * Supprime l'image de la base de données ET les fichiers physiques.
 */
const destroy = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await imagesAdminModel.deleteById(getValidatedId(req));
  if (!deleted) throw new NotFoundError(NotFoundResource.IMAGE);
  res.sendStatus(204);
});

export { add, browse, destroy, edit, read, replaceFile };

/**
 * Controller admin — gestion de la galerie d'images.
 *
 * Rôle : CRUD des images de la galerie avec pipeline de traitement Sharp.
 *
 * Routes correspondantes (voir imagesAdminRouter.ts, préfixe /api/admin/images) :
 *   GET    /                  → liste paginée de toutes les images
 *   GET    /:id               → détail d'une image + ses catégories
 *   POST   /                  → ajouter une image (upload + traitement Sharp)
 *   PUT    /:id/categories    → remplacer les catégories d'une image
 *   PUT    /:id               → modifier les métadonnées d'une image
 *   DELETE /:id               → supprimer image (fichiers disque + DB)
 *
 * Pipeline d'upload (POST /) :
 *   Multer (écriture disque) → validateMagicBytes → validateBody → add()
 *   → processUploadedImage (Sharp : 3 variantes WebP) → imagesAdminModel.create
 */
import type { Request, Response } from "express";
import type { z } from "zod";
import { NotFoundResource } from "../config/errorCodes";
import { UPLOADS_GALLERY_VARIANTS_DIR } from "../config/uploadsPaths";
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
import { processUploadedImage } from "../utils/image/processUploadedImage";
import type {
  imageCategoriesSchema,
  imageMetadataSchema,
  imageUpdateSchema,
} from "../validation/images.schemas";
import type { adminPaginationQuerySchema } from "../validation/pagination.schemas";

/** GET /api/admin/images — liste paginée de toutes les images. */
const browse = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getValidatedQuery<z.infer<typeof adminPaginationQuerySchema>>(req);
  const result = await imagesAdminModel.findPaginated(page, limit);
  res.status(200).json(result);
});

/**
 * POST /api/admin/images
 * Traite l'image avec Sharp (3 variantes WebP), puis crée l'entrée en base.
 * Le chemin stocké en base est le chemin public (/uploads/gallery/...).
 */
const add = asyncHandler(async (req: Request, res: Response) => {
  const file = getUploadedFile(req);
  const userId = getAuthUserId(req);
  const meta = getValidatedBody<z.infer<typeof imageMetadataSchema>>(req);

  // Génère les variantes WebP (thumb/md/lg) dans UPLOADS_GALLERY_VARIANTS_DIR
  const variants = await processUploadedImage(file.path, UPLOADS_GALLERY_VARIANTS_DIR);

  const image = await imagesAdminModel.create({
    title: meta.title ?? null,
    description: meta.description ?? null,
    alt_descr: meta.alt_descr ?? null,
    is_in_gallery: meta.is_in_gallery ?? false,
    display_order: meta.display_order ?? 0,
    article_id: meta.article_id ?? null,
    path: `/uploads/gallery/${file.filename}`,
    variants,
    user_id: userId,
  });
  res.status(201).json(image);
});

/**
 * GET /api/admin/images/:id
 * Retourne une image avec ses catégories associées (liste d'IDs).
 */
const read = asyncHandler(async (req: Request, res: Response) => {
  const id = getValidatedId(req);
  const image = await imagesAdminModel.findById(id);
  if (!image) throw new NotFoundError(NotFoundResource.IMAGE);
  // Les catégories sont chargées séparément (table de jointure images_categories)
  const categoryIds = await imagesAdminModel.findCategoriesByImageId(id);
  res.status(200).json({ ...image, categoryIds });
});

/** PUT /api/admin/images/:id — met à jour les métadonnées de l'image. */
const edit = asyncHandler(async (req: Request, res: Response) => {
  const image = await imagesAdminModel.update(
    getValidatedId(req),
    getValidatedBody<z.infer<typeof imageUpdateSchema>>(req)
  );
  if (!image) throw new NotFoundError(NotFoundResource.IMAGE);
  res.status(200).json(image);
});

/**
 * PUT /api/admin/images/:id/categories
 * Remplace complètement les catégories de l'image (DELETE + INSERT).
 * Retourne l'image mise à jour avec ses nouvelles catégories.
 */
const setCategories = asyncHandler(async (req: Request, res: Response) => {
  const id = getValidatedId(req);
  const { categoryIds } = getValidatedBody<z.infer<typeof imageCategoriesSchema>>(req);

  await imagesAdminModel.setCategories(id, categoryIds);

  const image = await imagesAdminModel.findById(id);
  if (!image) throw new NotFoundError(NotFoundResource.IMAGE);
  res.status(200).json(image);
});

/**
 * DELETE /api/admin/images/:id
 * Supprime l'image de la base de données ET les fichiers physiques
 * (original + variantes WebP). Retourne 204 si supprimé, 404 si introuvable.
 */
const destroy = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await imagesAdminModel.deleteById(getValidatedId(req));
  if (!deleted) throw new NotFoundError(NotFoundResource.IMAGE);
  res.sendStatus(204);
});

export { add, browse, destroy, edit, read, setCategories };

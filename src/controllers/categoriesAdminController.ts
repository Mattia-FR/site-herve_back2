/**
 * Controller admin — gestion des catégories (= galeries).
 *
 * Rôle : CRUD des catégories + gestion des images par galerie.
 *
 * Routes correspondantes (voir categoriesAdminRouter.ts, préfixe /api/admin/categories) :
 *   GET    /                       → liste de toutes les catégories
 *   GET    /:id                    → détail d'une catégorie
 *   POST   /                       → créer une catégorie
 *   PUT    /:id                    → modifier une catégorie
 *   DELETE /:id                    → supprimer (refusé si images associées)
 *   GET    /:id/images             → toutes les images de la galerie (tri display_order ASC)
 *   PATCH  /:id/images/reorder     → réordonner les images par drag-and-drop
 *   PATCH  /:id/cover              → définir/retirer l'image de couverture
 */
import type { Request, Response } from "express";
import type { z } from "zod";
import { NotFoundResource } from "../config/errorCodes";
import { NotFoundError } from "../errors/AppError";
import categoriesAdminModel from "../models/categoriesAdminModel";
import imagesAdminModel from "../models/imagesAdminModel";
import { asyncHandler } from "../utils/asyncHandler";
import { getValidatedBody, getValidatedId } from "../utils/http/requestHelpers";
import type {
  categoryCreateSchema,
  categoryUpdateSchema,
  reorderImagesSchema,
  setCoverSchema,
} from "../validation/categories.schemas";

/** GET /api/admin/categories — liste complète des catégories. */
const browse = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await categoriesAdminModel.findAll();
  res.status(200).json(categories);
});

/** GET /api/admin/categories/:id — détail d'une catégorie. */
const read = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoriesAdminModel.findById(getValidatedId(req));
  if (!category) throw new NotFoundError(NotFoundResource.CATEGORY);
  res.status(200).json(category);
});

/** POST /api/admin/categories — crée une catégorie. Le slug est auto-généré depuis le nom. */
const add = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoriesAdminModel.create(
    getValidatedBody<z.infer<typeof categoryCreateSchema>>(req)
  );
  res.status(201).json(category);
});

/** PUT /api/admin/categories/:id — met à jour le nom et/ou l'ordre d'affichage. */
const edit = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoriesAdminModel.update(
    getValidatedId(req),
    getValidatedBody<z.infer<typeof categoryUpdateSchema>>(req)
  );
  if (!category) throw new NotFoundError(NotFoundResource.CATEGORY);
  res.status(200).json(category);
});

/**
 * DELETE /api/admin/categories/:id
 * Supprime la catégorie. Retourne 400 si des images lui sont encore assignées.
 */
const destroy = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await categoriesAdminModel.deleteById(getValidatedId(req));
  if (!deleted) throw new NotFoundError(NotFoundResource.CATEGORY);
  res.sendStatus(204);
});

/**
 * GET /api/admin/categories/:id/images
 * Retourne toutes les images de la galerie, triées par display_order ASC.
 */
const browseImages = asyncHandler(async (req: Request, res: Response) => {
  const categoryId = getValidatedId(req);
  const category = await categoriesAdminModel.findById(categoryId);
  if (!category) throw new NotFoundError(NotFoundResource.CATEGORY);

  const images = await imagesAdminModel.findByCategory(categoryId);
  res.status(200).json(images);
});

/**
 * PATCH /api/admin/categories/:id/images/reorder
 * Réordonne les images d'une galerie.
 * Body : { imageIds: number[] } — liste complète dans le nouvel ordre.
 */
const reorderImages = asyncHandler(async (req: Request, res: Response) => {
  const categoryId = getValidatedId(req);
  const { imageIds } = getValidatedBody<z.infer<typeof reorderImagesSchema>>(req);

  const category = await categoriesAdminModel.findById(categoryId);
  if (!category) throw new NotFoundError(NotFoundResource.CATEGORY);

  await imagesAdminModel.reorderInCategory(categoryId, imageIds);
  res.sendStatus(204);
});

/**
 * PATCH /api/admin/categories/:id/cover
 * Définit ou retire l'image de couverture d'une galerie.
 * Body : { imageId: number | null } — null = retour à la couverture automatique.
 */
const setCover = asyncHandler(async (req: Request, res: Response) => {
  const categoryId = getValidatedId(req);
  const { imageId } = getValidatedBody<z.infer<typeof setCoverSchema>>(req);

  const category = await categoriesAdminModel.setCover(categoryId, imageId);
  if (!category) throw new NotFoundError(NotFoundResource.CATEGORY);
  res.status(200).json(category);
});

export { add, browse, browseImages, destroy, edit, read, reorderImages, setCover };

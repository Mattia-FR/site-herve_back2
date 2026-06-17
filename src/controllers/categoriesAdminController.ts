/**
 * Controller admin — gestion des catégories.
 *
 * Rôle : CRUD des catégories d'images.
 *
 * Routes correspondantes (voir categoriesAdminRouter.ts, préfixe /api/admin/categories) :
 *   GET    /     → liste de toutes les catégories
 *   POST   /     → créer une catégorie
 *   PUT    /:id  → modifier une catégorie
 *   DELETE /:id  → supprimer une catégorie
 *
 * Attention : la suppression échoue avec une erreur INVALID_REFERENCE si des
 * images sont encore associées à la catégorie (contrainte FK en base).
 */
import type { Request, Response } from "express";
import type { z } from "zod";
import { NotFoundResource } from "../config/errorCodes";
import { NotFoundError } from "../errors/AppError";
import categoriesAdminModel from "../models/categoriesAdminModel";
import { asyncHandler } from "../utils/asyncHandler";
import { getValidatedBody, getValidatedId } from "../utils/http/requestHelpers";
import type { categoryCreateSchema, categoryUpdateSchema } from "../validation/categories.schemas";

/** GET /api/admin/categories — liste complète des catégories. */
const browse = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await categoriesAdminModel.findAll();
  res.status(200).json(categories);
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

/** DELETE /api/admin/categories/:id — supprime la catégorie (échoue si des images y sont liées). */
const destroy = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await categoriesAdminModel.deleteById(getValidatedId(req));
  if (!deleted) throw new NotFoundError(NotFoundResource.CATEGORY);
  res.sendStatus(204);
});

export { add, browse, destroy, edit };

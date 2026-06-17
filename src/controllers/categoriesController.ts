/**
 * Controller public — catégories.
 *
 * Rôle : exposer les endpoints de lecture publique des catégories d'images.
 *
 * Routes correspondantes (voir categoriesRouter.ts) :
 *   GET /api/categories      → liste de toutes les catégories
 *   GET /api/categories/:id  → détail d'une catégorie par ID
 */
import type { Request, Response } from "express";
import { NotFoundResource } from "../config/errorCodes";
import { NotFoundError } from "../errors/AppError";
import categoriesModel from "../models/categoriesModel";
import { asyncHandler } from "../utils/asyncHandler";
import { getValidatedId } from "../utils/http/requestHelpers";

/**
 * GET /api/categories
 * Retourne la liste de toutes les catégories.
 */
const browse = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await categoriesModel.findAll();
  res.status(200).json(categories);
});

/**
 * GET /api/categories/:id
 * Retourne une catégorie par son ID.
 * Lance NotFoundError si la catégorie n'existe pas.
 */
const read = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoriesModel.findById(getValidatedId(req));
  if (!category) throw new NotFoundError(NotFoundResource.CATEGORY);
  res.status(200).json(category);
});

export { browse, read };

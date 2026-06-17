/**
 * Controller public — articles publiés.
 *
 * Rôle : exposer les endpoints de lecture publique des articles.
 * Seuls les articles avec status = "published" sont retournés.
 *
 * Routes correspondantes (voir articlesRouter.ts) :
 *   GET /api/articles/homepage-preview   → 3 derniers articles pour la page d'accueil
 *   GET /api/articles/published          → liste complète paginée
 *   GET /api/articles/published/id/:id   → article par ID
 *   GET /api/articles/published/slug/:slug → article par slug
 */
import type { Request, Response } from "express";
import type { z } from "zod";
import { NotFoundResource } from "../config/errorCodes";
import { NotFoundError } from "../errors/AppError";
import articlesModel from "../models/articlesModel";
import { asyncHandler } from "../utils/asyncHandler";
import {
  getValidatedId,
  getValidatedParams,
  getValidatedQuery,
} from "../utils/http/requestHelpers";
import type { articlesPublishedQuerySchema, slugParamSchema } from "../validation/articles.schemas";

/**
 * GET /api/articles/published
 * Retourne la liste paginée des articles publiés.
 * Le paramètre `limit` est extrait depuis req.validatedQuery.
 */
const browsePublished = asyncHandler(async (req: Request, res: Response) => {
  const { limit } = getValidatedQuery<z.infer<typeof articlesPublishedQuerySchema>>(req);
  const articles = await articlesModel.findPublished(limit);
  res.status(200).json(articles);
});

/**
 * GET /api/articles/homepage-preview
 * Retourne les 3 derniers articles publiés pour l'aperçu de la page d'accueil.
 */
const readHomepagePreview = asyncHandler(async (_req: Request, res: Response) => {
  const articles = await articlesModel.findHomepagePreview();
  res.status(200).json(articles);
});

/**
 * GET /api/articles/published/id/:id
 * Retourne un article publié par son ID numérique.
 * Lance NotFoundError si l'article n'existe pas ou n'est pas publié.
 */
const readPublishedById = asyncHandler(async (req: Request, res: Response) => {
  const id = getValidatedId(req);
  const article = await articlesModel.findPublishedById(id);
  if (!article) throw new NotFoundError(NotFoundResource.ARTICLE);
  res.status(200).json(article);
});

/**
 * GET /api/articles/published/slug/:slug
 * Retourne un article publié par son slug (URL canonique).
 * Lance NotFoundError si l'article n'existe pas ou n'est pas publié.
 */
const readPublishedBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = getValidatedParams<z.infer<typeof slugParamSchema>>(req);
  const article = await articlesModel.findPublishedBySlug(slug);
  if (!article) throw new NotFoundError(NotFoundResource.ARTICLE);
  res.status(200).json(article);
});

export { browsePublished, readHomepagePreview, readPublishedById, readPublishedBySlug };

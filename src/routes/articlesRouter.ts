/**
 * Routes publiques des articles — /api/articles
 *
 * GET /homepage-preview          → 3 derniers articles publiés pour la page d'accueil
 * GET /published                 → liste paginée des articles publiés (tri, filtres)
 * GET /published/id/:id          → article publié par son ID numérique
 * GET /published/slug/:slug      → article publié par son slug (URL canonique)
 *
 * Accès public, aucune authentification requise.
 * La pagination et le tri sont validés par articlesPublishedQuerySchema.
 */
import { Router } from "express";
import {
  browsePublished,
  readHomepagePreview,
  readPublishedById,
  readPublishedBySlug,
} from "../controllers/articlesController";
import { requireValidId, validateParams, validateQuery } from "../middlewares/validationMiddleware";
import { articlesPublishedQuerySchema, slugParamSchema } from "../validation/articles.schemas";

const router = Router();

router.get("/homepage-preview", readHomepagePreview);
router.get("/published", validateQuery(articlesPublishedQuerySchema), browsePublished);
// requireValidId() parse et valide que :id est un entier positif
router.get("/published/id/:id", requireValidId(), readPublishedById);
router.get("/published/slug/:slug", validateParams(slugParamSchema), readPublishedBySlug);

export default router;

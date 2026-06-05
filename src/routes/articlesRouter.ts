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
router.get("/published/id/:id", requireValidId(), readPublishedById);
router.get("/published/slug/:slug", validateParams(slugParamSchema), readPublishedBySlug);

export default router;

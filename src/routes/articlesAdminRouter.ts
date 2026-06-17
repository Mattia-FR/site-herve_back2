/**
 * Routes admin des articles — /api/admin/articles
 * (toutes protégées par requireAuth via adminRouter.ts)
 *
 * GET  /                   → liste paginée de tous les articles (publiés + brouillons)
 * GET  /slug/:slug         → article par slug (pour l'éditeur)
 * GET  /:id                → article par ID
 * POST /                   → créer un nouvel article
 * PUT  /:id                → modifier un article existant
 * DELETE /:id              → supprimer un article
 *
 * Routes d'upload :
 *   POST /content-images   → upload d'une image insérée dans le corps de l'article
 *                            pipeline : Multer → validateMagicBytes → controller
 *   POST /featured-image   → upload de l'image à la une
 *                            pipeline : Multer → validateMagicBytes → controller
 *
 * Les images uploadées sont stockées brutes puis converties en WebP par Sharp
 * dans les controllers (processUploadedImage).
 */
import { Router } from "express";
import { createUpload } from "../config/multer";
import { UPLOADS_CONTENT_DIR, UPLOADS_FEATURED_DIR } from "../config/uploadsPaths";
import {
  add,
  browseAll,
  destroy,
  edit,
  readById,
  readBySlug,
  uploadContentImage,
  uploadFeaturedImage,
} from "../controllers/articlesAdminController";
import { validateMagicBytes } from "../middlewares/validateMagicBytes";
import {
  requireValidId,
  validateBody,
  validateParams,
  validateQuery,
} from "../middlewares/validationMiddleware";
import {
  articleCreateSchema,
  articleUpdateSchema,
  slugParamSchema,
} from "../validation/articles.schemas";
import { adminPaginationQuerySchema } from "../validation/pagination.schemas";

const router = Router();

router.get("/", validateQuery(adminPaginationQuerySchema), browseAll);
router.get("/slug/:slug", validateParams(slugParamSchema), readBySlug);

// Upload image de contenu : Multer écrit le fichier sur disque,
// puis validateMagicBytes vérifie les octets réels avant traitement Sharp.
router.post(
  "/content-images",
  createUpload(UPLOADS_CONTENT_DIR).single("file"),
  validateMagicBytes,
  uploadContentImage
);

// Upload image à la une (featured image) : même pipeline que content-images.
router.post(
  "/featured-image",
  createUpload(UPLOADS_FEATURED_DIR).single("file"),
  validateMagicBytes,
  uploadFeaturedImage
);

router.get("/:id", requireValidId(), readById);
router.post("/", validateBody(articleCreateSchema), add);
router.put("/:id", requireValidId(), validateBody(articleUpdateSchema), edit);
router.delete("/:id", requireValidId(), destroy);

export default router;

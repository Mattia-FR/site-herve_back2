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
import { adminPaginationQuerySchema } from "../validation/pagination.schemas";
import {
  articleCreateSchema,
  articleUpdateSchema,
  slugParamSchema,
} from "../validation/articles.schemas";

const router = Router();

router.get("/", validateQuery(adminPaginationQuerySchema), browseAll);
router.get("/slug/:slug", validateParams(slugParamSchema), readBySlug);
router.post(
  "/content-images",
  createUpload(UPLOADS_CONTENT_DIR).single("file"),
  validateMagicBytes,
  uploadContentImage
);
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

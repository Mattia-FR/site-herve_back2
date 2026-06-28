/**
 * Routes admin de la galerie — /api/admin/images
 * (toutes protégées par requireAuth via adminRouter.ts)
 *
 * GET    /          → liste paginée de toutes les images
 * GET    /:id       → détail d'une image
 * POST   /          → ajouter une image (upload atomique avec category_id)
 *                     pipeline : Multer → validateMagicBytes → validateBody → controller
 * PUT    /:id       → modifier les métadonnées + catégorie d'une image
 * PUT    /:id/file  → remplacer le fichier physique (Multer → Sharp → DB)
 * DELETE /:id       → supprimer une image (fichier + variants + entrée DB)
 */
import { Router } from "express";
import { createUpload } from "../config/multer";
import { UPLOADS_GALLERY_DIR } from "../config/uploadsPaths";
import {
  add,
  browse,
  destroy,
  edit,
  read,
  replaceFile,
} from "../controllers/imagesAdminController";
import { validateMagicBytes } from "../middlewares/validateMagicBytes";
import { requireValidId, validateBody, validateQuery } from "../middlewares/validationMiddleware";
import { imageMetadataSchema, imageUpdateSchema } from "../validation/images.schemas";
import { adminPaginationQuerySchema } from "../validation/pagination.schemas";

const router = Router();
const galleryUpload = createUpload(UPLOADS_GALLERY_DIR).single("image");

router.get("/", validateQuery(adminPaginationQuerySchema), browse);
router.get("/:id", requireValidId(), read);

router.post("/", galleryUpload, validateMagicBytes, validateBody(imageMetadataSchema), add);

router.put("/:id", requireValidId(), validateBody(imageUpdateSchema), edit);

router.put("/:id/file", requireValidId(), galleryUpload, validateMagicBytes, replaceFile);

router.delete("/:id", requireValidId(), destroy);

export default router;

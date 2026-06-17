/**
 * Routes admin de la galerie — /api/admin/images
 * (toutes protégées par requireAuth via adminRouter.ts)
 *
 * GET  /                      → liste paginée de toutes les images
 * GET  /:id                   → détail d'une image
 * POST /                      → ajouter une image à la galerie
 *                               pipeline : Multer → validateMagicBytes → validateBody → controller
 * PUT  /:id/categories        → mettre à jour les catégories d'une image
 * PUT  /:id                   → modifier les métadonnées d'une image
 * DELETE /:id                 → supprimer une image (fichier + variants + entrée DB)
 *
 * Lors de l'upload (POST), le corps multipart contient à la fois :
 *   - le fichier image (champ "image") traité par Multer
 *   - les métadonnées JSON (titre, description, etc.) validées par imageMetadataSchema
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
  setCategories,
} from "../controllers/imagesAdminController";
import { validateMagicBytes } from "../middlewares/validateMagicBytes";
import { requireValidId, validateBody, validateQuery } from "../middlewares/validationMiddleware";
import {
  imageCategoriesSchema,
  imageMetadataSchema,
  imageUpdateSchema,
} from "../validation/images.schemas";
import { adminPaginationQuerySchema } from "../validation/pagination.schemas";

const router = Router();

router.get("/", validateQuery(adminPaginationQuerySchema), browse);
router.get("/:id", requireValidId(), read);

// Upload image galerie : Multer écrit le fichier, validateMagicBytes vérifie
// les octets réels, validateBody valide les métadonnées, puis le controller
// lance le traitement Sharp (3 variantes WebP).
router.post(
  "/",
  createUpload(UPLOADS_GALLERY_DIR).single("image"),
  validateMagicBytes,
  validateBody(imageMetadataSchema),
  add
);

router.put("/:id/categories", requireValidId(), validateBody(imageCategoriesSchema), setCategories);
router.put("/:id", requireValidId(), validateBody(imageUpdateSchema), edit);
router.delete("/:id", requireValidId(), destroy);

export default router;

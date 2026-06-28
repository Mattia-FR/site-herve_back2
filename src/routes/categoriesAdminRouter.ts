/**
 * Routes admin des catégories (= galeries) — /api/admin/categories
 * (toutes protégées par requireAuth via adminRouter.ts)
 *
 * GET    /                      → liste de toutes les catégories
 * GET    /:id                   → détail d'une catégorie
 * POST   /                      → créer une catégorie
 * PUT    /:id                   → modifier une catégorie existante
 * DELETE /:id                   → supprimer (400 si images associées)
 * GET    /:id/images            → images de la galerie (tri display_order ASC)
 * PATCH  /:id/images/reorder    → réordonner les images (drag-and-drop)
 * PATCH  /:id/cover             → définir/retirer l'image de couverture
 */
import { Router } from "express";
import {
  add,
  browse,
  browseImages,
  destroy,
  edit,
  read,
  reorderImages,
  setCover,
} from "../controllers/categoriesAdminController";
import { requireValidId, validateBody } from "../middlewares/validationMiddleware";
import {
  categoryCreateSchema,
  categoryUpdateSchema,
  reorderImagesSchema,
  setCoverSchema,
} from "../validation/categories.schemas";

const router = Router();

router.get("/", browse);
router.get("/:id", requireValidId(), read);
router.post("/", validateBody(categoryCreateSchema), add);
router.put("/:id", requireValidId(), validateBody(categoryUpdateSchema), edit);
router.delete("/:id", requireValidId(), destroy);

router.get("/:id/images", requireValidId(), browseImages);
router.patch(
  "/:id/images/reorder",
  requireValidId(),
  validateBody(reorderImagesSchema),
  reorderImages
);
router.patch("/:id/cover", requireValidId(), validateBody(setCoverSchema), setCover);

export default router;

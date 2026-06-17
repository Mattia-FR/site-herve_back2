/**
 * Routes admin des catégories — /api/admin/categories
 * (toutes protégées par requireAuth via adminRouter.ts)
 *
 * GET  /     → liste de toutes les catégories
 * POST /     → créer une catégorie
 * PUT  /:id  → modifier une catégorie existante
 * DELETE /:id → supprimer une catégorie (échoue si des images y sont liées)
 */
import { Router } from "express";
import { add, browse, destroy, edit } from "../controllers/categoriesAdminController";
import { requireValidId, validateBody } from "../middlewares/validationMiddleware";
import { categoryCreateSchema, categoryUpdateSchema } from "../validation/categories.schemas";

const router = Router();

router.get("/", browse);
router.post("/", validateBody(categoryCreateSchema), add);
router.put("/:id", requireValidId(), validateBody(categoryUpdateSchema), edit);
router.delete("/:id", requireValidId(), destroy);

export default router;

/**
 * Routes admin du livre d'or — /api/admin/guestbook
 * (toutes protégées par requireAuth via adminRouter.ts)
 *
 * GET    /     → liste paginée de toutes les entrées (pending/approved/spam)
 * GET    /:id  → détail d'une entrée
 * PATCH  /:id  → modifier le statut (pending → approved / spam)
 * DELETE /:id  → supprimer définitivement une entrée
 */
import { Router } from "express";
import { browseAll, destroy, edit, read } from "../controllers/guestbookAdminController";
import { requireValidId, validateBody, validateQuery } from "../middlewares/validationMiddleware";
import {
  guestbookAdminListQuerySchema,
  guestbookUpdateSchema,
} from "../validation/guestbook.schemas";

const router = Router();

router.get("/", validateQuery(guestbookAdminListQuerySchema), browseAll);
router.get("/:id", requireValidId(), read);
router.patch("/:id", requireValidId(), validateBody(guestbookUpdateSchema), edit);
router.delete("/:id", requireValidId(), destroy);

export default router;

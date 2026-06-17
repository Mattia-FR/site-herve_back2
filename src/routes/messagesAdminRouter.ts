/**
 * Routes admin des messages de contact — /api/admin/messages
 * (toutes protégées par requireAuth via adminRouter.ts)
 *
 * GET    /     → liste paginée des messages (tri par date, filtres par statut)
 * GET    /:id  → détail d'un message
 * PATCH  /:id  → modifier le statut (unread/read/spam)
 * DELETE /:id  → supprimer définitivement un message
 *
 * Note : PATCH plutôt que PUT car seul le statut est modifiable (mise à jour partielle).
 */
import { Router } from "express";
import { browse, destroy, edit, read } from "../controllers/messagesAdminController";
import { requireValidId, validateBody, validateQuery } from "../middlewares/validationMiddleware";
import { messageUpdateSchema } from "../validation/messages.schemas";
import { adminPaginationQuerySchema } from "../validation/pagination.schemas";

const router = Router();

router.get("/", validateQuery(adminPaginationQuerySchema), browse);
router.get("/:id", requireValidId(), read);
router.patch("/:id", requireValidId(), validateBody(messageUpdateSchema), edit);
router.delete("/:id", requireValidId(), destroy);

export default router;

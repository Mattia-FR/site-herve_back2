import { Router } from "express";
import { browseAll, destroy, edit, read } from "../controllers/guestbookAdminController";
import {
  requireValidId,
  validateBody,
  validateQuery,
} from "../middlewares/validationMiddleware";
import { guestbookUpdateSchema } from "../validation/guestbook.schemas";
import { adminPaginationQuerySchema } from "../validation/pagination.schemas";

const router = Router();

router.get("/", validateQuery(adminPaginationQuerySchema), browseAll);
router.get("/:id", requireValidId(), read);
router.patch("/:id", requireValidId(), validateBody(guestbookUpdateSchema), edit);
router.delete("/:id", requireValidId(), destroy);

export default router;

import { Router } from "express";
import { browse, destroy, edit, read } from "../controllers/messagesAdminController";
import {
  requireValidId,
  validateBody,
  validateQuery,
} from "../middlewares/validationMiddleware";
import { messageUpdateSchema } from "../validation/messages.schemas";
import { adminPaginationQuerySchema } from "../validation/pagination.schemas";

const router = Router();

router.get("/", validateQuery(adminPaginationQuerySchema), browse);
router.get("/:id", requireValidId(), read);
router.patch("/:id", requireValidId(), validateBody(messageUpdateSchema), edit);
router.delete("/:id", requireValidId(), destroy);

export default router;

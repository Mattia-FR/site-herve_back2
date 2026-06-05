import { Router } from "express";
import { browse, destroy, edit, read } from "../controllers/messagesAdminController";
import { requireValidId, validateBody } from "../middlewares/validationMiddleware";
import { messageUpdateSchema } from "../validation/messages.schemas";

const router = Router();

router.get("/", browse);
router.get("/:id", requireValidId(), read);
router.patch("/:id", requireValidId(), validateBody(messageUpdateSchema), edit);
router.delete("/:id", requireValidId(), destroy);

export default router;

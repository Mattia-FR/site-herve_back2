import { Router } from "express";
import { browseAll, destroy, edit, read } from "../controllers/guestbookAdminController";
import { requireValidId, validateBody } from "../middlewares/validationMiddleware";
import { guestbookUpdateSchema } from "../validation/guestbook.schemas";

const router = Router();

router.get("/", browseAll);
router.get("/:id", requireValidId(), read);
router.patch("/:id", requireValidId(), validateBody(guestbookUpdateSchema), edit);
router.delete("/:id", requireValidId(), destroy);

export default router;

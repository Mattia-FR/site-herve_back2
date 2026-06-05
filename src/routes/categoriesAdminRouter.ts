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

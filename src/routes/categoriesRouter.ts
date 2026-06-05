import { Router } from "express";
import { browse, read } from "../controllers/categoriesController";
import { requireValidId } from "../middlewares/validationMiddleware";

const router = Router();

router.get("/", browse);
router.get("/:id", requireValidId(), read);

export default router;

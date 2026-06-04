import { Router } from "express";
import { browse, read } from "../controllers/categoriesController";

const router = Router();

router.get("/", browse);
router.get("/:id", read);

export default router;

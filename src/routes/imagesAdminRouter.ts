import { Router } from "express";
import { browse, destroy, edit, read, setCategories } from "../controllers/imagesAdminController";

const router = Router();

router.get("/", browse);
router.get("/:id", read);
router.put("/:id/categories", setCategories);
router.put("/:id", edit);
router.delete("/:id", destroy);

export default router;

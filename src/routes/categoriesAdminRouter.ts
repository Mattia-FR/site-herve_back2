import { Router } from "express";
import { add, browse, destroy, edit } from "../controllers/categoriesAdminController";

const router = Router();

router.get("/", browse);
router.post("/", add);
router.put("/:id", edit);
router.delete("/:id", destroy);

export default router;

import { Router } from "express";
import {
  add,
  browseAll,
  destroy,
  edit,
  readById,
  readBySlug,
} from "../controllers/articlesAdminController";

const router = Router();

router.get("/", browseAll);
router.get("/slug/:slug", readBySlug);
router.get("/:id", readById);
router.post("/", add);
router.put("/:id", edit);
router.delete("/:id", destroy);

export default router;

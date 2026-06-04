import { Router } from "express";
import { browse, destroy, edit, read } from "../controllers/messagesAdminController";

const router = Router();

router.get("/", browse);
router.get("/:id", read);
router.patch("/:id", edit);
router.delete("/:id", destroy);

export default router;

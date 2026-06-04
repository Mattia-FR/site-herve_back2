import { Router } from "express";
import { browseAll, destroy, edit, read } from "../controllers/guestbookAdminController";

const router = Router();

router.get("/", browseAll);
router.get("/:id", read);
router.patch("/:id", edit);
router.delete("/:id", destroy);

export default router;

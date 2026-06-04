import { Router } from "express";
import { edit, readById } from "../controllers/usersAdminController";

const router = Router();

router.get("/:id", readById);
router.put("/:id", edit);

export default router;

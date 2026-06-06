import { Router } from "express";
import { read } from "../controllers/statsAdminController";

const router = Router();

router.get("/", read);

export default router;

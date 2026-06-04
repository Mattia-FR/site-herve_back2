import { Router } from "express";
import { readProfile } from "../controllers/artistController";

const router = Router();

router.get("/", readProfile);

export default router;

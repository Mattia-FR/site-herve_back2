import { Router } from "express";
import { add } from "../controllers/messagesController";

const router = Router();

router.post("/", add);

export default router;

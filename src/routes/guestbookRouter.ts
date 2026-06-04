import { Router } from "express";
import { add, browseApproved } from "../controllers/guestbookController";

const router = Router();

router.get("/", browseApproved);
router.post("/", add);

export default router;

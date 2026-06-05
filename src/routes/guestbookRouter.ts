import { Router } from "express";
import { add, browseApproved } from "../controllers/guestbookController";
import { honeypotGuestbookMiddleware } from "../middlewares/honeypotMiddleware";
import { validateBody } from "../middlewares/validationMiddleware";
import { guestbookCreateSchema } from "../validation/guestbook.schemas";

const router = Router();

router.get("/", browseApproved);
router.post("/", honeypotGuestbookMiddleware, validateBody(guestbookCreateSchema), add);

export default router;

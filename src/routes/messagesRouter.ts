import { Router } from "express";
import { add } from "../controllers/messagesController";
import { honeypotMessageMiddleware } from "../middlewares/honeypotMiddleware";
import { validateBody } from "../middlewares/validationMiddleware";
import { messageCreateSchema } from "../validation/messages.schemas";

const router = Router();

router.post("/", honeypotMessageMiddleware, validateBody(messageCreateSchema), add);

export default router;

import { Router } from "express";
import { create } from "../controllers/clientLogsController";
import { validateBody } from "../middlewares/validationMiddleware";
import { clientLogSchema } from "../validation/clientLogs.schemas";

const router = Router();

router.post("/", validateBody(clientLogSchema), create);

export default router;

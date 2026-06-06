import { Router } from "express";
import { edit, read } from "../controllers/siteSettingsAdminController";
import { validateBody } from "../middlewares/validationMiddleware";
import { siteSettingsUpdateSchema } from "../validation/siteSettings.schemas";

const router = Router();

router.get("/", read);
router.put("/", validateBody(siteSettingsUpdateSchema), edit);

export default router;

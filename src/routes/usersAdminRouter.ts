import { Router } from "express";
import { editMe, readMe } from "../controllers/usersAdminController";
import { validateBody } from "../middlewares/validationMiddleware";
import { userUpdateSchema } from "../validation/users.schemas";

const router = Router();

router.get("/me", readMe);
router.put("/me", validateBody(userUpdateSchema), editMe);

export default router;

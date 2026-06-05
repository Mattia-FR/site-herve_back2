import { Router } from "express";
import { login, logout, refresh } from "../controllers/authController";
import { validateBody } from "../middlewares/validationMiddleware";
import { loginSchema } from "../validation/auth.schemas";

const router = Router();

router.post("/login", validateBody(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;

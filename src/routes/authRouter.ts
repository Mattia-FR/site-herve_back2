/**
 * Routes d'authentification — /api/auth
 *
 * POST /login   → connexion avec email/mot de passe, retourne access token + cookie refresh
 * POST /refresh → renouvelle l'access token via le cookie refresh httpOnly
 * POST /logout  → invalide le cookie refresh (côté client)
 *
 * Le login est soumis à un rate limit de 20 requêtes / 15 min (déclaré dans app.ts).
 */
import { Router } from "express";
import { login, logout, refresh } from "../controllers/authController";
import { validateBody } from "../middlewares/validationMiddleware";
import { loginSchema } from "../validation/auth.schemas";

const router = Router();

// validateBody vérifie que le corps de la requête correspond au schéma Zod attendu
router.post("/login", validateBody(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;

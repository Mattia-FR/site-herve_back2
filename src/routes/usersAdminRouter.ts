/**
 * Routes admin du profil utilisateur connecté — /api/admin/users
 * (toutes protégées par requireAuth via adminRouter.ts)
 *
 * GET /me  → récupérer son propre profil (infos + photo)
 * PUT /me  → mettre à jour son profil (nom, bio, tagline, mot de passe, photo)
 *
 * Seul le compte connecté (req.user.userId) peut modifier son propre profil.
 * Il n'y a pas de route pour gérer d'autres utilisateurs (pas de route /:id admin).
 */
import { Router } from "express";
import { editMe, readMe } from "../controllers/usersAdminController";
import { validateBody } from "../middlewares/validationMiddleware";
import { userUpdateSchema } from "../validation/users.schemas";

const router = Router();

router.get("/me", readMe);
router.put("/me", validateBody(userUpdateSchema), editMe);

export default router;

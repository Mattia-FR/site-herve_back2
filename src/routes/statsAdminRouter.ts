/**
 * Routes admin des statistiques — /api/admin/stats
 * (protégées par requireAuth via adminRouter.ts)
 *
 * GET / → retourne les statistiques du dashboard :
 *         nombre d'articles, d'images, de messages non lus, d'entrées livre d'or en attente, etc.
 */
import { Router } from "express";
import { read } from "../controllers/statsAdminController";

const router = Router();

router.get("/", read);

export default router;

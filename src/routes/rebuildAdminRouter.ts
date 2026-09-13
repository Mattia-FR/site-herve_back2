/**
 * Routeur admin — rebuild du frontend SSG.
 *
 * Rôle : expose un endpoint POST unique pour déclencher un rebuild du frontend.
 * Monté sous "/api/admin/rebuild" dans adminRouter.ts.
 * Automatiquement protégé par requireAuth (appliqué en amont dans adminRouter).
 *
 * Route disponible :
 *   POST /api/admin/rebuild → déclenche un rebuild via fichier trigger
 */
import { Router } from "express";
import { triggerRebuild } from "../controllers/rebuildController";

const router = Router();

router.post("/", triggerRebuild);

export default router;

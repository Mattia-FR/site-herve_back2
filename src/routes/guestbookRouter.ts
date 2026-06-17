/**
 * Routes publiques du livre d'or — /api/guestbook
 *
 * GET /  → liste des entrées approuvées (statut = "approved")
 * POST / → soumettre une nouvelle entrée (en attente de modération)
 *
 * Pipeline de protection sur POST (ordre d'exécution) :
 *   1. honeypotGuestbookMiddleware — détecte les bots (champ caché "website")
 *   2. validateBody                — valide les champs via Zod
 *   3. add (controller)            — enregistre l'entrée (statut "pending") et envoie un email
 *
 * Rate limit : 5 entrées / heure par IP (déclaré dans app.ts).
 */
import { Router } from "express";
import { add, browseApproved } from "../controllers/guestbookController";
import { honeypotGuestbookMiddleware } from "../middlewares/honeypotMiddleware";
import { validateBody } from "../middlewares/validationMiddleware";
import { guestbookCreateSchema } from "../validation/guestbook.schemas";

const router = Router();

router.get("/", browseApproved);
router.post("/", honeypotGuestbookMiddleware, validateBody(guestbookCreateSchema), add);

export default router;

/**
 * Routes publiques des messages de contact — /api/messages
 *
 * POST / → envoyer un message de contact
 *
 * Pipeline de protection (ordre d'exécution) :
 *   1. honeypotMessageMiddleware — détecte les bots (champ caché "website")
 *   2. validateBody              — valide les champs du formulaire via Zod
 *   3. add (controller)          — enregistre le message et envoie un email si EMAIL_ENABLED
 *
 * Rate limit : 10 messages / heure par IP (déclaré dans app.ts).
 */
import { Router } from "express";
import { add } from "../controllers/messagesController";
import { honeypotMessageMiddleware } from "../middlewares/honeypotMiddleware";
import { validateBody } from "../middlewares/validationMiddleware";
import { messageCreateSchema } from "../validation/messages.schemas";

const router = Router();

router.post("/", honeypotMessageMiddleware, validateBody(messageCreateSchema), add);

export default router;

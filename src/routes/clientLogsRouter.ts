/**
 * Routes de remontée des logs client — /api/client-logs
 *
 * POST / → reçoit une erreur survenue côté frontend et la logue côté serveur.
 *
 * Activé uniquement si CLIENT_LOG_ENABLED=true dans les variables d'environnement.
 * Permet de centraliser les erreurs JS/réseau du frontend dans les logs Winston.
 * Rate limit : 30 requêtes / 15 min par IP (déclaré dans app.ts).
 */
import { Router } from "express";
import { create } from "../controllers/clientLogsController";
import { validateBody } from "../middlewares/validationMiddleware";
import { clientLogSchema } from "../validation/clientLogs.schemas";

const router = Router();

router.post("/", validateBody(clientLogSchema), create);

export default router;

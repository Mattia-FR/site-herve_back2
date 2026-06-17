/**
 * Controller — remontée des logs client (frontend).
 *
 * Rôle : recevoir les erreurs JavaScript survenues côté frontend et les enregistrer
 * dans les logs Winston côté serveur pour centraliser la surveillance des erreurs.
 *
 * Route correspondante : POST /api/client-logs
 * Activé uniquement si CLIENT_LOG_ENABLED=true (variable d'environnement).
 * Si désactivé, retourne 204 silencieusement sans rien logguer.
 */
import type { Request, Response } from "express";
import type { z } from "zod";
import { env } from "../config/env";
import logger from "../config/logger";
import { asyncHandler } from "../utils/asyncHandler";
import { getValidatedBody } from "../utils/http/requestHelpers";
import type { clientLogSchema } from "../validation/clientLogs.schemas";

type ClientLogBody = z.infer<typeof clientLogSchema>;

/**
 * POST /api/client-logs
 * Logue l'erreur reçue au niveau "warn" (visible en prod) avec le requestId
 * pour corréler avec les logs serveur de la même session.
 */
const create = asyncHandler(async (req: Request, res: Response) => {
  if (!env.CLIENT_LOG_ENABLED) {
    res.status(204).end();
    return;
  }

  const body = getValidatedBody<ClientLogBody>(req);
  logger.warn({
    kind: "client", // distingue les logs client des logs serveur dans les outils de monitoring
    requestId: req.requestId,
    ...body,
  });

  res.status(204).end();
});

export { create };

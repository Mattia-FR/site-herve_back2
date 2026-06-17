/**
 * Attache un identifiant unique à chaque requête pour la corrélation des logs.
 *
 * Rôle : générer un UUID v4 par requête et le stocker dans req.requestId.
 * Cet identifiant est ensuite inclus dans tous les logs Winston (httpLog,
 * logHelpers) pour permettre de relier tous les événements d'une même requête.
 *
 * Couche : Middleware — à monter en PREMIER dans app.ts, avant tout autre
 * middleware qui pourrait logguer.
 */
import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.requestId = randomUUID();
  next();
}

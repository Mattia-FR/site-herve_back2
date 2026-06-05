/**
 * Attache un identifiant unique à chaque requête pour la corrélation des logs.
 *
 * Couche : Middleware — à monter en premier dans app.ts.
 */
import { randomUUID } from "crypto";
import type { NextFunction, Request, Response } from "express";

export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.requestId = randomUUID();
  next();
}

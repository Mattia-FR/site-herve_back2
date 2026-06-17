/**
 * Middleware 404 — route inconnue.
 *
 * Rôle : intercepter toutes les requêtes qui n'ont pas matché de route définie
 * et retourner une erreur 404 structurée avec la méthode et l'URL demandées.
 *
 * Monté en dernier (via setImmediate dans app.ts) après tous les routeurs.
 */
import type { NextFunction, Request, Response } from "express";
import { routeNotFoundMessage } from "../config/errorCodes";
import { RouteNotFoundError } from "../errors/AppError";
import { sendError } from "../utils/sendError";

export function notFound(req: Request, res: Response, _next: NextFunction) {
  sendError(res, new RouteNotFoundError(routeNotFoundMessage(req.method, req.originalUrl)));
}

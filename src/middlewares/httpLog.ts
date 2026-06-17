/**
 * Log HTTP structuré pour chaque requête/réponse.
 *
 * Rôle : mesurer et enregistrer les informations de chaque requête HTTP
 * (méthode, URL, statut, durée) via Winston au niveau "http".
 *
 * Couche : Middleware — monté après requestId dans app.ts pour disposer
 * de req.requestId dans le log.
 *
 * Mesure de performance : utilise process.hrtime.bigint() (résolution nanoseconde)
 * pour calculer la durée entre l'entrée du middleware et l'événement res.finish
 * (fin de l'envoi de la réponse au client).
 */
import type { NextFunction, Request, Response } from "express";
import logger from "../config/logger";

export function httpLogMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();

  // L'événement "finish" se déclenche quand la réponse a été entièrement envoyée.
  // On l'utilise plutôt que "close" pour ne logger que les réponses complètes.
  res.on("finish", () => {
    // Conversion : bigint nanoseconds → millisecondes avec 1 décimale
    const durationMs = Math.round((Number(process.hrtime.bigint() - start) / 1_000_000) * 10) / 10;

    logger.http({
      message: `${req.method} ${req.originalUrl}`,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs,
      requestId: req.requestId,
    });
  });

  next();
}

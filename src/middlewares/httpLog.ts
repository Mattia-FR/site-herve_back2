/**
 * Log HTTP structuré pour chaque requête/réponse.
 *
 * Couche : Middleware — monté après requestId dans app.ts.
 * Mesure la durée entre l'entrée du middleware et l'événement res.finish.
 */
import type { NextFunction, Request, Response } from "express";
import logger from "../config/logger";

export function httpLogMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
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

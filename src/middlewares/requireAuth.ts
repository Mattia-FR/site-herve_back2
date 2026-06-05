import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import logger from "../config/logger";
import { InternalError, UnauthorizedError } from "../errors/AppError";
import { sendError } from "../utils/sendError";

interface JwtPayload {
  userId: number;
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1] || null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    sendError(res, new UnauthorizedError());
    return;
  }

  const accessSecret = process.env.ACCESS_TOKEN_SECRET;
  if (!accessSecret) {
    logger.error({ message: "ACCESS_TOKEN_SECRET non défini" });
    sendError(res, new InternalError());
    return;
  }

  try {
    const payload = jwt.verify(token, accessSecret) as JwtPayload;

    if (typeof payload.userId !== "number") {
      sendError(res, new UnauthorizedError("Token invalide", "TOKEN_INVALID"));
      return;
    }

    req.user = { userId: payload.userId };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      sendError(res, new UnauthorizedError("Session expirée", "TOKEN_EXPIRED"));
      return;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      sendError(res, new UnauthorizedError("Token invalide", "TOKEN_INVALID"));
      return;
    }
    logger.error({ message: "Erreur vérification token", err, requestId: req.requestId });
    sendError(res, new InternalError());
  }
}

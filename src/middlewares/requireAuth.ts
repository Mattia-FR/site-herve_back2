/**
 * Middleware d'authentification JWT — protège les routes admin.
 *
 * Rôle : extraire et vérifier le Bearer token dans l'en-tête Authorization,
 * puis injecter le userId décodé dans req.user pour les controllers en aval.
 *
 * Format attendu : Authorization: Bearer <access_token>
 * Durée de vie du token : 15 minutes (configuré dans authController).
 *
 * Codes d'erreur retournés :
 *   - 401 UNAUTHORIZED    : en-tête absent ou format invalide
 *   - 401 TOKEN_EXPIRED   : token expiré (le client doit appeler /api/auth/refresh)
 *   - 401 TOKEN_INVALID   : token malformé ou signé avec une mauvaise clé
 *   - 500 INTERNAL_ERROR  : erreur inattendue lors de la vérification
 */
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { DEFAULT_ERROR_MESSAGES, ErrorCode } from "../config/errorCodes";
import { InternalError, UnauthorizedError } from "../errors/AppError";
import { logError } from "../utils/log/logHelpers";
import { sendError } from "../utils/sendError";

/** Structure attendue du payload JWT. */
interface JwtPayload {
  userId: number;
}

/**
 * Extrait le token Bearer depuis l'en-tête Authorization.
 * @returns Le token string, ou null si absent / mal formé
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1] || null;
}

/**
 * Middleware requireAuth : vérifie le JWT et peuple req.user.
 * À utiliser comme middleware Express sur les routes protégées.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    sendError(res, new UnauthorizedError());
    return;
  }

  try {
    const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as JwtPayload;

    // Vérification supplémentaire : s'assurer que userId est bien un nombre
    // (le payload pourrait être altéré si la clé secrète est faible)
    if (typeof payload.userId !== "number") {
      sendError(
        res,
        new UnauthorizedError(
          DEFAULT_ERROR_MESSAGES[ErrorCode.TOKEN_INVALID],
          ErrorCode.TOKEN_INVALID
        )
      );
      return;
    }

    // Injecte le userId dans la requête pour les controllers en aval
    req.user = { userId: payload.userId };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      sendError(
        res,
        new UnauthorizedError(
          DEFAULT_ERROR_MESSAGES[ErrorCode.TOKEN_EXPIRED],
          ErrorCode.TOKEN_EXPIRED
        )
      );
      return;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      sendError(
        res,
        new UnauthorizedError(
          DEFAULT_ERROR_MESSAGES[ErrorCode.TOKEN_INVALID],
          ErrorCode.TOKEN_INVALID
        )
      );
      return;
    }
    logError("Erreur vérification token", err, req);
    sendError(res, new InternalError());
  }
}

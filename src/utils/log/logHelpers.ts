/**
 * Helpers de logging structuré avec contexte requête.
 *
 * Couche : Utils log — wrapper autour de logger Winston (structure + contexte).
 * La redaction des champs sensibles est appliquée par le format Winston (logger.ts).
 * Utilisé par : errorHandler, requireAuth, startup, controllers en cas d'erreur.
 */
import type { Request } from "express";
import logger from "../../config/logger";

/** Contexte minimal extrait d'une requête Express pour enrichir les logs. */
export interface RequestLogContext {
  method?: string;
  path?: string;
  userId?: number;
}

/**
 * Extrait method, path et userId JWT pour corréler les logs à une requête.
 */
export function getRequestLogContext(req?: Request): RequestLogContext {
  if (!req) return {};
  return {
    method: req.method,
    path: req.path,
    userId: req.user?.userId,
  };
}

function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }
  return { value: err };
}

type LogMeta = Record<string, unknown>;

/**
 * Log d'erreur structuré avec contexte requête.
 */
export function logError(message: string, err: unknown, req?: Request, extra?: LogMeta): void {
  logger.error({
    message,
    ...getRequestLogContext(req),
    ...extra,
    err: serializeError(err),
  });
}

/**
 * Log d'avertissement avec contexte requête (ex. token expiré).
 */
export function logWarn(message: string, req?: Request, extra?: LogMeta): void {
  logger.warn({ message, ...getRequestLogContext(req), ...extra });
}

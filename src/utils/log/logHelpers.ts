/**
 * Helpers de logging structuré avec contexte requête.
 *
 * Couche : Utils log — wrapper autour de logger Winston avec redaction automatique.
 * Utilisé par : errorHandler, requireAuth, startup, controllers en cas d'erreur.
 */
import type { Request } from "express";
import logger from "../../config/logger";
import { redact } from "./logRedact";

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
 * Log d'erreur structuré avec contexte requête et redaction centralisée.
 */
export function logError(
  message: string,
  err: unknown,
  req?: Request,
  extra?: LogMeta,
): void {
  const payload = redact({
    message,
    ...getRequestLogContext(req),
    ...extra,
    err: serializeError(err),
  });
  logger.error(payload);
}

/**
 * Log d'avertissement avec contexte requête (ex. token expiré).
 */
export function logWarn(message: string, req?: Request, extra?: LogMeta): void {
  logger.warn(redact({ message, ...getRequestLogContext(req), ...extra }));
}

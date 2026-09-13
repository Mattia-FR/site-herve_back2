/**
 * Hiérarchie des erreurs applicatives.
 *
 * Rôle : fournir des classes d'erreur typées que les controllers, models et
 * middlewares peuvent lancer. L'errorHandler les intercepte et les convertit
 * en réponses JSON uniformes.
 *
 * Structure :
 *   AppError (base)
 *   ├── NotFoundError          → 404, code NOT_FOUND (ressource métier)
 *   ├── RouteNotFoundError     → 404, code ROUTE_NOT_FOUND (endpoint inconnu)
 *   ├── ValidationError        → 400, code VALIDATION_ERROR (cas simple)
 *   ├── ValidationFailedError  → 400, code VALIDATION_FAILED + détails par champ (Zod)
 *   ├── UnauthorizedError      → 401, code UNAUTHORIZED / TOKEN_EXPIRED / TOKEN_INVALID
 *   ├── BadRequestError        → 400, code BAD_REQUEST / INVALID_ID
 *   ├── TooManyRequestsError   → 429, code RATE_LIMITED
 *   └── InternalError          → 500, code INTERNAL_ERROR
 *
 * Usage : throw new NotFoundError(NotFoundResource.ARTICLE)
 */
import {
  DEFAULT_ERROR_MESSAGES,
  ErrorCode,
  type ErrorCodeValue,
  NOT_FOUND_RESOURCE_MESSAGES,
  type NotFoundResourceValue,
} from "../config/errorCodes";
import type { ValidationDetail } from "../types/apiError";

/** Classe de base pour toutes les erreurs de l'application. */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: ErrorCodeValue,
    public readonly details?: ValidationDetail[]
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Ressource métier introuvable (article, image, utilisateur, etc.).
 * Le message est automatiquement sélectionné depuis NOT_FOUND_RESOURCE_MESSAGES.
 */
export class NotFoundError extends AppError {
  constructor(resource: NotFoundResourceValue) {
    super(NOT_FOUND_RESOURCE_MESSAGES[resource], 404, ErrorCode.NOT_FOUND);
  }
}

/** Route HTTP inexistante (endpoint non défini dans les routeurs). */
export class RouteNotFoundError extends AppError {
  constructor(message = DEFAULT_ERROR_MESSAGES[ErrorCode.ROUTE_NOT_FOUND]) {
    super(message, 404, ErrorCode.ROUTE_NOT_FOUND);
  }
}

/** Erreur de validation générique (sans détail par champ). */
export class ValidationError extends AppError {
  constructor(message = DEFAULT_ERROR_MESSAGES[ErrorCode.VALIDATION_ERROR]) {
    super(message, 400, ErrorCode.VALIDATION_ERROR);
  }
}

/**
 * Échec de validation Zod avec détail par champ (compatible frontend).
 * Utilisé par validationMiddleware.ts après un safeParse() échoué.
 */
export class ValidationFailedError extends AppError {
  constructor(
    details: ValidationDetail[],
    message = DEFAULT_ERROR_MESSAGES[ErrorCode.VALIDATION_FAILED]
  ) {
    super(message, 400, ErrorCode.VALIDATION_FAILED, details);
  }
}

/**
 * Authentification manquante ou invalide.
 * Le code peut être précisé (UNAUTHORIZED, TOKEN_EXPIRED, TOKEN_INVALID).
 */
export class UnauthorizedError extends AppError {
  constructor(
    message = DEFAULT_ERROR_MESSAGES[ErrorCode.UNAUTHORIZED],
    code: ErrorCodeValue = ErrorCode.UNAUTHORIZED
  ) {
    super(message, 401, code);
  }
}

/**
 * Requête invalide (ID non numérique, paramètre manquant, etc.).
 * Le code peut être précisé (BAD_REQUEST, INVALID_ID, etc.).
 */
export class BadRequestError extends AppError {
  constructor(
    message = DEFAULT_ERROR_MESSAGES[ErrorCode.BAD_REQUEST],
    code: ErrorCodeValue = ErrorCode.BAD_REQUEST
  ) {
    super(message, 400, code);
  }
}

/** Trop de requêtes (rate limiting). */
export class TooManyRequestsError extends AppError {
  constructor(message = DEFAULT_ERROR_MESSAGES[ErrorCode.RATE_LIMITED]) {
    super(message, 429, ErrorCode.RATE_LIMITED);
  }
}

/** Erreur interne serveur — ne jamais exposer de détails techniques au client. */
export class InternalError extends AppError {
  constructor(message = DEFAULT_ERROR_MESSAGES[ErrorCode.INTERNAL_ERROR]) {
    super(message, 500, ErrorCode.INTERNAL_ERROR);
  }
}

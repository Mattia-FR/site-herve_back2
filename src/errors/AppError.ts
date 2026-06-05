import type { ValidationDetail } from "../types/apiError";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly details?: ValidationDetail[]
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} introuvable`, 404, "NOT_FOUND");
  }
}

export class RouteNotFoundError extends AppError {
  constructor(message = "Route introuvable") {
    super(message, 404, "ROUTE_NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

/** Échec de validation Zod avec détail par champ (compatible front). */
export class ValidationFailedError extends AppError {
  constructor(details: ValidationDetail[], message = "Validation échouée") {
    super(message, 400, "VALIDATION_FAILED", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentification requise", code = "UNAUTHORIZED") {
    super(message, 401, code);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, code = "BAD_REQUEST") {
    super(message, 400, code);
  }
}

export class InternalError extends AppError {
  constructor(message = "Une erreur interne est survenue") {
    super(message, 500, "INTERNAL_ERROR");
  }
}

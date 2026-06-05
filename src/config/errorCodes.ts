/**
 * Codes d'erreur machine et messages par défaut de l'API.
 *
 * Couche : Config — référence centralisée pour AppError, sendError et le frontend.
 * Sync : garder en sync avec site-herve_front2/src/types/api.ts et GESTION-ERREURS.md.
 */

/** Codes machine stables pour le front et les logs. */
export const ErrorCode = {
  NOT_FOUND: "NOT_FOUND",
  ROUTE_NOT_FOUND: "ROUTE_NOT_FOUND",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  BAD_REQUEST: "BAD_REQUEST",
  INVALID_ID: "INVALID_ID",
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  FILE_REQUIRED: "FILE_REQUIRED",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  FILE_TYPE_NOT_ALLOWED: "FILE_TYPE_NOT_ALLOWED",
  IMAGE_DIMENSIONS_TOO_LARGE: "IMAGE_DIMENSIONS_TOO_LARGE",
  IMAGE_INVALID: "IMAGE_INVALID",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

/** Union des valeurs possibles de ErrorCode. */
export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

/** Messages par défaut (français) associés à chaque code d'erreur. */
export const DEFAULT_ERROR_MESSAGES: Record<ErrorCodeValue, string> = {
  [ErrorCode.NOT_FOUND]: "Ressource introuvable",
  [ErrorCode.ROUTE_NOT_FOUND]: "Route introuvable",
  [ErrorCode.VALIDATION_FAILED]: "Validation échouée",
  [ErrorCode.VALIDATION_ERROR]: "Données invalides",
  [ErrorCode.BAD_REQUEST]: "Requête invalide",
  [ErrorCode.INVALID_ID]: "ID invalide",
  [ErrorCode.UNAUTHORIZED]: "Authentification requise",
  [ErrorCode.INVALID_CREDENTIALS]: "Email ou mot de passe incorrect",
  [ErrorCode.TOKEN_EXPIRED]: "Session expirée",
  [ErrorCode.TOKEN_INVALID]: "Token invalide",
  [ErrorCode.FILE_REQUIRED]: "Fichier image requis",
  [ErrorCode.FILE_TOO_LARGE]: "Fichier trop volumineux (max 10 Mo)",
  [ErrorCode.FILE_TYPE_NOT_ALLOWED]: "Type de fichier non autorisé",
  [ErrorCode.IMAGE_DIMENSIONS_TOO_LARGE]: "Image trop grande",
  [ErrorCode.IMAGE_INVALID]: "Fichier image invalide ou illisible",
  [ErrorCode.RATE_LIMITED]: "Trop de requêtes",
  [ErrorCode.INTERNAL_ERROR]: "Une erreur interne est survenue",
};

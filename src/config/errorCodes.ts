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
  CURRENT_PASSWORD_INCORRECT: "CURRENT_PASSWORD_INCORRECT",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  FILE_REQUIRED: "FILE_REQUIRED",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  FILE_TYPE_NOT_ALLOWED: "FILE_TYPE_NOT_ALLOWED",
  IMAGE_DIMENSIONS_TOO_LARGE: "IMAGE_DIMENSIONS_TOO_LARGE",
  IMAGE_INVALID: "IMAGE_INVALID",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
  INVALID_REFERENCE: "INVALID_REFERENCE",
  UPLOAD_ERROR: "UPLOAD_ERROR",
  INVALID_CATEGORIES: "INVALID_CATEGORIES",
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
  [ErrorCode.CURRENT_PASSWORD_INCORRECT]: "Le mot de passe actuel est incorrect",
  [ErrorCode.TOKEN_EXPIRED]: "Session expirée",
  [ErrorCode.TOKEN_INVALID]: "Token invalide",
  [ErrorCode.FILE_REQUIRED]: "Fichier image requis",
  [ErrorCode.FILE_TOO_LARGE]: "Fichier trop volumineux (max 10 Mo)",
  [ErrorCode.FILE_TYPE_NOT_ALLOWED]: "Type de fichier non autorisé",
  [ErrorCode.IMAGE_DIMENSIONS_TOO_LARGE]: "Image trop grande",
  [ErrorCode.IMAGE_INVALID]: "Fichier image invalide ou illisible",
  [ErrorCode.RATE_LIMITED]: "Trop de requêtes",
  [ErrorCode.INTERNAL_ERROR]: "Une erreur interne est survenue",
  [ErrorCode.DUPLICATE_ENTRY]: "Cette valeur existe déjà",
  [ErrorCode.INVALID_REFERENCE]: "Référence invalide",
  [ErrorCode.UPLOAD_ERROR]: "Erreur lors de l'upload",
  [ErrorCode.INVALID_CATEGORIES]: "Une ou plusieurs catégories sont invalides",
};

/** Ressources métier pour les erreurs 404 typées. */
export const NotFoundResource = {
  ARTICLE: "ARTICLE",
  IMAGE: "IMAGE",
  MESSAGE: "MESSAGE",
  GUESTBOOK_ENTRY: "GUESTBOOK_ENTRY",
  CATEGORY: "CATEGORY",
  USER: "USER",
  SITE_SETTINGS: "SITE_SETTINGS",
  ARTIST_PROFILE: "ARTIST_PROFILE",
} as const;

export type NotFoundResourceValue = (typeof NotFoundResource)[keyof typeof NotFoundResource];

/** Messages 404 par ressource métier. */
export const NOT_FOUND_RESOURCE_MESSAGES: Record<NotFoundResourceValue, string> = {
  [NotFoundResource.ARTICLE]: "Article introuvable",
  [NotFoundResource.IMAGE]: "Image introuvable",
  [NotFoundResource.MESSAGE]: "Message introuvable",
  [NotFoundResource.GUESTBOOK_ENTRY]: "Entrée introuvable",
  [NotFoundResource.CATEGORY]: "Catégorie introuvable",
  [NotFoundResource.USER]: "Utilisateur introuvable",
  [NotFoundResource.SITE_SETTINGS]: "Paramètres du site introuvables",
  [NotFoundResource.ARTIST_PROFILE]: "Profil artiste introuvable",
};

/** Message 404 pour une route HTTP inconnue. */
export function routeNotFoundMessage(method: string, url: string): string {
  return `Route ${method} ${url} introuvable`;
}

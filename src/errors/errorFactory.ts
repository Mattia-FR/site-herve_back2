/**
 * Factory pour créer des instances AppError de façon concise.
 *
 * Rôle : simplifier la création d'erreurs typées dans les middlewares et controllers
 * sans avoir à construire une sous-classe dédiée. Utilisé notamment dans errorHandler.ts
 * pour mapper les erreurs Multer et MySQL vers les codes de l'API.
 *
 * Exemple :
 *   createAppError(400, ErrorCode.DUPLICATE_ENTRY)
 *   createAppError(404, ErrorCode.NOT_FOUND, "Article introuvable")
 */
import { DEFAULT_ERROR_MESSAGES, type ErrorCodeValue } from "../config/errorCodes";
import type { ValidationDetail } from "../types/apiError";
import { AppError } from "./AppError";

/**
 * Crée une AppError avec le code HTTP, le code machine et un message optionnel.
 * @param statusCode      - Code HTTP de la réponse (400, 404, 500, etc.)
 * @param code            - Code machine de l'erreur (ErrorCode.*)
 * @param messageOverride - Message personnalisé (sinon : DEFAULT_ERROR_MESSAGES[code])
 * @param details         - Détails de validation par champ (optionnel)
 * @returns Instance AppError prête à être envoyée via sendError()
 */
export function createAppError(
  statusCode: number,
  code: ErrorCodeValue,
  messageOverride?: string,
  details?: ValidationDetail[]
): AppError {
  return new AppError(messageOverride ?? DEFAULT_ERROR_MESSAGES[code], statusCode, code, details);
}

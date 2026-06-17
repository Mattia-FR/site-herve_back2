/**
 * Utilitaire pour envoyer une réponse d'erreur JSON uniforme.
 *
 * Rôle : formater une AppError en réponse JSON conforme au contrat de l'API
 * (type ApiErrorBody) et l'envoyer avec le code HTTP approprié.
 *
 * Format de réponse :
 *   { success: false, code: "ERROR_CODE", message: "...", details?: [...] }
 *
 * `details` n'est inclus que si l'erreur contient des détails de validation
 * par champ (cas de ValidationFailedError).
 */
import type { Response } from "express";
import type { AppError } from "../errors/AppError";
import type { ApiErrorBody } from "../types/apiError";

export type { ApiErrorBody } from "../types/apiError";

/**
 * Sérialise une AppError en réponse HTTP JSON.
 * @param res - Objet Response Express
 * @param err - Erreur applicative à sérialiser
 */
export function sendError(res: Response, err: AppError): void {
  const body: ApiErrorBody = {
    success: false,
    code: err.code,
    message: err.message,
    // details est omis de la réponse s'il est vide pour ne pas exposer de structure inutile
    ...(err.details?.length ? { details: err.details } : {}),
  };
  res.status(err.statusCode).json(body);
}

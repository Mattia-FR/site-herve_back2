/**
 * Helpers pour accéder aux données validées de la requête Express.
 *
 * Rôle : fournir des accesseurs typés et sûrs pour lire les données
 * injectées par les middlewares de validation dans les propriétés étendues
 * de req (validatedBody, validatedQuery, validatedParams, validatedId, user).
 *
 * Ces fonctions lèvent une erreur interne (jamais 400) si le middleware
 * correspondant n'a pas été appliqué — c'est un bug de configuration de route,
 * pas une erreur utilisateur.
 *
 * Convention : les controllers ne lisent JAMAIS req.body directement,
 * ils utilisent toujours getValidatedBody() pour garantir que les données
 * ont été validées par Zod.
 */
import type { Request } from "express";
import { DEFAULT_ERROR_MESSAGES, ErrorCode } from "../../config/errorCodes";
import { BadRequestError } from "../../errors/AppError";

/**
 * Retourne req.validatedId (injecté par requireValidId).
 * Lance une erreur interne si le middleware n'a pas été appliqué.
 */
export function getValidatedId(req: Request): number {
  const { validatedId } = req;
  if (validatedId === undefined) {
    throw new Error("req.validatedId manquant : middleware requireValidId requis");
  }
  return validatedId;
}

/**
 * Retourne req.user.userId (injecté par requireAuth).
 * Lance une erreur interne si le middleware n'a pas été appliqué.
 */
export function getAuthUserId(req: Request): number {
  const userId = req.user?.userId;
  if (userId === undefined) {
    throw new Error("req.user manquant : middleware requireAuth requis");
  }
  return userId;
}

/**
 * Retourne req.validatedBody casté vers le type T (injecté par validateBody).
 * Lance une erreur interne si le middleware n'a pas été appliqué.
 */
export function getValidatedBody<T>(req: Request): T {
  const { validatedBody } = req;
  if (validatedBody === undefined) {
    throw new Error("req.validatedBody manquant : middleware validateBody requis");
  }
  return validatedBody as T;
}

/**
 * Retourne req.validatedQuery casté vers le type T (injecté par validateQuery).
 * Lance une erreur interne si le middleware n'a pas été appliqué.
 */
export function getValidatedQuery<T>(req: Request): T {
  const { validatedQuery } = req;
  if (validatedQuery === undefined) {
    throw new Error("req.validatedQuery manquant : middleware validateQuery requis");
  }
  return validatedQuery as T;
}

/**
 * Retourne req.validatedParams casté vers le type T (injecté par validateParams).
 * Lance une erreur interne si le middleware n'a pas été appliqué.
 */
export function getValidatedParams<T>(req: Request): T {
  const { validatedParams } = req;
  if (validatedParams === undefined) {
    throw new Error("req.validatedParams manquant : middleware validateParams requis");
  }
  return validatedParams as T;
}

/**
 * Retourne req.file (injecté par Multer).
 * Lance BadRequestError FILE_REQUIRED si aucun fichier n'a été uploadé.
 */
export function getUploadedFile(req: Request): Express.Multer.File {
  if (!req.file) {
    throw new BadRequestError(
      DEFAULT_ERROR_MESSAGES[ErrorCode.FILE_REQUIRED],
      ErrorCode.FILE_REQUIRED
    );
  }
  return req.file;
}

/**
 * Gestionnaire d'erreurs global — dernier middleware Express de la chaîne.
 *
 * Rôle : intercepter toutes les erreurs propagées via next(err) ou lancées dans
 * les handlers async (via asyncHandler), les normaliser et renvoyer une réponse
 * JSON uniforme.
 *
 * Ordre de traitement :
 *   1. AppError (erreurs métier typées)        → réponse directe via sendError
 *   2. MulterError (upload)                    → mapping vers FILE_TOO_LARGE / FILE_TYPE_NOT_ALLOWED
 *   3. Erreurs MySQL (ER_DUP_ENTRY, ER_NO_REFERENCED_ROW_2) → DUPLICATE_ENTRY / INVALID_REFERENCE
 *   4. Tout autre cas                          → InternalError (500)
 *
 * Toutes les erreurs sont également loguées via logError (Winston).
 */
import type { ErrorRequestHandler } from "express";
import multer from "multer";
import { ErrorCode, type ErrorCodeValue } from "../config/errorCodes";
import { AppError, InternalError } from "../errors/AppError";
import { createAppError } from "../errors/errorFactory";
import { logError } from "../utils/log/logHelpers";
import { sendError } from "../utils/sendError";

/** Interface minimale pour accéder au code d'erreur MySQL. */
interface MysqlError extends Error {
  code?: string;
}

/** Correspondance entre les codes Multer et les ErrorCode de l'API. */
const MULTER_ERROR_CODE_MAP: Record<string, ErrorCodeValue> = {
  LIMIT_FILE_SIZE: ErrorCode.FILE_TOO_LARGE,
  LIMIT_UNEXPECTED_FILE: ErrorCode.FILE_TYPE_NOT_ALLOWED,
};

/** Correspondance entre les codes d'erreur MySQL et les ErrorCode de l'API. */
const MYSQL_ERROR_CODE_MAP: Record<string, ErrorCodeValue> = {
  ER_DUP_ENTRY: ErrorCode.DUPLICATE_ENTRY, // violation de contrainte UNIQUE
  ER_NO_REFERENCED_ROW_2: ErrorCode.INVALID_REFERENCE, // violation de contrainte FK
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  logError("Erreur non gérée", err, req);

  // 1. Erreurs métier de l'application (NotFoundError, ValidationFailedError, etc.)
  if (err instanceof AppError) {
    sendError(res, err);
    return;
  }

  // 2. Erreurs Multer (taille dépassée, type non autorisé)
  if (err instanceof multer.MulterError) {
    const mappedCode = MULTER_ERROR_CODE_MAP[err.code];
    if (mappedCode) {
      sendError(res, createAppError(400, mappedCode));
      return;
    }
    sendError(res, createAppError(400, ErrorCode.UPLOAD_ERROR));
    return;
  }

  // 3. Erreurs MySQL connues (doublon, référence invalide)
  const mysqlErr = err as MysqlError;
  const mysqlMappedCode = mysqlErr.code ? MYSQL_ERROR_CODE_MAP[mysqlErr.code] : undefined;
  if (mysqlMappedCode) {
    sendError(res, createAppError(400, mysqlMappedCode));
    return;
  }

  // 4. Erreur inconnue → 500 générique (le détail est dans les logs, pas dans la réponse)
  sendError(res, new InternalError());
};

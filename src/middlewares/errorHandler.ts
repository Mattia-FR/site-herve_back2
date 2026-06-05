import type { ErrorRequestHandler } from "express";
import multer from "multer";
import logger from "../config/logger";
import { AppError, BadRequestError, InternalError, ValidationError } from "../errors/AppError";
import { sendError } from "../utils/sendError";

interface MysqlError extends Error {
  code?: string;
}

const MULTER_MESSAGES: Record<string, { message: string; code: string }> = {
  LIMIT_FILE_SIZE: {
    message: "Fichier trop volumineux (max 10 Mo)",
    code: "FILE_TOO_LARGE",
  },
  LIMIT_UNEXPECTED_FILE: {
    message: "Type de fichier non autorisé",
    code: "FILE_TYPE_NOT_ALLOWED",
  },
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  logger.error({
    message: err instanceof Error ? err.message : "Unknown error",
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    err,
  });

  if (err instanceof AppError) {
    sendError(res, err);
    return;
  }

  if (err instanceof multer.MulterError) {
    const mapped = MULTER_MESSAGES[err.code];
    if (mapped) {
      sendError(res, new BadRequestError(mapped.message, mapped.code));
      return;
    }
    sendError(res, new BadRequestError("Erreur lors de l'upload"));
    return;
  }

  const mysqlErr = err as MysqlError;
  if (mysqlErr.code === "ER_DUP_ENTRY") {
    sendError(res, new ValidationError("Cette valeur existe déjà"));
    return;
  }

  if (mysqlErr.code === "ER_NO_REFERENCED_ROW_2") {
    sendError(res, new ValidationError("Référence invalide"));
    return;
  }

  sendError(res, new InternalError());
};

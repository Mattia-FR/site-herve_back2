import type { ErrorRequestHandler } from "express";
import logger from "../config/logger";
import { AppError, ValidationError } from "../errors/AppError";

interface MysqlError extends Error {
  code?: string;
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  logger.error({
    message: err instanceof Error ? err.message : "Unknown error",
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    err,
  });

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
    });
    return;
  }

  const mysqlErr = err as MysqlError;
  if (mysqlErr.code === "ER_DUP_ENTRY") {
    const valErr = new ValidationError("Cette valeur existe déjà");
    res.status(valErr.statusCode).json({
      success: false,
      code: valErr.code,
      message: valErr.message,
    });
    return;
  }

  res.status(500).json({
    success: false,
    code: "INTERNAL_ERROR",
    message: "Une erreur interne est survenue",
  });
};

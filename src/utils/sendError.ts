import type { Response } from "express";
import type { AppError } from "../errors/AppError";
import type { ApiErrorBody } from "../types/apiError";

export type { ApiErrorBody } from "../types/apiError";

export function sendError(res: Response, err: AppError): void {
  const body: ApiErrorBody = {
    success: false,
    code: err.code,
    message: err.message,
    ...(err.details?.length ? { details: err.details } : {}),
  };
  res.status(err.statusCode).json(body);
}

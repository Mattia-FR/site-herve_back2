import type { NextFunction, Request, Response } from "express";
import { RouteNotFoundError } from "../errors/AppError";
import { sendError } from "../utils/sendError";

export function notFound(req: Request, res: Response, _next: NextFunction) {
  sendError(res, new RouteNotFoundError(`Route ${req.method} ${req.originalUrl} introuvable`));
}

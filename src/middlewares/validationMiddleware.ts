import type { NextFunction, Request, Response } from "express";
import type { ZodError } from "zod";
import { BadRequestError, ValidationFailedError } from "../errors/AppError";
import { parseIdParam } from "../utils/db/parseParams";
import { zodToValidationDetails } from "../utils/http/zodToValidationDetails";
import { sendError } from "../utils/sendError";

interface SchemaWithSafeParse {
  safeParse(data: unknown): { success: true; data: unknown } | { success: false; error: ZodError };
}

export function validateBody(schema: SchemaWithSafeParse) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      sendError(res, new ValidationFailedError(zodToValidationDetails(result.error)));
      return;
    }
    req.validatedBody = result.data;
    next();
  };
}

export function validateQuery(schema: SchemaWithSafeParse) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      sendError(res, new ValidationFailedError(zodToValidationDetails(result.error)));
      return;
    }
    req.validatedQuery = result.data;
    next();
  };
}

export function validateParams(schema: SchemaWithSafeParse) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      sendError(res, new ValidationFailedError(zodToValidationDetails(result.error)));
      return;
    }
    req.validatedParams = result.data;
    next();
  };
}

export function requireValidId(param = "id") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = parseIdParam(req, param);
    if (id === null) {
      sendError(res, new BadRequestError("ID invalide", "INVALID_ID"));
      return;
    }
    req.validatedId = id;
    next();
  };
}

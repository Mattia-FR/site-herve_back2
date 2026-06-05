import type { Request } from "express";
import { BadRequestError } from "../../errors/AppError";

export function getValidatedId(req: Request): number {
  const { validatedId } = req;
  if (validatedId === undefined) {
    throw new Error("req.validatedId manquant : middleware requireValidId requis");
  }
  return validatedId;
}

export function getAuthUserId(req: Request): number {
  const userId = req.user?.userId;
  if (userId === undefined) {
    throw new Error("req.user manquant : middleware requireAuth requis");
  }
  return userId;
}

export function getValidatedBody<T>(req: Request): T {
  const { validatedBody } = req;
  if (validatedBody === undefined) {
    throw new Error("req.validatedBody manquant : middleware validateBody requis");
  }
  return validatedBody as T;
}

export function getValidatedQuery<T>(req: Request): T {
  const { validatedQuery } = req;
  if (validatedQuery === undefined) {
    throw new Error("req.validatedQuery manquant : middleware validateQuery requis");
  }
  return validatedQuery as T;
}

export function getValidatedParams<T>(req: Request): T {
  const { validatedParams } = req;
  if (validatedParams === undefined) {
    throw new Error("req.validatedParams manquant : middleware validateParams requis");
  }
  return validatedParams as T;
}

export function getUploadedFile(req: Request): Express.Multer.File {
  if (!req.file) {
    throw new BadRequestError("Fichier image requis", "FILE_REQUIRED");
  }
  return req.file;
}

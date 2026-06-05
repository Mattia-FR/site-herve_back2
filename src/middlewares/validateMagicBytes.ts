import fs from "node:fs/promises";
import type { NextFunction, Request, Response } from "express";
import { ALLOWED_IMAGE_MIME_SET } from "../config/allowedImageMimes";
import { BadRequestError } from "../errors/AppError";
import { sendError } from "../utils/sendError";

export async function validateMagicBytes(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.file) {
    next();
    return;
  }

  try {
    const { fileTypeFromFile } = await import("file-type");
    const detected = await fileTypeFromFile(req.file.path);

    if (!detected || !ALLOWED_IMAGE_MIME_SET.has(detected.mime)) {
      await fs.unlink(req.file.path).catch(() => {});
      sendError(res, new BadRequestError("Type de fichier non autorisé", "FILE_TYPE_NOT_ALLOWED"));
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}

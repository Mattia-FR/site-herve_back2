import logger from "../../config/logger";
import { AppError, BadRequestError } from "../../errors/AppError";

export function rethrowImageProcessingError(err: unknown): never {
  if (err instanceof AppError) throw err;
  logger.warn({ message: "Échec du traitement Sharp", err });
  throw new BadRequestError("Fichier image invalide ou illisible", "IMAGE_INVALID");
}

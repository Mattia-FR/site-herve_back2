import { logWarn } from "../log/logHelpers";
import { AppError, BadRequestError } from "../../errors/AppError";

export function rethrowImageProcessingError(err: unknown): never {
  if (err instanceof AppError) throw err;
  logWarn("Échec du traitement Sharp", undefined, { err });
  throw new BadRequestError("Fichier image invalide ou illisible", "IMAGE_INVALID");
}

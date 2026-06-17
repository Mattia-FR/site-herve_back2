/**
 * Mapping des erreurs Sharp vers des erreurs API typées.
 *
 * Rôle : intercepter les erreurs brutes de Sharp (ou d'autres bibliothèques
 * de traitement d'image) et les retransformer en BadRequestError IMAGE_INVALID
 * pour renvoyer une réponse HTTP cohérente au client.
 *
 * Si l'erreur est déjà une AppError (ex: IMAGE_DIMENSIONS_TOO_LARGE levée avant),
 * elle est relancée telle quelle sans modification.
 *
 * Retour de type `never` : cette fonction lève toujours une erreur, elle ne
 * retourne jamais normalement. Le compilateur TS l'utilise pour l'analyse
 * de flux (après un appel, le code suivant est inatteignable).
 */
import { DEFAULT_ERROR_MESSAGES, ErrorCode } from "../../config/errorCodes";
import { AppError, BadRequestError } from "../../errors/AppError";
import { logWarn } from "../log/logHelpers";

/**
 * Relance l'erreur en la typant si ce n'est pas déjà une AppError.
 * @param err - Erreur capturée dans un bloc catch Sharp
 * @throws AppError dans tous les cas (IMAGE_INVALID ou l'AppError originale)
 */
export function rethrowImageProcessingError(err: unknown): never {
  if (err instanceof AppError) throw err;
  logWarn("Échec du traitement Sharp", undefined, { err });
  throw new BadRequestError(
    DEFAULT_ERROR_MESSAGES[ErrorCode.IMAGE_INVALID],
    ErrorCode.IMAGE_INVALID
  );
}

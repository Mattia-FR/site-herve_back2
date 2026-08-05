/**
 * Middleware de vérification des magic bytes des images uploadées.
 *
 * Rôle : après que Multer a écrit le fichier sur disque, vérifier que le type
 * MIME réel du fichier (détecté via les octets magiques) correspond à un type
 * image autorisé. Cela empêche un attaquant de renommer un fichier exécutable
 * en ".jpg" et de le faire accepter par le filtre MIME de Multer.
 *
 * Si la vérification échoue :
 *   1. Le fichier est supprimé du disque (nettoyage)
 *   2. Une erreur 400 FILE_TYPE_NOT_ALLOWED est retournée
 *
 * Bibliothèque utilisée : file-type (chargée dynamiquement car module ESM pur).
 * S'exécute après createUpload().single() dans le pipeline de routes.
 */
import fs from "node:fs/promises";
import type { NextFunction, Request, Response } from "express";
import { ALLOWED_IMAGE_MIME_SET } from "../config/allowedImageMimes";
import { DEFAULT_ERROR_MESSAGES, ErrorCode } from "../config/errorCodes";
import { BadRequestError } from "../errors/AppError";
import { sendError } from "../utils/sendError";

export async function validateMagicBytes(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Si Multer n'a pas reçu de fichier, on passe au middleware suivant sans vérification.
  // (certaines routes d'upload ont le fichier en optionnel)
  if (!req.file) {
    next();
    return;
  }

  try {
    // Import dynamique pour isoler la dépendance optionnelle
    const { fromFile } = await import("file-type");
    const detected = await fromFile(req.file.path);

    if (!detected || !ALLOWED_IMAGE_MIME_SET.has(detected.mime)) {
      // Supprimer le fichier rejeté pour ne pas encombrer le disque
      await fs.unlink(req.file.path).catch(() => {});
      sendError(
        res,
        new BadRequestError(
          DEFAULT_ERROR_MESSAGES[ErrorCode.FILE_TYPE_NOT_ALLOWED],
          ErrorCode.FILE_TYPE_NOT_ALLOWED
        )
      );
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Fabrique de middleware Multer pour l'upload de fichiers image.
 *
 * Rôle : créer une instance Multer configurée pour un répertoire de destination
 * donné, avec un filtre MIME et une limite de taille. Utilisé dans les routes
 * admin qui acceptent des uploads (articles, galerie d'images).
 *
 * Comportement :
 *   - Stockage disque dans `destDir` (passé en paramètre)
 *   - Nom de fichier : slug(basename) + suffixe unique horodaté → évite les collisions
 *   - Types autorisés : voir allowedImageMimes.ts (JPEG, PNG, WebP, GIF)
 *   - Taille max : 10 Mo (vérification Multer, puis vérification magic bytes ensuite)
 *
 * Note : Multer ne vérifie que le Content-Type déclaré. La vérification des
 * magic bytes réels est effectuée ensuite par validateMagicBytes.ts.
 */
import path from "node:path";
import multer from "multer";
import { buildSlug } from "../utils/string/slug";
import { ALLOWED_IMAGE_MIME_SET } from "./allowedImageMimes";

/**
 * Crée et retourne un middleware Multer pour le répertoire indiqué.
 * @param destDir - Chemin absolu du dossier de destination sur le disque
 * @returns Instance Multer prête à être utilisée comme middleware Express
 */
export function createUpload(destDir: string) {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, destDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      // Slugifier le nom original pour supprimer les caractères spéciaux et les espaces
      const name = buildSlug(path.basename(file.originalname, ext));
      // Suffixe timestamp + aléatoire pour garantir l'unicité même en upload concurrent
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${name}-${uniqueSuffix}${ext}`);
    },
  });

  return multer({
    storage,
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_IMAGE_MIME_SET.has(file.mimetype)) {
        cb(null, true);
      } else {
        // MulterError est intercepté par errorHandler.ts → réponse JSON uniforme
        cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
      }
    },
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo max
  });
}

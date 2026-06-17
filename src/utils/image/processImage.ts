/**
 * Pipeline de traitement d'image avec Sharp.
 *
 * Rôle : lire l'image source, vérifier ses dimensions, puis générer
 * 3 variantes WebP redimensionnées dans le dossier variantsDir.
 *
 * Pipeline Sharp appliqué à chaque variante :
 *   1. rotate()           — corrige l'orientation EXIF (rotation auto)
 *   2. keepIccProfile()   — préserve le profil colorimétrique (fidélité des couleurs)
 *   3. resize({ withoutEnlargement }) — redimensionne sans agrandir les petites images
 *   4. webp({ quality })  — compression WebP
 *
 * Les URLs publiques des variantes sont construites depuis le chemin relatif
 * au répertoire de travail (process.cwd()).
 *
 * Erreurs gérées :
 *   - IMAGE_DIMENSIONS_TOO_LARGE : largeur ou hauteur > IMAGE_MAX_DIMENSION
 *   - IMAGE_INVALID              : fichier illisible ou corrompu (via rethrowImageProcessingError)
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp, { type Metadata } from "sharp";
import { DEFAULT_ERROR_MESSAGES, ErrorCode } from "../../config/errorCodes";
import {
  IMAGE_MAX_DIMENSION,
  IMAGE_VARIANT_SIZES,
  IMAGE_WEBP_QUALITY,
} from "../../config/imageConfig";
import { BadRequestError } from "../../errors/AppError";
import type { ImageVariants } from "../../types/images";
import { rethrowImageProcessingError } from "./mapImageProcessingError";

/**
 * Vérifie que les dimensions de l'image ne dépassent pas IMAGE_MAX_DIMENSION.
 * Protège contre les "image bombs" (images très grandes qui saturent la RAM).
 */
function assertImageDimensions(width: number | undefined, height: number | undefined): void {
  if ((width ?? 0) > IMAGE_MAX_DIMENSION || (height ?? 0) > IMAGE_MAX_DIMENSION) {
    throw new BadRequestError(
      DEFAULT_ERROR_MESSAGES[ErrorCode.IMAGE_DIMENSIONS_TOO_LARGE],
      ErrorCode.IMAGE_DIMENSIONS_TOO_LARGE
    );
  }
}

/**
 * Traite une image et génère ses variantes WebP dans variantsDir.
 * @param filePath    - Chemin absolu du fichier source (uploadé par Multer)
 * @param variantsDir - Dossier de destination des variantes (créé si absent)
 * @returns Objet { thumb, md, lg } avec les URLs publiques relatives
 */
export async function processImage(filePath: string, variantsDir: string): Promise<ImageVariants> {
  let metadata: Metadata;
  try {
    metadata = await sharp(filePath).metadata();
  } catch (err) {
    rethrowImageProcessingError(err); // transforme les erreurs Sharp en BadRequestError typée
  }
  assertImageDimensions(metadata.width, metadata.height);

  await fs.mkdir(variantsDir, { recursive: true });

  const basename = path.basename(filePath, path.extname(filePath));
  // Préfixe public pour construire les URLs (ex: /uploads/gallery/variants)
  const publicPrefix = `/${path.relative(process.cwd(), variantsDir).replace(/\\/g, "/")}`;

  const variants = {} as ImageVariants;

  for (const { key, width } of IMAGE_VARIANT_SIZES) {
    const outputFilename = `${basename}-${key}.webp`;
    const outputPath = path.join(variantsDir, outputFilename);

    try {
      await sharp(filePath)
        .rotate() // corrige l'orientation EXIF
        .keepIccProfile() // préserve les couleurs
        .resize({ width, withoutEnlargement: true }) // ne pas agrandir les petites images
        .webp({ quality: IMAGE_WEBP_QUALITY })
        .toFile(outputPath);
    } catch (err) {
      rethrowImageProcessingError(err);
    }

    variants[key] = `${publicPrefix}/${outputFilename}`;
  }

  return variants;
}

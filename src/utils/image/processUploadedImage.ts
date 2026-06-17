/**
 * Orchestrateur du traitement d'une image uploadée.
 *
 * Rôle : appeler processImage et gérer le rollback en cas d'échec.
 * Si Sharp échoue (fichier corrompu, dimensions invalides, etc.),
 * supprime le fichier original uploadé ET les variantes partiellement générées
 * pour ne pas laisser de fichiers orphelins sur le disque.
 *
 * Flux normal :
 *   filePath → processImage → variants (thumb/md/lg WebP)
 *
 * Flux d'erreur (rollback) :
 *   filePath → processImage → ERREUR → cleanupUploadedFile + cleanupPartialVariants → throw
 *
 * Utilisé dans les controllers d'upload (articlesAdminController, imagesAdminController).
 */
import path from "node:path";
import type { ImageVariants } from "../../types/images";
import { cleanupPartialVariants } from "./cleanupPartialVariants";
import { cleanupUploadedFile } from "./cleanupUploadedFile";
import { processImage } from "./processImage";

/**
 * Traite l'image uploadée avec Sharp et effectue un nettoyage complet en cas d'échec.
 * @param filePath    - Chemin absolu du fichier source
 * @param variantsDir - Dossier où écrire les variantes WebP
 * @returns Objet ImageVariants avec les URLs publiques des 3 variantes
 */
export async function processUploadedImage(
  filePath: string,
  variantsDir: string
): Promise<ImageVariants> {
  const basename = path.basename(filePath, path.extname(filePath));

  try {
    return await processImage(filePath, variantsDir);
  } catch (err) {
    // Rollback : nettoyer les fichiers créés avant de propager l'erreur
    await cleanupUploadedFile(filePath);
    await cleanupPartialVariants(variantsDir, basename);
    throw err;
  }
}

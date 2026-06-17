/**
 * Suppression silencieuse du fichier source uploadé.
 *
 * Rôle : supprimer le fichier original écrit par Multer sur le disque
 * en cas d'échec du traitement Sharp. L'erreur de suppression est ignorée
 * (le fichier peut déjà avoir été supprimé ou être inaccessible).
 *
 * Utilisé par processUploadedImage.ts dans le rollback d'erreur.
 */
import fs from "node:fs/promises";

/**
 * Supprime un fichier de façon silencieuse.
 * @param filePath - Chemin absolu du fichier à supprimer
 */
export async function cleanupUploadedFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // Fichier déjà absent ou inaccessible — rien à faire
  }
}

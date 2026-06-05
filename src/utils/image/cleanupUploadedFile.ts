import fs from "node:fs/promises";

export async function cleanupUploadedFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // Fichier déjà absent ou inaccessible — rien à faire
  }
}

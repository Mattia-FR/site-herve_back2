/**
 * Suppression des variantes d'image partiellement générées.
 *
 * Rôle : nettoyer les fichiers WebP partiellement créés lors d'un traitement
 * Sharp qui a échoué à mi-chemin (ex: la variante thumb a été créée, mais md a
 * provoqué une erreur). Utilisé dans le rollback de processUploadedImage.ts.
 *
 * Les erreurs de suppression individuelle sont ignorées (catch(() => {}))
 * car certains fichiers peuvent ne pas avoir été créés avant l'erreur.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { IMAGE_VARIANT_SIZES } from "../../config/imageConfig";

/**
 * Supprime toutes les variantes WebP potentiellement créées pour une image.
 * @param variantsDir - Dossier contenant les variantes
 * @param basename    - Nom de base du fichier (sans extension ni suffixe de variante)
 */
export async function cleanupPartialVariants(variantsDir: string, basename: string): Promise<void> {
  await Promise.all(
    IMAGE_VARIANT_SIZES.map(({ key }) =>
      fs.unlink(path.join(variantsDir, `${basename}-${key}.webp`)).catch(() => {})
    )
  );
}

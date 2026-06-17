/**
 * Chemins absolus des dossiers d'uploads et utilitaires associés.
 *
 * Rôle : centraliser la définition de tous les chemins de stockage des fichiers
 * uploadés pour éviter la duplication et garantir la cohérence entre les modules
 * (multer, processImage, deleteById, etc.).
 *
 * Structure des dossiers :
 *   uploads/
 *   ├── gallery/          ← images originales de la galerie
 *   │   └── variants/     ← variantes WebP (thumb/md/lg) générées par Sharp
 *   ├── content/          ← images insérées dans le contenu des articles
 *   │   └── variants/
 *   └── featured/         ← images à la une des articles
 *       └── variants/
 *
 * Tous les chemins sont construits à partir de process.cwd() (racine du projet)
 * pour fonctionner correctement quelle que soit la façon dont le process est lancé.
 */
import fs from "node:fs/promises";
import path from "node:path";

export const UPLOADS_ROOT = path.join(process.cwd(), "uploads");
export const UPLOADS_GALLERY_DIR = path.join(UPLOADS_ROOT, "gallery");
export const UPLOADS_GALLERY_VARIANTS_DIR = path.join(UPLOADS_GALLERY_DIR, "variants");
export const UPLOADS_CONTENT_DIR = path.join(UPLOADS_ROOT, "content");
export const UPLOADS_CONTENT_VARIANTS_DIR = path.join(UPLOADS_CONTENT_DIR, "variants");
export const UPLOADS_FEATURED_DIR = path.join(UPLOADS_ROOT, "featured");
export const UPLOADS_FEATURED_VARIANTS_DIR = path.join(UPLOADS_FEATURED_DIR, "variants");

/**
 * Convertit un chemin public (ex: "/uploads/gallery/img.jpg") en chemin
 * absolu sur le système de fichiers.
 * Utilisé lors de la suppression physique des fichiers.
 * @param publicPath - Chemin URL relatif commençant par "/uploads/..."
 * @returns Chemin absolu correspondant dans le système de fichiers
 */
export function resolveUploadPath(publicPath: string): string {
  const normalized = publicPath.startsWith("/") ? publicPath.slice(1) : publicPath;
  return path.join(process.cwd(), normalized);
}

/**
 * Crée tous les dossiers d'uploads s'ils n'existent pas encore.
 * Appelé une seule fois au démarrage dans checkStartup().
 * `recursive: true` évite l'erreur si le dossier existe déjà.
 */
export async function ensureUploadDirs(): Promise<void> {
  await Promise.all([
    fs.mkdir(UPLOADS_GALLERY_DIR, { recursive: true }),
    fs.mkdir(UPLOADS_GALLERY_VARIANTS_DIR, { recursive: true }),
    fs.mkdir(UPLOADS_CONTENT_DIR, { recursive: true }),
    fs.mkdir(UPLOADS_CONTENT_VARIANTS_DIR, { recursive: true }),
    fs.mkdir(UPLOADS_FEATURED_DIR, { recursive: true }),
    fs.mkdir(UPLOADS_FEATURED_VARIANTS_DIR, { recursive: true }),
  ]);
}

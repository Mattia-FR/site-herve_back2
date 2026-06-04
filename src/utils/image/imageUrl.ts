const IMAGE_BASE_URL = process.env.IMAGE_BASE_URL || "http://localhost:4242";

/**
 * Préfixe un chemin relatif avec la base URL publique de l'API.
 * Retourne undefined si le chemin est null ou vide.
 */
export function buildImageUrl(path: string | null | undefined): string | undefined {
  if (path == null || path === "") return undefined;
  const base = IMAGE_BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

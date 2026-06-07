import { env } from "../../config/env";

const IMAGE_BASE_URL = env.IMAGE_BASE_URL;

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

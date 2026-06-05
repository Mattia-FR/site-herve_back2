import fs from "node:fs/promises";
import path from "node:path";

export const UPLOADS_ROOT = path.join(process.cwd(), "uploads");
export const UPLOADS_GALLERY_DIR = path.join(UPLOADS_ROOT, "gallery");
export const UPLOADS_GALLERY_VARIANTS_DIR = path.join(UPLOADS_GALLERY_DIR, "variants");
export const UPLOADS_CONTENT_DIR = path.join(UPLOADS_ROOT, "content");
export const UPLOADS_CONTENT_VARIANTS_DIR = path.join(UPLOADS_CONTENT_DIR, "variants");
export const UPLOADS_FEATURED_DIR = path.join(UPLOADS_ROOT, "featured");
export const UPLOADS_FEATURED_VARIANTS_DIR = path.join(UPLOADS_FEATURED_DIR, "variants");

export function resolveUploadPath(publicPath: string): string {
  const normalized = publicPath.startsWith("/") ? publicPath.slice(1) : publicPath;
  return path.join(process.cwd(), normalized);
}

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

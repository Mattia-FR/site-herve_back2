export const ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

export const ALLOWED_IMAGE_MIME_SET = new Set<string>(ALLOWED_IMAGE_MIMES);

export const IMAGE_MAX_DIMENSION = 10_000;
export const IMAGE_WEBP_QUALITY = 85;

export const IMAGE_VARIANT_SIZES = [
  { key: "thumb" as const, width: 400 },
  { key: "md" as const, width: 900 },
  { key: "lg" as const, width: 1600 },
] as const;

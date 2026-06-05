import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  IMAGE_MAX_DIMENSION,
  IMAGE_VARIANT_SIZES,
  IMAGE_WEBP_QUALITY,
} from "../../config/imageConfig";
import { DEFAULT_ERROR_MESSAGES, ErrorCode } from "../../config/errorCodes";
import { BadRequestError } from "../../errors/AppError";
import type { ImageVariants } from "../../types/images";
import { rethrowImageProcessingError } from "./mapImageProcessingError";

function assertImageDimensions(width: number | undefined, height: number | undefined): void {
  if ((width ?? 0) > IMAGE_MAX_DIMENSION || (height ?? 0) > IMAGE_MAX_DIMENSION) {
    throw new BadRequestError(
      DEFAULT_ERROR_MESSAGES[ErrorCode.IMAGE_DIMENSIONS_TOO_LARGE],
      ErrorCode.IMAGE_DIMENSIONS_TOO_LARGE,
    );
  }
}

export async function processImage(filePath: string, variantsDir: string): Promise<ImageVariants> {
  let metadata;
  try {
    metadata = await sharp(filePath).metadata();
  } catch (err) {
    rethrowImageProcessingError(err);
  }
  assertImageDimensions(metadata.width, metadata.height);

  await fs.mkdir(variantsDir, { recursive: true });

  const basename = path.basename(filePath, path.extname(filePath));
  const publicPrefix = `/${path.relative(process.cwd(), variantsDir).replace(/\\/g, "/")}`;

  const variants = {} as ImageVariants;

  for (const { key, width } of IMAGE_VARIANT_SIZES) {
    const outputFilename = `${basename}-${key}.webp`;
    const outputPath = path.join(variantsDir, outputFilename);

    try {
      await sharp(filePath)
        .rotate()
        .keepIccProfile()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: IMAGE_WEBP_QUALITY })
        .toFile(outputPath);
    } catch (err) {
      rethrowImageProcessingError(err);
    }

    variants[key] = `${publicPrefix}/${outputFilename}`;
  }

  return variants;
}

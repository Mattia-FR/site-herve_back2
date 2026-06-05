import path from "node:path";
import type { ImageVariants } from "../../types/images";
import { cleanupPartialVariants } from "./cleanupPartialVariants";
import { cleanupUploadedFile } from "./cleanupUploadedFile";
import { processImage } from "./processImage";

export async function processUploadedImage(
  filePath: string,
  variantsDir: string,
): Promise<ImageVariants> {
  const basename = path.basename(filePath, path.extname(filePath));

  try {
    return await processImage(filePath, variantsDir);
  } catch (err) {
    await cleanupUploadedFile(filePath);
    await cleanupPartialVariants(variantsDir, basename);
    throw err;
  }
}

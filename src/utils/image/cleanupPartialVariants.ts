import fs from "node:fs/promises";
import path from "node:path";
import { IMAGE_VARIANT_SIZES } from "../../config/imageConfig";

export async function cleanupPartialVariants(
  variantsDir: string,
  basename: string,
): Promise<void> {
  await Promise.all(
    IMAGE_VARIANT_SIZES.map(({ key }) =>
      fs.unlink(path.join(variantsDir, `${basename}-${key}.webp`)).catch(() => {}),
    ),
  );
}

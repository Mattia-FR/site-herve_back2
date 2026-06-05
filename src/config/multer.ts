import path from "node:path";
import multer from "multer";
import { buildSlug } from "../utils/string/slug";
import { ALLOWED_IMAGE_MIME_SET } from "./allowedImageMimes";

export function createUpload(destDir: string) {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, destDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = buildSlug(path.basename(file.originalname, ext));
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${name}-${uniqueSuffix}${ext}`);
    },
  });

  return multer({
    storage,
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_IMAGE_MIME_SET.has(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
      }
    },
    limits: { fileSize: 10 * 1024 * 1024 },
  });
}

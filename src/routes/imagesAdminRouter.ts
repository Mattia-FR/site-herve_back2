import { Router } from "express";
import { createUpload } from "../config/multer";
import { UPLOADS_GALLERY_DIR } from "../config/uploadsPaths";
import {
  add,
  browse,
  destroy,
  edit,
  read,
  setCategories,
} from "../controllers/imagesAdminController";
import { validateMagicBytes } from "../middlewares/validateMagicBytes";
import { requireValidId, validateBody } from "../middlewares/validationMiddleware";
import {
  imageCategoriesSchema,
  imageMetadataSchema,
  imageUpdateSchema,
} from "../validation/images.schemas";

const router = Router();

router.get("/", browse);
router.get("/:id", requireValidId(), read);
router.post(
  "/",
  createUpload(UPLOADS_GALLERY_DIR).single("image"),
  validateMagicBytes,
  validateBody(imageMetadataSchema),
  add
);
router.put("/:id/categories", requireValidId(), validateBody(imageCategoriesSchema), setCategories);
router.put("/:id", requireValidId(), validateBody(imageUpdateSchema), edit);
router.delete("/:id", requireValidId(), destroy);

export default router;

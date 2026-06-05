import { Router } from "express";
import { browseGallery, readCarouselPreview } from "../controllers/imagesController";
import { validateQuery } from "../middlewares/validationMiddleware";
import { galleryBrowseQuerySchema } from "../validation/images.schemas";

const router = Router();

router.get("/gallery/carousel", readCarouselPreview);
router.get("/gallery", validateQuery(galleryBrowseQuerySchema), browseGallery);

export default router;

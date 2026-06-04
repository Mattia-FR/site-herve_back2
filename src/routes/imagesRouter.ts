import { Router } from "express";
import { browseGallery, readCarouselPreview } from "../controllers/imagesController";

const router = Router();

router.get("/gallery/carousel", readCarouselPreview);
router.get("/gallery", browseGallery);

export default router;

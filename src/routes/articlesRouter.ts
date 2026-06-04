import { Router } from "express";
import {
  browsePublished,
  readHomepagePreview,
  readPublishedById,
  readPublishedBySlug,
} from "../controllers/articlesController";

const router = Router();

router.get("/homepage-preview", readHomepagePreview);
router.get("/published", browsePublished);
router.get("/published/id/:id", readPublishedById);
router.get("/published/slug/:slug", readPublishedBySlug);

export default router;

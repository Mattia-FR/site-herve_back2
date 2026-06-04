import type { Request, Response } from "express";
import imagesModel from "../models/imagesModel";
import { asyncHandler } from "../utils/asyncHandler";

const browseGallery = asyncHandler(async (req: Request, res: Response) => {
  const categorySlug = req.query.category as string | undefined;
  const images = await imagesModel.findByGallery(categorySlug);
  res.status(200).json(images);
});

const readCarouselPreview = asyncHandler(async (_req: Request, res: Response) => {
  const images = await imagesModel.findCarouselPreview();
  res.status(200).json(images);
});

export { browseGallery, readCarouselPreview };

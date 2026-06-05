import type { Request, Response } from "express";
import type { z } from "zod";
import imagesModel from "../models/imagesModel";
import { asyncHandler } from "../utils/asyncHandler";
import { getValidatedQuery } from "../utils/http/requestHelpers";
import type { galleryBrowseQuerySchema } from "../validation/images.schemas";

const browseGallery = asyncHandler(async (req: Request, res: Response) => {
  const { category } = getValidatedQuery<z.infer<typeof galleryBrowseQuerySchema>>(req);
  const images = await imagesModel.findByGallery(category);
  res.status(200).json(images);
});

const readCarouselPreview = asyncHandler(async (_req: Request, res: Response) => {
  const images = await imagesModel.findCarouselPreview();
  res.status(200).json(images);
});

export { browseGallery, readCarouselPreview };

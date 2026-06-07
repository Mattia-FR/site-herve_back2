import type { Request, Response } from "express";
import type { z } from "zod";
import { UPLOADS_GALLERY_VARIANTS_DIR } from "../config/uploadsPaths";
import { NotFoundError } from "../errors/AppError";
import imagesAdminModel from "../models/imagesAdminModel";
import { asyncHandler } from "../utils/asyncHandler";
import {
  getAuthUserId,
  getUploadedFile,
  getValidatedBody,
  getValidatedId,
  getValidatedQuery,
} from "../utils/http/requestHelpers";
import { processUploadedImage } from "../utils/image/processUploadedImage";
import type {
  imageCategoriesSchema,
  imageMetadataSchema,
  imageUpdateSchema,
} from "../validation/images.schemas";
import type { adminPaginationQuerySchema } from "../validation/pagination.schemas";

const browse = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } =
    getValidatedQuery<z.infer<typeof adminPaginationQuerySchema>>(req);
  const result = await imagesAdminModel.findPaginated(page, limit);
  res.status(200).json(result);
});

const add = asyncHandler(async (req: Request, res: Response) => {
  const file = getUploadedFile(req);
  const userId = getAuthUserId(req);
  const meta = getValidatedBody<z.infer<typeof imageMetadataSchema>>(req);

  const variants = await processUploadedImage(file.path, UPLOADS_GALLERY_VARIANTS_DIR);

  const image = await imagesAdminModel.create({
    title: meta.title ?? null,
    description: meta.description ?? null,
    alt_descr: meta.alt_descr ?? null,
    is_in_gallery: meta.is_in_gallery ?? false,
    display_order: meta.display_order ?? 0,
    article_id: meta.article_id ?? null,
    path: `/uploads/gallery/${file.filename}`,
    variants,
    user_id: userId,
  });
  res.status(201).json(image);
});

const read = asyncHandler(async (req: Request, res: Response) => {
  const id = getValidatedId(req);
  const image = await imagesAdminModel.findById(id);
  if (!image) throw new NotFoundError("Image");
  const categoryIds = await imagesAdminModel.findCategoriesByImageId(id);
  res.status(200).json({ ...image, categoryIds });
});

const edit = asyncHandler(async (req: Request, res: Response) => {
  const image = await imagesAdminModel.update(
    getValidatedId(req),
    getValidatedBody<z.infer<typeof imageUpdateSchema>>(req)
  );
  if (!image) throw new NotFoundError("Image");
  res.status(200).json(image);
});

const setCategories = asyncHandler(async (req: Request, res: Response) => {
  const id = getValidatedId(req);
  const { categoryIds } = getValidatedBody<z.infer<typeof imageCategoriesSchema>>(req);

  await imagesAdminModel.setCategories(id, categoryIds);

  const image = await imagesAdminModel.findById(id);
  if (!image) throw new NotFoundError("Image");
  res.status(200).json(image);
});

const destroy = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await imagesAdminModel.deleteById(getValidatedId(req));
  if (!deleted) throw new NotFoundError("Image");
  res.sendStatus(204);
});

export { add, browse, destroy, edit, read, setCategories };

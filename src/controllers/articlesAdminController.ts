import type { Request, Response } from "express";
import type { z } from "zod";
import {
  UPLOADS_CONTENT_VARIANTS_DIR,
  UPLOADS_FEATURED_VARIANTS_DIR,
} from "../config/uploadsPaths";
import { NotFoundError } from "../errors/AppError";
import articlesAdminModel from "../models/articlesAdminModel";
import imagesAdminModel from "../models/imagesAdminModel";
import type { ArticleUpdateData } from "../types/articles";
import { asyncHandler } from "../utils/asyncHandler";
import {
  getAuthUserId,
  getUploadedFile,
  getValidatedBody,
  getValidatedId,
  getValidatedParams,
  getValidatedQuery,
} from "../utils/http/requestHelpers";
import { processUploadedImage } from "../utils/image/processUploadedImage";
import { toMySQLDatetime } from "../utils/string/dateHelpers";
import type {
  articleCreateSchema,
  articleUpdateSchema,
  slugParamSchema,
} from "../validation/articles.schemas";
import type { adminPaginationQuerySchema } from "../validation/pagination.schemas";

const browseAll = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } =
    getValidatedQuery<z.infer<typeof adminPaginationQuerySchema>>(req);
  const result = await articlesAdminModel.findPaginated(page, limit);
  res.status(200).json(result);
});

const readById = asyncHandler(async (req: Request, res: Response) => {
  const article = await articlesAdminModel.findByIdForAdmin(getValidatedId(req));
  if (!article) throw new NotFoundError("Article");
  res.status(200).json(article);
});

const readBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = getValidatedParams<z.infer<typeof slugParamSchema>>(req);
  const article = await articlesAdminModel.findBySlugForAdmin(slug);
  if (!article) throw new NotFoundError("Article");
  res.status(200).json(article);
});

const add = asyncHandler(async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const { title, content, status, featured_image_id, excerpt } =
    getValidatedBody<z.infer<typeof articleCreateSchema>>(req);

  const published_at = status === "published" ? toMySQLDatetime(new Date()) : null;

  const article = await articlesAdminModel.create({
    title,
    content,
    excerpt,
    status,
    featured_image_id,
    user_id: userId,
    published_at,
  });
  res.status(201).json(article);
});

const edit = asyncHandler(async (req: Request, res: Response) => {
  const id = getValidatedId(req);
  const data: ArticleUpdateData = {
    ...getValidatedBody<z.infer<typeof articleUpdateSchema>>(req),
  };

  if (data.status === "published") {
    const existing = await articlesAdminModel.findByIdForAdmin(id);
    if (existing && existing.status !== "published") {
      data.published_at = toMySQLDatetime(new Date());
    }
  }

  const article = await articlesAdminModel.update(id, data);
  if (!article) throw new NotFoundError("Article");
  res.status(200).json(article);
});

const destroy = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await articlesAdminModel.deleteById(getValidatedId(req));
  if (!deleted) throw new NotFoundError("Article");
  res.sendStatus(204);
});

const uploadContentImage = asyncHandler(async (req: Request, res: Response) => {
  const file = getUploadedFile(req);
  const variants = await processUploadedImage(file.path, UPLOADS_CONTENT_VARIANTS_DIR);
  res.status(201).json({ url: variants.md });
});

const uploadFeaturedImage = asyncHandler(async (req: Request, res: Response) => {
  const file = getUploadedFile(req);
  const userId = getAuthUserId(req);

  const variants = await processUploadedImage(file.path, UPLOADS_FEATURED_VARIANTS_DIR);

  const image = await imagesAdminModel.create({
    path: `/uploads/featured/${file.filename}`,
    variants,
    user_id: userId,
    is_in_gallery: false,
  });

  res.status(201).json({ id: image.id, url: variants.md });
});

export {
  add,
  browseAll,
  destroy,
  edit,
  readById,
  readBySlug,
  uploadContentImage,
  uploadFeaturedImage,
};

import type { Request, Response } from "express";
import type { z } from "zod";
import { NotFoundError } from "../errors/AppError";
import articlesModel from "../models/articlesModel";
import { asyncHandler } from "../utils/asyncHandler";
import {
  getValidatedId,
  getValidatedParams,
  getValidatedQuery,
} from "../utils/http/requestHelpers";
import type { articlesPublishedQuerySchema, slugParamSchema } from "../validation/articles.schemas";

const browsePublished = asyncHandler(async (req: Request, res: Response) => {
  const { limit } = getValidatedQuery<z.infer<typeof articlesPublishedQuerySchema>>(req);
  const articles = await articlesModel.findPublished(limit);
  res.status(200).json(articles);
});

const readHomepagePreview = asyncHandler(async (_req: Request, res: Response) => {
  const articles = await articlesModel.findHomepagePreview();
  res.status(200).json(articles);
});

const readPublishedById = asyncHandler(async (req: Request, res: Response) => {
  const id = getValidatedId(req);
  const article = await articlesModel.findPublishedById(id);
  if (!article) throw new NotFoundError("Article");
  res.status(200).json(article);
});

const readPublishedBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = getValidatedParams<z.infer<typeof slugParamSchema>>(req);
  const article = await articlesModel.findPublishedBySlug(slug);
  if (!article) throw new NotFoundError("Article");
  res.status(200).json(article);
});

export { browsePublished, readHomepagePreview, readPublishedById, readPublishedBySlug };

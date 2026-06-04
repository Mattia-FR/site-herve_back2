import type { Request, Response } from "express";
import { NotFoundError } from "../errors/AppError";
import articlesModel from "../models/articlesModel";
import { asyncHandler } from "../utils/asyncHandler";

const browsePublished = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const articles = await articlesModel.findPublished(limit);
  res.status(200).json(articles);
});

const readHomepagePreview = asyncHandler(async (_req: Request, res: Response) => {
  const articles = await articlesModel.findHomepagePreview();
  res.status(200).json(articles);
});

const readPublishedById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const article = await articlesModel.findPublishedById(id);
  if (!article) throw new NotFoundError("Article");
  res.status(200).json(article);
});

const readPublishedBySlug = asyncHandler(async (req: Request, res: Response) => {
  const article = await articlesModel.findPublishedBySlug(req.params.slug);
  if (!article) throw new NotFoundError("Article");
  res.status(200).json(article);
});

export { browsePublished, readHomepagePreview, readPublishedById, readPublishedBySlug };

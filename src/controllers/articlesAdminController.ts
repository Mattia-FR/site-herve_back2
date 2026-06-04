import type { Request, Response } from "express";
import { NotFoundError } from "../errors/AppError";
import articlesAdminModel from "../models/articlesAdminModel";
import { asyncHandler } from "../utils/asyncHandler";
import { toMySQLDatetime } from "../utils/string/dateHelpers";

const browseAll = asyncHandler(async (_req: Request, res: Response) => {
  const articles = await articlesAdminModel.findAllForAdmin();
  res.status(200).json(articles);
});

const readById = asyncHandler(async (req: Request, res: Response) => {
  const article = await articlesAdminModel.findByIdForAdmin(Number(req.params.id));
  if (!article) throw new NotFoundError("Article");
  res.status(200).json(article);
});

const readBySlug = asyncHandler(async (req: Request, res: Response) => {
  const article = await articlesAdminModel.findBySlugForAdmin(req.params.slug);
  if (!article) throw new NotFoundError("Article");
  res.status(200).json(article);
});

const add = asyncHandler(async (req: Request, res: Response) => {
  const { title, content, status, featured_image_id, user_id } = req.body as {
    title: string;
    content: string;
    status?: "draft" | "published" | "archived";
    featured_image_id?: number | null;
    user_id: number;
  };

  const published_at = status === "published" ? toMySQLDatetime(new Date()) : null;

  const article = await articlesAdminModel.create({
    title,
    content,
    status,
    featured_image_id,
    user_id,
    published_at,
  });
  res.status(201).json(article);
});

const edit = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data = { ...(req.body as Record<string, unknown>) };

  // Première transition vers published → horodatage de publication
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
  const deleted = await articlesAdminModel.deleteById(Number(req.params.id));
  if (!deleted) throw new NotFoundError("Article");
  res.sendStatus(204);
});

export { add, browseAll, destroy, edit, readById, readBySlug };

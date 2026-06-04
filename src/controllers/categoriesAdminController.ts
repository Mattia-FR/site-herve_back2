import type { Request, Response } from "express";
import { NotFoundError } from "../errors/AppError";
import categoriesAdminModel from "../models/categoriesAdminModel";
import { asyncHandler } from "../utils/asyncHandler";

const browse = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await categoriesAdminModel.findAll();
  res.status(200).json(categories);
});

const add = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoriesAdminModel.create(req.body);
  res.status(201).json(category);
});

const edit = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoriesAdminModel.update(Number(req.params.id), req.body);
  if (!category) throw new NotFoundError("Catégorie");
  res.status(200).json(category);
});

const destroy = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await categoriesAdminModel.deleteById(Number(req.params.id));
  if (!deleted) throw new NotFoundError("Catégorie");
  res.sendStatus(204);
});

export { add, browse, destroy, edit };

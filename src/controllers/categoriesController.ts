import type { Request, Response } from "express";
import { NotFoundError } from "../errors/AppError";
import categoriesModel from "../models/categoriesModel";
import { asyncHandler } from "../utils/asyncHandler";
import { getValidatedId } from "../utils/http/requestHelpers";

const browse = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await categoriesModel.findAll();
  res.status(200).json(categories);
});

const read = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoriesModel.findById(getValidatedId(req));
  if (!category) throw new NotFoundError("Catégorie");
  res.status(200).json(category);
});

export { browse, read };

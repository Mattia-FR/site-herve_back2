import type { Request, Response } from "express";
import type { z } from "zod";
import { NotFoundError } from "../errors/AppError";
import categoriesAdminModel from "../models/categoriesAdminModel";
import { asyncHandler } from "../utils/asyncHandler";
import { getValidatedBody, getValidatedId } from "../utils/http/requestHelpers";
import type { categoryCreateSchema, categoryUpdateSchema } from "../validation/categories.schemas";

const browse = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await categoriesAdminModel.findAll();
  res.status(200).json(categories);
});

const add = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoriesAdminModel.create(
    getValidatedBody<z.infer<typeof categoryCreateSchema>>(req)
  );
  res.status(201).json(category);
});

const edit = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoriesAdminModel.update(
    getValidatedId(req),
    getValidatedBody<z.infer<typeof categoryUpdateSchema>>(req)
  );
  if (!category) throw new NotFoundError("Catégorie");
  res.status(200).json(category);
});

const destroy = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await categoriesAdminModel.deleteById(getValidatedId(req));
  if (!deleted) throw new NotFoundError("Catégorie");
  res.sendStatus(204);
});

export { add, browse, destroy, edit };

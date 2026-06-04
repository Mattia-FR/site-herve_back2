import type { Request, Response } from "express";
import { NotFoundError } from "../errors/AppError";
import imagesAdminModel from "../models/imagesAdminModel";
import { asyncHandler } from "../utils/asyncHandler";

const browse = asyncHandler(async (_req: Request, res: Response) => {
  const images = await imagesAdminModel.findAll();
  res.status(200).json(images);
});

const read = asyncHandler(async (req: Request, res: Response) => {
  const image = await imagesAdminModel.findById(Number(req.params.id));
  if (!image) throw new NotFoundError("Image");
  res.status(200).json(image);
});

const edit = asyncHandler(async (req: Request, res: Response) => {
  const image = await imagesAdminModel.update(Number(req.params.id), req.body);
  if (!image) throw new NotFoundError("Image");
  res.status(200).json(image);
});

const setCategories = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { categoryIds } = req.body as { categoryIds: number[] };

  await imagesAdminModel.setCategories(id, categoryIds);

  const image = await imagesAdminModel.findById(id);
  if (!image) throw new NotFoundError("Image");
  res.status(200).json(image);
});

const destroy = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await imagesAdminModel.deleteById(Number(req.params.id));
  if (!deleted) throw new NotFoundError("Image");
  res.sendStatus(204);
});

export { browse, destroy, edit, read, setCategories };

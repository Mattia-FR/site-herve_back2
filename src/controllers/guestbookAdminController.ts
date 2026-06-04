import type { Request, Response } from "express";
import { NotFoundError } from "../errors/AppError";
import guestbookAdminModel from "../models/guestbookAdminModel";
import { asyncHandler } from "../utils/asyncHandler";

const browseAll = asyncHandler(async (_req: Request, res: Response) => {
  const entries = await guestbookAdminModel.findAll();
  res.status(200).json(entries);
});

const read = asyncHandler(async (req: Request, res: Response) => {
  const entry = await guestbookAdminModel.findById(Number(req.params.id));
  if (!entry) throw new NotFoundError("Entrée");
  res.status(200).json(entry);
});

const edit = asyncHandler(async (req: Request, res: Response) => {
  const entry = await guestbookAdminModel.update(Number(req.params.id), req.body);
  if (!entry) throw new NotFoundError("Entrée");
  res.status(200).json(entry);
});

const destroy = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await guestbookAdminModel.deleteById(Number(req.params.id));
  if (!deleted) throw new NotFoundError("Entrée");
  res.sendStatus(204);
});

export { browseAll, destroy, edit, read };

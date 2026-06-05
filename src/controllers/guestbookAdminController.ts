import type { Request, Response } from "express";
import type { z } from "zod";
import { NotFoundError } from "../errors/AppError";
import guestbookAdminModel from "../models/guestbookAdminModel";
import { asyncHandler } from "../utils/asyncHandler";
import { getValidatedBody, getValidatedId } from "../utils/http/requestHelpers";
import type { guestbookUpdateSchema } from "../validation/guestbook.schemas";

const browseAll = asyncHandler(async (_req: Request, res: Response) => {
  const entries = await guestbookAdminModel.findAll();
  res.status(200).json(entries);
});

const read = asyncHandler(async (req: Request, res: Response) => {
  const entry = await guestbookAdminModel.findById(getValidatedId(req));
  if (!entry) throw new NotFoundError("Entrée");
  res.status(200).json(entry);
});

const edit = asyncHandler(async (req: Request, res: Response) => {
  const entry = await guestbookAdminModel.update(
    getValidatedId(req),
    getValidatedBody<z.infer<typeof guestbookUpdateSchema>>(req)
  );
  if (!entry) throw new NotFoundError("Entrée");
  res.status(200).json(entry);
});

const destroy = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await guestbookAdminModel.deleteById(getValidatedId(req));
  if (!deleted) throw new NotFoundError("Entrée");
  res.sendStatus(204);
});

export { browseAll, destroy, edit, read };

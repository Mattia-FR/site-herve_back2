import type { Request, Response } from "express";
import type { z } from "zod";
import { NotFoundError } from "../errors/AppError";
import guestbookAdminModel from "../models/guestbookAdminModel";
import { asyncHandler } from "../utils/asyncHandler";
import {
  getValidatedBody,
  getValidatedId,
  getValidatedQuery,
} from "../utils/http/requestHelpers";
import type { guestbookUpdateSchema } from "../validation/guestbook.schemas";
import type { adminPaginationQuerySchema } from "../validation/pagination.schemas";

const browseAll = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } =
    getValidatedQuery<z.infer<typeof adminPaginationQuerySchema>>(req);
  const result = await guestbookAdminModel.findPaginated(page, limit);
  res.status(200).json(result);
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

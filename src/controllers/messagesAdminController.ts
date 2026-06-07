import type { Request, Response } from "express";
import type { z } from "zod";
import { NotFoundError } from "../errors/AppError";
import messagesAdminModel from "../models/messagesAdminModel";
import { asyncHandler } from "../utils/asyncHandler";
import {
  getValidatedBody,
  getValidatedId,
  getValidatedQuery,
} from "../utils/http/requestHelpers";
import type { messageUpdateSchema } from "../validation/messages.schemas";
import type { adminPaginationQuerySchema } from "../validation/pagination.schemas";

const browse = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } =
    getValidatedQuery<z.infer<typeof adminPaginationQuerySchema>>(req);
  const result = await messagesAdminModel.findPaginated(page, limit);
  res.status(200).json(result);
});

const read = asyncHandler(async (req: Request, res: Response) => {
  const message = await messagesAdminModel.findById(getValidatedId(req));
  if (!message) throw new NotFoundError("Message");
  res.status(200).json(message);
});

const edit = asyncHandler(async (req: Request, res: Response) => {
  const message = await messagesAdminModel.update(
    getValidatedId(req),
    getValidatedBody<z.infer<typeof messageUpdateSchema>>(req)
  );
  if (!message) throw new NotFoundError("Message");
  res.status(200).json(message);
});

const destroy = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await messagesAdminModel.deleteById(getValidatedId(req));
  if (!deleted) throw new NotFoundError("Message");
  res.sendStatus(204);
});

export { browse, destroy, edit, read };

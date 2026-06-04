import type { Request, Response } from "express";
import { NotFoundError } from "../errors/AppError";
import messagesAdminModel from "../models/messagesAdminModel";
import { asyncHandler } from "../utils/asyncHandler";

const browse = asyncHandler(async (_req: Request, res: Response) => {
  const messages = await messagesAdminModel.findAll();
  res.status(200).json(messages);
});

const read = asyncHandler(async (req: Request, res: Response) => {
  const message = await messagesAdminModel.findById(Number(req.params.id));
  if (!message) throw new NotFoundError("Message");
  res.status(200).json(message);
});

const edit = asyncHandler(async (req: Request, res: Response) => {
  const message = await messagesAdminModel.update(Number(req.params.id), req.body);
  if (!message) throw new NotFoundError("Message");
  res.status(200).json(message);
});

const destroy = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await messagesAdminModel.deleteById(Number(req.params.id));
  if (!deleted) throw new NotFoundError("Message");
  res.sendStatus(204);
});

export { browse, destroy, edit, read };

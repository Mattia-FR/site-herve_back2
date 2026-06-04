import type { Request, Response } from "express";
import messagesModel from "../models/messagesModel";
import { asyncHandler } from "../utils/asyncHandler";

const add = asyncHandler(async (req: Request, res: Response) => {
  const ip = req.ip ?? null;
  const message = await messagesModel.create({ ...req.body, ip });
  res.status(201).json(message);
});

export { add };

import type { Request, Response } from "express";
import messagesModel from "../models/messagesModel";
import mailService from "../services/mailService";
import type { MessageCreateData } from "../types/messages";
import { asyncHandler } from "../utils/asyncHandler";
import { getValidatedBody } from "../utils/http/requestHelpers";

const add = asyncHandler(async (req: Request, res: Response) => {
  const ip = req.ip ?? null;
  const body = getValidatedBody<MessageCreateData>(req);
  const message = await messagesModel.create({ ...body, ip });
  void mailService.notifyNewContactMessage(message);
  res.status(201).json(message);
});

export { add };

import type { Request, Response } from "express";
import guestbookModel from "../models/guestbookModel";
import type { GuestbookCreateData } from "../types/guestbook";
import { asyncHandler } from "../utils/asyncHandler";
import { getValidatedBody } from "../utils/http/requestHelpers";

const browseApproved = asyncHandler(async (_req: Request, res: Response) => {
  const entries = await guestbookModel.findApproved();
  res.status(200).json(entries);
});

const add = asyncHandler(async (req: Request, res: Response) => {
  const body = getValidatedBody<GuestbookCreateData>(req);
  const entry = await guestbookModel.create(body);
  res.status(201).json(entry);
});

export { add, browseApproved };

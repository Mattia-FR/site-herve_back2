import type { Request, Response } from "express";
import guestbookModel from "../models/guestbookModel";
import { asyncHandler } from "../utils/asyncHandler";

const browseApproved = asyncHandler(async (_req: Request, res: Response) => {
  const entries = await guestbookModel.findApproved();
  res.status(200).json(entries);
});

const add = asyncHandler(async (req: Request, res: Response) => {
  const entry = await guestbookModel.create(req.body);
  res.status(201).json(entry);
});

export { add, browseApproved };

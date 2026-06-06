import type { Request, Response } from "express";
import statsModel from "../models/statsModel";
import { asyncHandler } from "../utils/asyncHandler";

const read = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await statsModel.getAdminStats();
  res.status(200).json(stats);
});

export { read };

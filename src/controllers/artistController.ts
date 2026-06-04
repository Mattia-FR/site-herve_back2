import type { Request, Response } from "express";
import { NotFoundError } from "../errors/AppError";
import artistModel from "../models/artistModel";
import { asyncHandler } from "../utils/asyncHandler";

const readProfile = asyncHandler(async (_req: Request, res: Response) => {
  const profile = await artistModel.findProfile();
  if (!profile) throw new NotFoundError("Profil artiste");
  res.status(200).json(profile);
});

export { readProfile };

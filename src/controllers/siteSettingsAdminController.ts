import type { Request, Response } from "express";
import type { z } from "zod";
import { NotFoundError } from "../errors/AppError";
import siteSettingsModel from "../models/siteSettingsModel";
import type { SiteSettingsUpdateData } from "../types/siteSettings";
import { asyncHandler } from "../utils/asyncHandler";
import { getValidatedBody } from "../utils/http/requestHelpers";
import type { siteSettingsUpdateSchema } from "../validation/siteSettings.schemas";

const read = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await siteSettingsModel.find();
  if (!settings) throw new NotFoundError("Paramètres du site");
  res.status(200).json(settings);
});

const edit = asyncHandler(async (req: Request, res: Response) => {
  const data: SiteSettingsUpdateData = {
    ...getValidatedBody<z.infer<typeof siteSettingsUpdateSchema>>(req),
  };

  const settings = await siteSettingsModel.update(data);
  if (!settings) throw new NotFoundError("Paramètres du site");
  res.status(200).json(settings);
});

export { edit, read };

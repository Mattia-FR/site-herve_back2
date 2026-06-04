import type { Request, Response } from "express";
import { NotFoundError } from "../errors/AppError";
import usersAdminModel from "../models/usersAdminModel";
import usersModel from "../models/usersModel";
import { asyncHandler } from "../utils/asyncHandler";

const readById = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersModel.findById(Number(req.params.id));
  if (!user) throw new NotFoundError("Utilisateur");
  res.status(200).json(user);
});

const edit = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersAdminModel.update(Number(req.params.id), req.body);
  if (!user) throw new NotFoundError("Utilisateur");
  res.status(200).json(user);
});

export { edit, readById };

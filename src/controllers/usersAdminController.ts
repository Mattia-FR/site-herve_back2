import argon2 from "argon2";
import type { Request, Response } from "express";
import type { z } from "zod";
import { argon2Options } from "../config/argon2";
import { NotFoundError } from "../errors/AppError";
import usersAdminModel from "../models/usersAdminModel";
import usersModel from "../models/usersModel";
import type { UserUpdateData } from "../types/users";
import { asyncHandler } from "../utils/asyncHandler";
import { getAuthUserId, getValidatedBody } from "../utils/http/requestHelpers";
import type { userUpdateSchema } from "../validation/users.schemas";

const readMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const user = await usersModel.findById(userId);
  if (!user) throw new NotFoundError("Utilisateur");
  res.status(200).json(user);
});

const editMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const data: UserUpdateData = {
    ...getValidatedBody<z.infer<typeof userUpdateSchema>>(req),
  };
  if (data.password) {
    data.password = await argon2.hash(data.password, argon2Options);
  }

  const user = await usersAdminModel.update(userId, data);
  if (!user) throw new NotFoundError("Utilisateur");
  res.status(200).json(user);
});

export { editMe, readMe };

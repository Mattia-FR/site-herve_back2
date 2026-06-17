/**
 * Controller admin — profil de l'utilisateur connecté.
 *
 * Rôle : permettre à l'administrateur de consulter et mettre à jour son propre
 * profil (informations personnelles, bio, photo, mot de passe).
 *
 * Routes correspondantes (voir usersAdminRouter.ts, préfixe /api/admin/users) :
 *   GET /me → lire le profil de l'utilisateur connecté
 *   PUT /me → mettre à jour le profil
 *
 * Note sécurité : si le mot de passe est fourni dans la requête, il est haché
 * avec Argon2 avant stockage — le controller ne stocke jamais le mot de passe
 * en clair.
 */
import argon2 from "argon2";
import type { Request, Response } from "express";
import type { z } from "zod";
import { argon2Options } from "../config/argon2";
import { NotFoundResource } from "../config/errorCodes";
import { NotFoundError } from "../errors/AppError";
import usersAdminModel from "../models/usersAdminModel";
import usersModel from "../models/usersModel";
import type { UserUpdateData } from "../types/users";
import { asyncHandler } from "../utils/asyncHandler";
import { getAuthUserId, getValidatedBody } from "../utils/http/requestHelpers";
import type { userUpdateSchema } from "../validation/users.schemas";

/**
 * GET /api/admin/users/me
 * Retourne le profil de l'utilisateur connecté (extrait userId depuis le JWT via req.user).
 */
const readMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const user = await usersModel.findById(userId);
  if (!user) throw new NotFoundError(NotFoundResource.USER);
  res.status(200).json(user);
});

/**
 * PUT /api/admin/users/me
 * Met à jour le profil de l'utilisateur connecté.
 * Le mot de passe est haché si fourni (ne doit jamais être stocké en clair).
 */
const editMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const data: UserUpdateData = {
    ...getValidatedBody<z.infer<typeof userUpdateSchema>>(req),
  };
  // Hachage du nouveau mot de passe avant mise à jour
  if (data.password) {
    data.password = await argon2.hash(data.password, argon2Options);
  }

  const user = await usersAdminModel.update(userId, data);
  if (!user) throw new NotFoundError(NotFoundResource.USER);
  res.status(200).json(user);
});

export { editMe, readMe };

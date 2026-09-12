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
import { DEFAULT_ERROR_MESSAGES, ErrorCode, NotFoundResource } from "../config/errorCodes";
import { NotFoundError, UnauthorizedError } from "../errors/AppError";
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
 * Si un nouveau mot de passe est demandé, le mot de passe actuel doit être vérifié.
 */
const editMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const bodyData = getValidatedBody<z.infer<typeof userUpdateSchema>>(req);

  // Si changement de mot de passe demandé
  if (bodyData.password) {
    // Vérifier que current_password est fourni (garanti par la validation Zod)
    if (!bodyData.current_password) {
      throw new UnauthorizedError(
        DEFAULT_ERROR_MESSAGES[ErrorCode.CURRENT_PASSWORD_INCORRECT],
        ErrorCode.CURRENT_PASSWORD_INCORRECT
      );
    }

    // Récupérer l'utilisateur avec son mot de passe actuel
    const userWithPassword = await usersModel.findByIdWithPassword(userId);
    if (!userWithPassword) throw new NotFoundError(NotFoundResource.USER);

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await argon2.verify(
      userWithPassword.password,
      bodyData.current_password
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedError(
        DEFAULT_ERROR_MESSAGES[ErrorCode.CURRENT_PASSWORD_INCORRECT],
        ErrorCode.CURRENT_PASSWORD_INCORRECT
      );
    }
  }

  // Préparer les données de mise à jour (sans current_password)
  const data: UserUpdateData = {
    username: bodyData.username,
    email: bodyData.email,
    first_name: bodyData.first_name,
    last_name: bodyData.last_name,
    tagline: bodyData.tagline,
    bio: bodyData.bio,
    hero_text: bodyData.hero_text,
    quote_text: bodyData.quote_text,
    quote_author: bodyData.quote_author,
    profile_image_id: bodyData.profile_image_id,
  };

  // Hasher le nouveau mot de passe si fourni
  if (bodyData.password) {
    data.password = await argon2.hash(bodyData.password, argon2Options);
  }

  const user = await usersAdminModel.update(userId, data);
  if (!user) throw new NotFoundError(NotFoundResource.USER);
  res.status(200).json(user);
});

export { editMe, readMe };

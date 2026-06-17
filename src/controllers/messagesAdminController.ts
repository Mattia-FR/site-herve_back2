/**
 * Controller admin — modération des messages de contact.
 *
 * Rôle : consulter et modérer les messages envoyés via le formulaire de contact.
 *
 * Routes correspondantes (voir messagesAdminRouter.ts, préfixe /api/admin/messages) :
 *   GET    /     → liste paginée de tous les messages (unread/read/spam)
 *   GET    /:id  → détail d'un message
 *   PATCH  /:id  → modifier le statut (ex: unread → read, read → spam)
 *   DELETE /:id  → supprimer définitivement un message
 */
import type { Request, Response } from "express";
import type { z } from "zod";
import { NotFoundResource } from "../config/errorCodes";
import { NotFoundError } from "../errors/AppError";
import messagesAdminModel from "../models/messagesAdminModel";
import { asyncHandler } from "../utils/asyncHandler";
import { getValidatedBody, getValidatedId, getValidatedQuery } from "../utils/http/requestHelpers";
import type { messageUpdateSchema } from "../validation/messages.schemas";
import type { adminPaginationQuerySchema } from "../validation/pagination.schemas";

/** GET /api/admin/messages — liste paginée de tous les messages. */
const browse = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getValidatedQuery<z.infer<typeof adminPaginationQuerySchema>>(req);
  const result = await messagesAdminModel.findPaginated(page, limit);
  res.status(200).json(result);
});

/** GET /api/admin/messages/:id — retourne un message par son ID. */
const read = asyncHandler(async (req: Request, res: Response) => {
  const message = await messagesAdminModel.findById(getValidatedId(req));
  if (!message) throw new NotFoundError(NotFoundResource.MESSAGE);
  res.status(200).json(message);
});

/** PATCH /api/admin/messages/:id — met à jour le statut d'un message. */
const edit = asyncHandler(async (req: Request, res: Response) => {
  const message = await messagesAdminModel.update(
    getValidatedId(req),
    getValidatedBody<z.infer<typeof messageUpdateSchema>>(req)
  );
  if (!message) throw new NotFoundError(NotFoundResource.MESSAGE);
  res.status(200).json(message);
});

/** DELETE /api/admin/messages/:id — supprime définitivement un message. */
const destroy = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await messagesAdminModel.deleteById(getValidatedId(req));
  if (!deleted) throw new NotFoundError(NotFoundResource.MESSAGE);
  res.sendStatus(204);
});

export { browse, destroy, edit, read };

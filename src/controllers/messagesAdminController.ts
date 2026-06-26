/**
 * Controller admin — modération des messages de contact.
 *
 * Rôle : consulter et modérer les messages envoyés via le formulaire de contact.
 *
 * Routes correspondantes (voir messagesAdminRouter.ts, préfixe /api/admin/messages) :
 *   GET    /     → liste paginée de tous les messages (unread/read/spam)
 *   GET    /:id  → détail d'un message (marque unread → read à l'ouverture)
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
import type {
  messageUpdateSchema,
  messagesAdminListQuerySchema,
} from "../validation/messages.schemas";

/** GET /api/admin/messages — liste paginée de tous les messages. */
const browse = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, status } =
    getValidatedQuery<z.infer<typeof messagesAdminListQuerySchema>>(req);
  const result = await messagesAdminModel.findPaginated(page, limit, status);
  res.status(200).json(result);
});

/** GET /api/admin/messages/:id — retourne un message et le marque lu si non lu. */
const read = asyncHandler(async (req: Request, res: Response) => {
  const message = await messagesAdminModel.findByIdAndMarkRead(getValidatedId(req));
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

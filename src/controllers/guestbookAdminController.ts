/**
 * Controller admin — modération du livre d'or.
 *
 * Rôle : consulter et modérer les entrées soumises par les visiteurs.
 * Les entrées sont créées avec le statut "pending" et doivent être
 * approuvées avant d'être visibles publiquement.
 *
 * Routes correspondantes (voir guestbookAdminRouter.ts, préfixe /api/admin/guestbook) :
 *   GET    /     → liste paginée de toutes les entrées (pending/approved/spam)
 *   GET    /:id  → détail d'une entrée
 *   PATCH  /:id  → changer le statut (pending → approved / spam)
 *   DELETE /:id  → supprimer définitivement une entrée
 */
import type { Request, Response } from "express";
import type { z } from "zod";
import { NotFoundResource } from "../config/errorCodes";
import { NotFoundError } from "../errors/AppError";
import guestbookAdminModel from "../models/guestbookAdminModel";
import { asyncHandler } from "../utils/asyncHandler";
import { getValidatedBody, getValidatedId, getValidatedQuery } from "../utils/http/requestHelpers";
import type { guestbookUpdateSchema } from "../validation/guestbook.schemas";
import type { adminPaginationQuerySchema } from "../validation/pagination.schemas";

/** GET /api/admin/guestbook — liste paginée de toutes les entrées. */
const browseAll = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getValidatedQuery<z.infer<typeof adminPaginationQuerySchema>>(req);
  const result = await guestbookAdminModel.findPaginated(page, limit);
  res.status(200).json(result);
});

/** GET /api/admin/guestbook/:id — retourne une entrée par son ID. */
const read = asyncHandler(async (req: Request, res: Response) => {
  const entry = await guestbookAdminModel.findById(getValidatedId(req));
  if (!entry) throw new NotFoundError(NotFoundResource.GUESTBOOK_ENTRY);
  res.status(200).json(entry);
});

/** PATCH /api/admin/guestbook/:id — met à jour le statut d'une entrée. */
const edit = asyncHandler(async (req: Request, res: Response) => {
  const entry = await guestbookAdminModel.update(
    getValidatedId(req),
    getValidatedBody<z.infer<typeof guestbookUpdateSchema>>(req)
  );
  if (!entry) throw new NotFoundError(NotFoundResource.GUESTBOOK_ENTRY);
  res.status(200).json(entry);
});

/** DELETE /api/admin/guestbook/:id — supprime définitivement une entrée. */
const destroy = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await guestbookAdminModel.deleteById(getValidatedId(req));
  if (!deleted) throw new NotFoundError(NotFoundResource.GUESTBOOK_ENTRY);
  res.sendStatus(204);
});

export { browseAll, destroy, edit, read };

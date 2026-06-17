/**
 * Controller public — formulaire de contact.
 *
 * Rôle : recevoir et enregistrer un message de contact envoyé par un visiteur.
 * Envoie une notification par email si EMAIL_ENABLED=true (asynchrone, non bloquant).
 *
 * Route correspondante : POST /api/messages
 * (précédée par le honeypot et la validation Zod dans messagesRouter.ts)
 */
import type { Request, Response } from "express";
import messagesModel from "../models/messagesModel";
import mailService from "../services/mailService";
import type { MessageCreateData } from "../types/messages";
import { asyncHandler } from "../utils/asyncHandler";
import { getValidatedBody } from "../utils/http/requestHelpers";

/**
 * POST /api/messages
 * Crée un message de contact et notifie l'administrateur par email.
 * L'IP de l'expéditeur est capturée pour la modération.
 * L'email de notification est lancé via void (non attendu) pour ne pas
 * bloquer la réponse si le SMTP est lent.
 */
const add = asyncHandler(async (req: Request, res: Response) => {
  const ip = req.ip ?? null;
  const body = getValidatedBody<MessageCreateData>(req);
  const message = await messagesModel.create({ ...body, ip });
  // Notification email asynchrone — une erreur SMTP ne doit pas faire échouer la requête
  void mailService.notifyNewContactMessage(message);
  res.status(201).json(message);
});

export { add };

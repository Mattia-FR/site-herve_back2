/**
 * Middleware anti-spam honeypot pour les formulaires publics.
 *
 * Rôle : détecter les soumissions automatisées (bots) en vérifiant si un champ
 * caché ("website") a été rempli. Les utilisateurs humains ne voient pas ce champ
 * (masqué en CSS), donc s'il contient une valeur, c'est très probablement un bot.
 *
 * Stratégie de réponse aux bots :
 *   Au lieu de retourner une erreur (qui alerterait le bot), on renvoie une fausse
 *   réponse de succès (201) avec des données factices. Le bot croit avoir réussi
 *   et n'essaie pas de contourner la protection.
 *
 * Deux instances préconfigurées sont exportées :
 *   - honeypotMessageMiddleware  → formulaire de contact
 *   - honeypotGuestbookMiddleware → livre d'or
 */
import type { NextFunction, Request, Response } from "express";
import { HONEYPOT_FIELD_NAME } from "../config/honeypot";

/**
 * Vérifie si le champ honeypot du body a été rempli.
 * @param body - Corps de la requête (req.body)
 * @param fieldName - Nom du champ à surveiller
 * @returns true si le honeypot est déclenché (bot probable)
 */
function isHoneypotTripped(body: unknown, fieldName: string): boolean {
  if (body == null || typeof body !== "object") return false;
  const value = (body as Record<string, unknown>)[fieldName];
  if (value == null) return false;
  if (typeof value === "string") return value.trim() !== "";
  return true;
}

/** Type de la fonction renvoyant la fausse réponse. */
type FakeResponseHandler = (req: Request, res: Response) => void;

/**
 * Factory de middleware honeypot.
 * @param onTripped  - Fonction appelée quand le honeypot est déclenché (fausse réponse)
 * @param fieldName  - Nom du champ honeypot (défaut : HONEYPOT_FIELD_NAME)
 */
export function createHoneypotMiddleware(
  onTripped: FakeResponseHandler,
  fieldName: string = HONEYPOT_FIELD_NAME
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (isHoneypotTripped(req.body, fieldName)) {
      onTripped(req, res);
      return;
    }
    next();
  };
}

/** Fausse réponse 201 imitant la création d'un message de contact. */
const fakeMessageResponse = (_req: Request, res: Response): void => {
  res.status(201).json({
    id: 0,
    firstname: null,
    lastname: null,
    email: "",
    ip: null,
    subject: "",
    text: "",
    status: "unread",
    created_at: new Date().toISOString(),
  });
};

/** Fausse réponse 201 imitant la création d'une entrée de livre d'or. */
const fakeGuestbookResponse = (_req: Request, res: Response): void => {
  res.status(201).json({
    id: 0,
    author_name: "",
    email: null,
    message: "",
    status: "pending",
    created_at: new Date().toISOString(),
  });
};

/** Middleware honeypot pour le formulaire de contact (route POST /api/messages). */
export const honeypotMessageMiddleware = createHoneypotMiddleware(fakeMessageResponse);

/** Middleware honeypot pour le livre d'or (route POST /api/guestbook). */
export const honeypotGuestbookMiddleware = createHoneypotMiddleware(fakeGuestbookResponse);

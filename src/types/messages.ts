/**
 * Types TypeScript — Messages de contact.
 *
 * Rôle : définir le contrat des messages envoyés via le formulaire de contact.
 *
 * MessageStatus    : états de modération d'un message
 * Message          : message complet retourné par l'API admin
 * MessageCreateData : données pour créer un message (depuis le formulaire public)
 * MessageUpdateData : données partielles pour modifier le statut (modération)
 */

/** Statuts de modération d'un message de contact. */
export type MessageStatus = "unread" | "read" | "archived" | "spam";

/** Message de contact complet retourné par l'API. */
export interface Message {
  id: number;
  firstname: string | null;
  lastname: string | null;
  email: string;
  ip: string | null; // IP de l'expéditeur (pour la modération)
  subject: string;
  text: string;
  status: MessageStatus;
  created_at: string;
}

/** Données pour créer un message depuis le formulaire de contact public. */
export interface MessageCreateData {
  firstname?: string | null;
  lastname?: string | null;
  email: string;
  ip?: string | null; // injecté par le controller depuis req.ip
  subject: string;
  text: string;
}

/** Données partielles pour mettre à jour le statut d'un message (modération admin). */
export interface MessageUpdateData {
  status?: MessageStatus;
}

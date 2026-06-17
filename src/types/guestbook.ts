/**
 * Types TypeScript — Livre d'or.
 *
 * Rôle : définir le contrat des entrées du livre d'or soumises par les visiteurs.
 *
 * GuestbookStatus    : états de modération d'une entrée
 * GuestbookEntry     : entrée complète retournée par l'API
 * GuestbookCreateData : données pour créer une entrée (soumission publique)
 * GuestbookUpdateData : données pour changer le statut (modération admin)
 *
 * Note : les entrées créées ont le statut "pending" par défaut.
 * Seules les entrées "approved" sont visibles publiquement.
 */

/** Statuts de modération d'une entrée de livre d'or. */
export type GuestbookStatus = "pending" | "approved" | "spam";

/** Entrée de livre d'or complète. */
export interface GuestbookEntry {
  id: number;
  author_name: string;
  email: string | null; // optionnel, non publié (visible uniquement en admin)
  message: string;
  status: GuestbookStatus;
  created_at: string;
}

/** Données pour soumettre une entrée depuis le formulaire public. */
export interface GuestbookCreateData {
  author_name: string;
  email?: string | null; // optionnel : les visiteurs peuvent rester anonymes
  message: string;
}

/** Données pour modifier le statut d'une entrée (admin uniquement). */
export interface GuestbookUpdateData {
  status: GuestbookStatus;
}

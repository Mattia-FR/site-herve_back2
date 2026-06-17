/**
 * Service d'envoi d'emails — notifications administrateur.
 *
 * Rôle : envoyer des notifications par email à l'administrateur quand un
 * visiteur soumet un message de contact ou une entrée de livre d'or.
 *
 * Activation : les emails ne sont envoyés que si EMAIL_ENABLED=true dans .env.
 * En cas d'échec SMTP, l'erreur est loguée en avertissement mais ne fait pas
 * planter la requête (le controller appelle les fonctions avec `void`).
 *
 * Architecture :
 *   - Le transporter Nodemailer est créé de façon lazy (au premier appel)
 *     via getTransporter() pour éviter une initialisation inutile si EMAIL_ENABLED=false
 *   - verifyTransporter() est appelé au démarrage (startup.ts) pour vérifier
 *     la configuration SMTP sans bloquer le lancement du serveur
 */
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../config/env";
import logger from "../config/logger";
import type { GuestbookEntry } from "../types/guestbook";
import type { Message } from "../types/messages";

/** Instance partagée du transporter Nodemailer (undefined = non encore créé, null = désactivé). */
let transporter: Transporter | null | undefined;

/**
 * Retourne le transporter Nodemailer, en le créant au premier appel (lazy init).
 * Retourne null si EMAIL_ENABLED=false.
 */
function getTransporter(): Transporter | null {
  if (!env.EMAIL_ENABLED) return null;

  if (transporter === undefined) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE, // true = TLS direct (port 465), false = STARTTLS (port 587)
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  return transporter;
}

/** Options pour l'envoi d'un email de notification. */
interface SendMailOptions {
  subject: string;
  text: string;
  replyTo?: string; // permet de répondre directement à l'expéditeur du formulaire
}

/**
 * Envoie un email de notification à NOTIFY_EMAIL.
 * En cas d'échec SMTP, logue un avertissement sans lever d'erreur
 * (ne doit pas impacter la réponse HTTP).
 */
async function sendMail(options: SendMailOptions): Promise<void> {
  const tx = getTransporter();
  if (!tx || !env.NOTIFY_EMAIL || !env.SMTP_FROM) return;

  try {
    await tx.sendMail({
      from: env.SMTP_FROM,
      to: env.NOTIFY_EMAIL,
      subject: options.subject,
      text: options.text,
      replyTo: options.replyTo,
    });
  } catch (err) {
    logger.warn({
      message: "Échec envoi email",
      subject: options.subject,
      err: err instanceof Error ? err.message : err,
    });
  }
}

/** Formate une date ISO en chaîne lisible en français (fuseau Europe/Paris). */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
}

/** Construit le nom complet de l'expéditeur du message (ou "Anonyme" si absent). */
function formatContactName(message: Message): string {
  const parts = [message.firstname, message.lastname].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Anonyme";
}

/** Construit le corps texte de l'email de notification pour un message de contact. */
function buildContactBody(message: Message): string {
  const adminUrl = `${env.CORS_ORIGIN}/admin/messages`;

  return `Nouveau message via le formulaire de contact

De : ${formatContactName(message)} <${message.email}>
Sujet : ${message.subject}

Message :
${message.text}

Reçu le ${formatDate(message.created_at)}
Voir dans l'admin : ${adminUrl}`;
}

/** Construit le corps texte de l'email de notification pour une entrée de livre d'or. */
function buildGuestbookBody(entry: GuestbookEntry): string {
  const adminUrl = `${env.CORS_ORIGIN}/admin/guestbook`;
  const emailLine = entry.email ? `Email : ${entry.email} (non publié)\n` : "";

  return `Nouvelle entrée livre d'or (en attente de modération)

Auteur : ${entry.author_name}
${emailLine}
Message :
${entry.message}

Reçu le ${formatDate(entry.created_at)}
Modérer : ${adminUrl}`;
}

/**
 * Envoie une notification email à l'admin pour un nouveau message de contact.
 * Le replyTo est défini sur l'email de l'expéditeur pour faciliter la réponse directe.
 */
async function notifyNewContactMessage(message: Message): Promise<void> {
  await sendMail({
    subject: `[Contact] ${message.subject}`,
    text: buildContactBody(message),
    replyTo: message.email,
  });
}

/**
 * Envoie une notification email à l'admin pour une nouvelle entrée de livre d'or.
 * L'entrée est en attente de modération — le lien admin est inclus dans le corps.
 */
async function notifyNewGuestbookEntry(entry: GuestbookEntry): Promise<void> {
  await sendMail({
    subject: "[Livre d'or] Nouvelle entrée à modérer",
    text: buildGuestbookBody(entry),
    replyTo: entry.email ?? undefined,
  });
}

/**
 * Vérifie que le transporter SMTP peut se connecter au serveur.
 * Appelé au démarrage (startup.ts) — un échec est loggué en warn
 * mais ne bloque pas le lancement du serveur.
 */
async function verifyTransporter(): Promise<void> {
  const tx = getTransporter();
  if (!tx) return;

  try {
    await tx.verify();
    logger.info({ message: "Connexion SMTP OK" });
  } catch (err) {
    logger.warn({
      message: "Vérification SMTP échouée — les notifications email risquent d'échouer",
      err: err instanceof Error ? err.message : err,
    });
  }
}

export default {
  notifyNewContactMessage,
  notifyNewGuestbookEntry,
  verifyTransporter,
};

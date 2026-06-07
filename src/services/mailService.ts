import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../config/env";
import logger from "../config/logger";
import type { GuestbookEntry } from "../types/guestbook";
import type { Message } from "../types/messages";

let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (!env.EMAIL_ENABLED) return null;

  if (transporter === undefined) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  return transporter;
}

interface SendMailOptions {
  subject: string;
  text: string;
  replyTo?: string;
}

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
}

function formatContactName(message: Message): string {
  const parts = [message.firstname, message.lastname].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Anonyme";
}

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

async function notifyNewContactMessage(message: Message): Promise<void> {
  await sendMail({
    subject: `[Contact] ${message.subject}`,
    text: buildContactBody(message),
    replyTo: message.email,
  });
}

async function notifyNewGuestbookEntry(entry: GuestbookEntry): Promise<void> {
  await sendMail({
    subject: "[Livre d'or] Nouvelle entrée à modérer",
    text: buildGuestbookBody(entry),
    replyTo: entry.email ?? undefined,
  });
}

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

/**
 * Options de hachage des mots de passe avec Argon2id.
 *
 * Rôle : centraliser la configuration Argon2 utilisée lors de la création
 * et de la vérification des mots de passe (authController.ts).
 *
 * Algorithme choisi : argon2id
 *   Combine argon2i (résistance aux attaques par canal latéral) et argon2d
 *   (résistance aux attaques GPU). Recommandé par l'OWASP pour les mots de passe.
 *
 * Paramètres (conformes aux recommandations OWASP 2023) :
 *   - memoryCost  : 19 456 Kio (≈ 19 Mo) — coût mémoire par hachage
 *   - timeCost    : 2 itérations
 *   - parallelism : 1 thread
 *
 * Ces valeurs ralentissent intentionnellement le hachage pour rendre les
 * attaques par force brute coûteuses, sans impacter significativement
 * l'expérience utilisateur (quelques dizaines de millisecondes).
 */
import argon2 from "argon2";

export const argon2Options = {
  type: argon2.argon2id,
  memoryCost: 19 * 2 ** 10, // 19 456 Kio ≈ 19 Mo
  timeCost: 2,
  parallelism: 1,
};

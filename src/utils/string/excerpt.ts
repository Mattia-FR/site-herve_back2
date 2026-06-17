/**
 * Génération d'extraits textuels à partir de contenu HTML.
 *
 * Rôle : créer automatiquement un extrait (excerpt) des articles en
 * extrayant les premiers mots du contenu après avoir supprimé les balises HTML.
 *
 * Utilisé dans articlesAdminModel lors de la création et de la mise à jour
 * d'articles pour renseigner automatiquement le champ `excerpt`.
 *
 * Exemple :
 *   createExcerpt("<p>Bonjour le <strong>monde</strong> !", 3)
 *   → "Bonjour le monde…"
 */

/** Nombre de mots par défaut dans l'extrait. */
const DEFAULT_WORD_COUNT = 25;

/**
 * Retourne un extrait du texte : les premiers `wordCount` mots suivis de "…".
 * Les balises HTML sont supprimées avant découpage.
 * @param text      - Contenu HTML ou texte brut
 * @param wordCount - Nombre de mots à conserver (défaut : 25)
 * @returns Extrait textuel, ou chaîne vide si text est absent/invalide
 */
export function createExcerpt(text: string, wordCount = DEFAULT_WORD_COUNT): string {
  if (!text || typeof text !== "string") return "";
  const stripped = text
    .replace(/<[^>]*>/g, " ") // supprimer toutes les balises HTML
    .replace(/\s+/g, " ") // normaliser les espaces multiples
    .trim();
  if (!stripped) return "";
  const words = stripped.split(" ");
  if (words.length <= wordCount) return stripped;
  return `${words.slice(0, wordCount).join(" ")}…`;
}

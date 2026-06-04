const DEFAULT_WORD_COUNT = 25;

/**
 * Retourne un extrait du texte : les x premiers mots + "…".
 * Les balises HTML sont retirées avant découpage.
 */
export function createExcerpt(text: string, wordCount = DEFAULT_WORD_COUNT): string {
  if (!text || typeof text !== "string") return "";
  const stripped = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!stripped) return "";
  const words = stripped.split(" ");
  if (words.length <= wordCount) return stripped;
  return words.slice(0, wordCount).join(" ") + "…";
}

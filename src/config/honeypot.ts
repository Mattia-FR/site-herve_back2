/**
 * Nom du champ honeypot utilisé dans les formulaires publics.
 *
 * Rôle : les formulaires de contact et de livre d'or incluent un champ caché
 * nommé "website" dans leur HTML. Les robots de spam remplissent généralement
 * tous les champs d'un formulaire automatiquement, ce qui trahit leur nature.
 * Le middleware honeypotMiddleware vérifie ce champ : si rempli → fausse réponse 201.
 *
 * Ce fichier centralise le nom du champ pour éviter la duplication entre
 * le middleware et les schémas de validation (qui le déclarent comme optionnel).
 */
export const HONEYPOT_FIELD_NAME = "website";

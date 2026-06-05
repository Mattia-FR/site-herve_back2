# Gestion des erreurs — Back2

## Architecture mise en place

```
Requête HTTP
    ↓
routes/*.ts               ← validateBody / validateQuery / validateParams / requireValidId (Zod)
    ↓
controllers/*.ts          ← asyncHandler (pas de try/catch)
    ↓
models/*.ts               ← throw AppError si ressource introuvable
    ↓
middlewares/errorHandler  ← répond avec le format standardisé
```

---

## Contrat d'erreur

Toutes les réponses d'erreur ont le format suivant :

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Article introuvable"
}
```

Erreur de validation Zod (champs du formulaire) :

```json
{
  "success": false,
  "code": "VALIDATION_FAILED",
  "message": "Validation échouée",
  "details": [
    { "field": "email", "message": "Email invalide" }
  ]
}
```

| Champ     | Type      | Description                                      |
|-----------|-----------|--------------------------------------------------|
| `success` | `false`   | Toujours `false` pour les erreurs                |
| `code`    | `string`  | Code machine (voir liste ci-dessous)             |
| `message` | `string`  | Message lisible, transmissible au frontend       |
| `details` | `array?`  | Présent uniquement pour `VALIDATION_FAILED` (Zod) |

---

## Codes d'erreur

> Source de vérité code : [`src/config/errorCodes.ts`](src/config/errorCodes.ts) — garder en sync avec `site-herve_front2/src/types/api.ts`.

| Code                   | HTTP | Classe                | Déclenchement                            |
|------------------------|------|-----------------------|------------------------------------------|
| `NOT_FOUND`            | 404  | `NotFoundError`       | Ressource introuvable en base            |
| `ROUTE_NOT_FOUND`      | 404  | `RouteNotFoundError`  | Route HTTP inconnue                      |
| `VALIDATION_FAILED`    | 400  | `ValidationFailedError` | Échec Zod (détails par champ)        |
| `VALIDATION_ERROR`     | 400  | `ValidationError`     | Contrainte SQL / message métier unique   |
| `BAD_REQUEST`          | 400  | `BadRequestError`     | Requête invalide (générique)             |
| `INVALID_ID`           | 400  | `BadRequestError`     | Paramètre `:id` non entier positif       |
| `UNAUTHORIZED`         | 401  | `UnauthorizedError`   | Token absent ou session invalide         |
| `INVALID_CREDENTIALS`  | 401  | `UnauthorizedError`   | Email ou mot de passe incorrect (login)  |
| `TOKEN_EXPIRED`        | 401  | `UnauthorizedError`   | Access ou refresh token expiré           |
| `TOKEN_INVALID`        | 401  | `UnauthorizedError`   | JWT malformé ou signature invalide         |
| `FILE_REQUIRED`        | 400  | `BadRequestError`     | Upload sans fichier                      |
| `FILE_TOO_LARGE`       | 400  | `BadRequestError`     | Fichier > 10 Mo (Multer)                 |
| `FILE_TYPE_NOT_ALLOWED`| 400  | `BadRequestError`     | MIME ou magic bytes non autorisés        |
| `IMAGE_DIMENSIONS_TOO_LARGE` | 400 | `BadRequestError` | Dimensions > 10 000 px (metadata Sharp) |
| `IMAGE_INVALID`        | 400  | `BadRequestError`     | Fichier corrompu / illisible par Sharp malgré magic bytes valides |
| `RATE_LIMITED`         | 429  | —                     | Trop de requêtes (rate limiter)        |
| `INTERNAL_ERROR`       | 500  | `InternalError`       | Erreur inattendue (filet de sécurité)    |

---

## Hiérarchie d'erreurs (`src/errors/AppError.ts`)

```ts
AppError (base, `details?` optionnel)
├── NotFoundError         → 404 / NOT_FOUND
├── RouteNotFoundError    → 404 / ROUTE_NOT_FOUND
├── ValidationFailedError → 400 / VALIDATION_FAILED (+ details[])
├── ValidationError       → 400 / VALIDATION_ERROR
├── BadRequestError       → 400 / BAD_REQUEST (+ codes fichier, INVALID_ID, IMAGE_DIMENSIONS_TOO_LARGE, IMAGE_INVALID)
├── UnauthorizedError     → 401 / UNAUTHORIZED (+ INVALID_CREDENTIALS, TOKEN_*)
└── InternalError         → 500 / INTERNAL_ERROR
```

Helper central : `src/utils/sendError.ts` — utilisé par `errorHandler`, `notFound` et les controllers auth.

Usage dans un controller ou un model :

```ts
import { NotFoundError, ValidationError } from "../errors/AppError";

// Ressource absente
if (!article) throw new NotFoundError("Article");

// Donnée invalide
throw new ValidationError("Email déjà utilisé");
```

---

## Validation Zod (`src/validation/`, `src/middlewares/validationMiddleware.ts`)

Les schémas sont alignés avec `site-herve_front/src/validation/schemas.ts`. Après validation réussie :

- `req.validatedBody` — body JSON ou form-data parsé
- `req.validatedQuery` — query string
- `req.validatedParams` — paramètres d’URL (ex. slug)
- `req.validatedId` — entier positif via `requireValidId()`

Les controllers utilisent `getValidatedBody`, `getValidatedQuery`, etc. (`src/utils/http/requestHelpers.ts`).

**Distinction importante :**

- `VALIDATION_FAILED` : payload HTTP rejeté par Zod → le front peut mapper `details` sur les champs du formulaire
- `VALIDATION_ERROR` : erreur après passage du middleware (doublon SQL, référence FK, etc.)

---

## Wrapper `asyncHandler` (`src/utils/asyncHandler.ts`)

Élimine les `try/catch` dans les controllers. Les erreurs remontent automatiquement au middleware global via `next(err)`.

```ts
// Avant
const readById = async (req: Request, res: Response): Promise<void> => {
  try {
    const article = await model.findByIdForAdmin(Number(req.params.id));
    if (!article) {
      res.status(404).json({ message: "Article introuvable" });
      return;
    }
    res.status(200).json(article);
  } catch {
    res.status(500).json({ message: "Erreur interne" });
  }
};

// Après
const readById = asyncHandler(async (req: Request, res: Response) => {
  const article = await model.findByIdForAdmin(Number(req.params.id));
  if (!article) throw new NotFoundError("Article");
  res.status(200).json(article);
});
```

---

## Middleware global (`src/middlewares/errorHandler.ts`)

Gère deux cas :

1. **`AppError`** → répond avec `statusCode` et `code` de l'instance
2. **Erreur MySQL brute** (`ER_DUP_ENTRY`) → mappe automatiquement en `ValidationError`
3. **Tout le reste** → 500 / `INTERNAL_ERROR`

En développement, la stack trace est loguée dans la console. En production, seul le message standardisé est renvoyé.

---

## Mapping des erreurs MySQL

Les erreurs SQL brutes ne doivent jamais atteindre le client. Le middleware global intercepte les codes MySQL connus :

| Code MySQL       | errno | Mappé vers          | Message                  |
|------------------|-------|---------------------|--------------------------|
| `ER_DUP_ENTRY`   | 1062  | `ValidationError`   | "Cette valeur existe déjà" |

Pour les cas plus précis (ex. email dupliqué), la logique de mapping doit être dans le model concerné, avant le `throw`.

---

## Règles à respecter

- **Ne jamais** appeler `res.status().json()` directement dans un controller pour les erreurs → toujours `throw`
- **Ne jamais** laisser une erreur SQL brute remonter jusqu'au client
- **Toujours** utiliser `asyncHandler` pour wrapper les handlers async
- **Toujours** importer `AppError` depuis `../errors/AppError`, pas créer de nouveaux `new Error()`

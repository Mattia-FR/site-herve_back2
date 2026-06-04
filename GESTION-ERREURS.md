# Gestion des erreurs — Back2

## Architecture mise en place

```
Requête HTTP
    ↓
routes/*.ts
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

| Champ     | Type      | Description                                      |
|-----------|-----------|--------------------------------------------------|
| `success` | `false`   | Toujours `false` pour les erreurs                |
| `code`    | `string`  | Code machine (voir liste ci-dessous)             |
| `message` | `string`  | Message lisible, transmissible au frontend       |

---

## Codes d'erreur

| Code               | HTTP | Classe                | Déclenchement                            |
|--------------------|------|-----------------------|------------------------------------------|
| `NOT_FOUND`        | 404  | `NotFoundError`       | Ressource introuvable en base            |
| `VALIDATION_ERROR` | 400  | `ValidationError`     | Données invalides / contrainte SQL       |
| `UNAUTHORIZED`     | 401  | `UnauthorizedError`   | Authentification manquante ou invalide   |
| `INTERNAL_ERROR`   | 500  | —                     | Erreur inattendue (filet de sécurité)    |

---

## Hiérarchie d'erreurs (`src/errors/AppError.ts`)

```ts
AppError (base)
├── NotFoundError       → 404 / NOT_FOUND
├── ValidationError     → 400 / VALIDATION_ERROR
└── UnauthorizedError   → 401 / UNAUTHORIZED
```

Usage dans un controller ou un model :

```ts
import { NotFoundError, ValidationError } from "../errors/AppError";

// Ressource absente
if (!article) throw new NotFoundError("Article");

// Donnée invalide
throw new ValidationError("Email déjà utilisé");
```

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

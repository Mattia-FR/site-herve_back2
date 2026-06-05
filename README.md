# API site Hervé — back2

Backend REST Node.js + Express + MySQL + TypeScript pour le site artiste (articles, galerie, contact, livre d’or, admin JWT).

Couplé à **site-herve_front2** (contrat d’erreurs `{ success, code, message }` — voir [GESTION-ERREURS.md](./GESTION-ERREURS.md)).

## Démarrage rapide

```bash
npm install
cp .env.sample .env
# Éditer .env (MySQL, secrets JWT, CORS_ORIGIN)

npm run init:db   # schema + seeds (destructif)
npm run dev
```

API par défaut : `http://localhost:4242` — préfixe routes métier : `/api`.

## Stack

- Express 4, MySQL2, JWT + refresh cookie, Argon2, Multer, Sharp, Helmet, rate limiting, Winston

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | nodemon + ts-node |
| `npm run build` | `tsc` → `dist/` |
| `npm run start` | `node dist/index.js` |
| `npm run init:db` | `ts-node init.ts` |
| `npm run check` / `lint` / `format` | Biome |

## Variables d'environnement

Voir `.env.sample` : `DB_*`, `PORT`, `CORS_ORIGIN`, `API_URL`, `IMAGE_BASE_URL`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `NODE_ENV`.

## Routes

### Racine et fichiers

| Méthode | Route | Auth |
|---------|-------|------|
| GET | `/` | Non |
| GET | `/uploads/*` | Non (statique) |
| GET | `/api/health` | Non → `{ status: "ok" }` |

### Auth

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/login` | `{ email, password }` → `{ accessToken, user }` + cookie refresh |
| POST | `/api/auth/refresh` | Cookie refresh → `{ accessToken }` |
| POST | `/api/auth/logout` | 204, invalide refresh |

### Public

| Méthode | Route |
|---------|-------|
| GET | `/api/artist/` |
| GET | `/api/articles/homepage-preview` |
| GET | `/api/articles/published` |
| GET | `/api/articles/published/id/:id` |
| GET | `/api/articles/published/slug/:slug` |
| GET | `/api/images/gallery/carousel` |
| GET | `/api/images/gallery?category=slug` |
| GET | `/api/categories/` |
| GET | `/api/categories/:id` |
| POST | `/api/messages/` (honeypot `website`) |
| GET | `/api/guestbook/` |
| POST | `/api/guestbook/` (honeypot `website`) |

### Admin (Bearer JWT)

Préfixe `/api/admin` — header `Authorization: Bearer <accessToken>`.

| Domaine | Routes principales |
|---------|-------------------|
| Articles | CRUD + `POST .../content-images`, `POST .../featured-image` |
| Images | CRUD + `POST /` (multipart `image`) + `PUT /:id/categories` |
| Catégories | CRUD |
| Messages | liste, détail, PATCH statut, DELETE |
| Livre d'or | liste, PATCH statut, DELETE |
| Profil | `GET/PUT /api/admin/users/me` |

## Structure

```
src/
├── app.ts
├── config/       # argon2, helmet, honeypot, multer, startup, uploadsPaths
├── controllers/
├── errors/       # AppError
├── middlewares/  # errorHandler, requireAuth, honeypot, validateMagicBytes
├── models/
├── routes/
└── utils/        # sendError, processImage, asyncHandler
```

## Erreurs

Format unique documenté dans [GESTION-ERREURS.md](./GESTION-ERREURS.md). Helper : `src/utils/sendError.ts`.

# Template Node.js + Express + MySQL + TypeScript

Template personnel pour démarrer rapidement un backend REST avec une structure propre et typée.

## 🚀 Démarrage rapide

```bash
# Cloner le template
git clone https://github.com/Mattia-FR/backend-template nom-du-projet
cd nom-du-projet

# Nettoyer l'historique git et réinitialiser
rm -rf .git
git init

# Mettre à jour le nom du projet
npm pkg set name="nom-du-projet"

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.sample .env
# Éditer .env : remplacer les valeurs du sample par les tiennes (MySQL, port HTTP, etc.)

# MySQL : créer la base dont le nom correspond à DB_NAME dans .env
# (ex. CREATE DATABASE ma_base CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;)

# Lancer le serveur en développement
npm run dev
```

## 🛠️ Stack technique

- **Node.js** — Runtime
- **Express** — Framework HTTP
- **MySQL2** — Connexion MySQL avec pool de connexions (`src/models/db.ts`)
- **TypeScript** — Typage statique
- **Biome** — Linter et formatter (même config que le frontend)
- **ts-node** + **nodemon** — `npm run dev` exécute `index.ts` et relance le process quand nodemon détecte des changements (selon sa config / fichiers surveillés)

## 📝 Scripts disponibles

```bash
npm run dev      # nodemon + ts-node sur index.ts
npm run build    # Compilation TypeScript → dist/
npm run start    # Production : node dist/index.js
npm run check    # Vérification du code (lecture seule)
npm run format   # Formatage automatique
npm run lint     # Linting + formatage + corrections
```

## 📁 Structure du projet

```
.env.sample             # Modèle de variables (à copier en .env, non versionné)
index.ts                # Point d'entrée : dotenv, listen, routes racine
src/
├── app.ts              # Express : /api, puis 404 + erreurs (voir code)
├── routes/
│   └── index.ts        # Router monté sur /api (ex. /api/health)
├── models/
│   └── db.ts           # Pool MySQL + helper query()
├── middlewares/
│   ├── errorHandler.ts # Gestion globale des erreurs
│   └── notFound.ts     # Route introuvable
```

## 🔌 Routes disponibles

| Méthode | Route        | Description              |
|---------|--------------|--------------------------|
| GET     | /            | Réponse texte (racine)   |
| GET     | /api/health  | Santé du serveur (JSON)  |

## ⚙️ Variables d'environnement

Fichier d’exemple : **`.env.sample`**. Copie-le en **`.env`** et adapte les valeurs (le sample utilise des placeholders volontairement).

Variables utilisées dans le code actuel :

```env
# HTTP (index.ts — défaut 4242 si PORT absent)
PORT=4242

# MySQL (src/models/db.ts — défauts si variable absente)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=my_database
```

`NODE_ENV` (ex. `production`) est pris en charge par `errorHandler` pour limiter les logs d’erreur côté client ; tu peux l’ajouter dans ton `.env` si besoin.

## 🎯 Philosophie du template

- **Minimaliste** — Juste l'essentiel, aucune dépendance superflue
- **MVC** — Prêt à étendre avec routes / controllers / models
- **Erreurs centralisées** — Un seul `errorHandler`, les handlers font `next(err)`
- **Cohérent** — Même Biome, même TypeScript strict que le frontend
- **Évolutif** — Ajouter une ressource = router + controller + model selon le besoin

## 📚 Ajouter une ressource API (exemple)

```bash
touch src/routes/items.router.ts
touch src/controllers/items.controller.ts
touch src/models/items.model.ts

# Puis dans src/routes/index.ts :
# import itemsRouter from "./items.router";
# router.use("/items", itemsRouter);
```

---

*Template créé pour mes projets personnels - Libre d'utilisation si ça peut servir !*

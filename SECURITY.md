# Notes de sécurité - Site Hervé Petit Backend

## Avertissements critiques pour la production

### 1. Script init:db

**NE JAMAIS exécuter `npm run init:db` en production.**

Ce script contient `DROP DATABASE IF EXISTS` qui détruit toutes les données. Il est protégé par une vérification `NODE_ENV=production` qui empêche son exécution.

Usage : développement uniquement (reset complet de la base).

### 2. Comptes seeds

Le fichier `seeds.ts` contient des comptes de développement avec mots de passe hashés.

**Actions requises en production :**
- Ne PAS utiliser `seeds.ts` en production
- Créer les comptes admin/artiste manuellement avec des mots de passe forts
- Changer immédiatement les mots de passe après le premier déploiement

### 3. Secrets JWT

Les secrets `ACCESS_TOKEN_SECRET` et `REFRESH_TOKEN_SECRET` doivent être :
- Générés avec `crypto.randomBytes(32)` (minimum 32 caractères)
- Uniques par environnement (dev ≠ prod)
- Stockés de manière sécurisée (gestionnaire de mots de passe)
- Jamais versionnés dans Git

Génération :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Base de données production

**Procédure recommandée :**

1. Créer manuellement la base :
```sql
CREATE DATABASE site_herve_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'site_herve_prod'@'localhost' IDENTIFIED BY '<strong_password>';
GRANT ALL PRIVILEGES ON site_herve_prod.* TO 'site_herve_prod'@'localhost';
```

2. Importer le schéma :
```bash
mysql -u site_herve_prod -p site_herve_prod < schema.sql
```

3. Créer les comptes via SQL direct ou script dédié (pas seeds)

### 5. ID artiste hardcodé

L'application suppose que l'utilisateur artiste a l'ID 2 (voir `src/models/artistModel.ts`).

Si vous réorganisez les users, vérifier la constante `ARTIST_USER_ID`.

### 6. Backups

**Obligatoires en production :**
- MySQL : dump quotidien avec rotation (30 jours minimum)
- Uploads : sauvegarde incrémentale des images

Voir [`MISE-EN-PRODUCTION.md`](../MISE-EN-PRODUCTION.md) pour les scripts de backup.

### 7. Variables d'environnement production

Template complet dans `.env.production.example`.

**Variables critiques :**
- `NODE_ENV=production` (active trust proxy, secure cookies, etc.)
- `CORS_ORIGIN` : domaine frontend exact
- `API_URL` : URL publique de l'API (pour emails, CSP)
- SMTP configuré si `EMAIL_ENABLED=true`

### 8. SSL/TLS MySQL

La connexion MySQL actuelle n'utilise pas SSL. Acceptable si :
- Base de données sur le même serveur (localhost)
- Connexion réseau interne sécurisé

Pour connexion MySQL distante, activer SSL dans `src/config/database.ts`.

## Checklist sécurité avant go-live

- [ ] Secrets JWT uniques générés
- [ ] `.env.production` créé avec vraies valeurs
- [ ] Comptes admin avec mots de passe forts (pas seeds)
- [ ] `NODE_ENV=production` vérifié
- [ ] Backups MySQL configurés
- [ ] Certificat SSL actif (Let's Encrypt)
- [ ] Headers de sécurité Nginx vérifiés
- [ ] Rate limiting actif
- [ ] Logs rotatés (logrotate)

## Contact

Pour questions de sécurité : [contact de l'administrateur système]

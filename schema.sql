-- ============================================================
-- SCHÉMA DE LA BASE DE DONNÉES - Site Artiste
-- ============================================================
-- Moteur  : InnoDB (transactions, clés étrangères, rowlock)
-- Charset : utf8mb4 / utf8mb4_unicode_ci (emojis + langues non-latines)
-- Toutes les tables utilisent des clés primaires auto-incrémentées
-- et des contraintes nommées pour faciliter le débogage.
-- ============================================================


-- ============================================================
-- TABLE users
-- Profils d'utilisateurs (administrateurs du site).
-- L'application ne prévoit qu'un seul compte admin (id = 2 par
-- convention dans artistModel, réservé en seeds).
-- ============================================================

CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,           -- hash Argon2id (jamais le mot de passe en clair)
    refresh_token_hash TEXT,                  -- hash Argon2id du dernier refresh token valide ;
                                              -- NULL = déconnecté. Remplacé à chaque rotation.
    tagline VARCHAR(255),                     -- accroche courte affichée sur le profil public
    bio TEXT,                                 -- biographie longue (peut contenir du HTML)
    hero_text TEXT,                           -- texte principal de la page d'accueil (optionnel)
    quote_text TEXT,                          -- citation mise en avant sur la page d'accueil (optionnel)
    quote_author VARCHAR(100),               -- auteur de la citation (optionnel)
    profile_image_id INT UNSIGNED,            -- FK vers images (SET NULL si image supprimée)
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT uk_users_email UNIQUE (email)
    -- fk_users_profile_image ajouté après la table images (dépendance circulaire)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE contact_messages
-- Messages envoyés via le formulaire de contact public.
-- Les admins peuvent lire, archiver ou marquer comme spam.
-- ============================================================

CREATE TABLE contact_messages (
    id INT UNSIGNED AUTO_INCREMENT,
    firstname VARCHAR(50),
    lastname VARCHAR(50),
    email VARCHAR(100) NOT NULL,
    ip VARCHAR(45),                           -- IPv4 (15 car.) ou IPv6 (39 car.) de l'expéditeur
    subject VARCHAR(200) NOT NULL,
    text TEXT NOT NULL,
    status ENUM('unread', 'read', 'archived', 'spam') DEFAULT 'unread',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_contact_messages_status (status),     -- filtrage rapide par statut (admin liste)
    INDEX idx_contact_messages_created (created_at), -- tri par date
    CONSTRAINT pk_contact_messages PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE articles
-- Articles du blog, avec gestion de statut et d'image à la une.
-- Dépendance circulaire avec images : featured_image_id est une FK
-- vers images, mais images.article_id est aussi une FK vers articles.
-- Résolution : la contrainte FK articles→images est ajoutée après
-- la création de la table images (voir ALTER TABLE ci-dessous).
-- ============================================================

CREATE TABLE articles (
    id INT UNSIGNED AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,               -- URL-safe, unique, généré depuis title
    excerpt TEXT,                             -- résumé court (généré automatiquement depuis content)
    content LONGTEXT NOT NULL,               -- corps de l'article (HTML)
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    user_id INT UNSIGNED NOT NULL,            -- auteur (FK vers users, CASCADE delete)
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL,             -- NULL = jamais publié ; mis à jour quand status → published
    featured_image_id INT UNSIGNED,           -- image à la une (SET NULL si image supprimée)
    INDEX idx_articles_status_updated (status, updated_at), -- tri admin par statut+date
    INDEX idx_articles_updated_at (updated_at),
    INDEX idx_published (published_at),       -- filtre public (WHERE published_at IS NOT NULL)
    CONSTRAINT pk_articles PRIMARY KEY (id),
    CONSTRAINT uk_articles_slug UNIQUE (slug),
    CONSTRAINT fk_articles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    -- fk_articles_featured_image ajouté après la table images (dépendance circulaire)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE images
-- Images téléversées (galerie, images d'articles, photo de profil).
-- Les variantes WebP (thumb/md/lg) générées par Sharp sont stockées
-- en JSON dans la colonne `variants`.
-- ============================================================

CREATE TABLE images (
    id INT UNSIGNED AUTO_INCREMENT,
    title VARCHAR(255),
    description TEXT,
    path VARCHAR(255) NOT NULL,              -- chemin relatif sur le disque (ex: /uploads/gallery/img.jpg)
    is_in_gallery BOOLEAN DEFAULT FALSE,     -- true = visible dans la galerie publique
    display_order SMALLINT UNSIGNED DEFAULT 0, -- ordre d'affichage dans la galerie (tri ASC)
    user_id INT UNSIGNED NOT NULL,            -- uploader (FK vers users, CASCADE delete)
    article_id INT UNSIGNED,                  -- article associé (NULL si image autonome/profil)
    category_id INT UNSIGNED NULL,            -- galerie d'appartenance (SET NULL si catégorie supprimée)
    variants JSON NULL,                       -- { "thumb": "/...", "md": "/...", "lg": "/..." }
                                             -- chemins relatifs des variantes WebP générées par Sharp
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_gallery (is_in_gallery),        -- filtre public de la galerie
    INDEX idx_display_order (display_order),  -- tri de la galerie
    INDEX idx_category (category_id),         -- filtre par galerie
    CONSTRAINT pk_images PRIMARY KEY (id),
    CONSTRAINT fk_images_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_images_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL
    -- fk_images_category ajouté après categories (dépendance circulaire potentielle avec cover_image_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE categories
-- Catégories (= galeries) pour organiser les images.
-- Une image appartient à au plus 1 catégorie (FK directe sur images).
-- cover_image_id : image de couverture choisie manuellement (SET NULL si supprimée).
-- ============================================================

CREATE TABLE categories (
    id INT UNSIGNED AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) NOT NULL,               -- URL-safe, généré depuis name (utilisé dans ?category=slug)
    display_order SMALLINT UNSIGNED DEFAULT 0, -- ordre dans la navigation de la galerie
    cover_image_id INT UNSIGNED NULL,         -- couverture manuelle (NULL = première image par display_order)
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_categories PRIMARY KEY (id),
    CONSTRAINT uk_categories_name UNIQUE (name),
    CONSTRAINT uk_categories_slug UNIQUE (slug)
    -- fk_categories_cover ajouté après (dépendance circulaire images ↔ categories)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- Résolution des dépendances circulaires
-- articles ↔ images, users ↔ images, images ↔ categories.
-- Ces ALTER TABLE doivent être exécutés après la création des
-- tables concernées.
-- ============================================================

-- articles.featured_image_id → images.id
ALTER TABLE articles
    ADD CONSTRAINT fk_articles_featured_image FOREIGN KEY (featured_image_id) REFERENCES images(id) ON DELETE SET NULL;

-- users.profile_image_id → images.id
ALTER TABLE users
    ADD CONSTRAINT fk_users_profile_image FOREIGN KEY (profile_image_id) REFERENCES images(id) ON DELETE SET NULL;

-- images.category_id → categories.id
ALTER TABLE images
    ADD CONSTRAINT fk_images_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- categories.cover_image_id → images.id
ALTER TABLE categories
    ADD CONSTRAINT fk_categories_cover FOREIGN KEY (cover_image_id) REFERENCES images(id) ON DELETE SET NULL;


-- ============================================================
-- TABLE guestbook_entries
-- Entrées du livre d'or soumises par les visiteurs.
-- Workflow de modération : pending → approved (visible publiquement)
--                      ou pending → spam (masqué).
-- ============================================================

CREATE TABLE guestbook_entries (
    id INT UNSIGNED AUTO_INCREMENT,
    author_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),                       -- optionnel, visible uniquement en admin
    message TEXT NOT NULL,
    status ENUM('pending', 'approved', 'spam') DEFAULT 'pending',
                                             -- pending : en attente de modération (défaut)
                                             -- approved : visible publiquement
                                             -- spam : masqué, à supprimer
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_guestbook_status (status),      -- filtre public (WHERE status = 'approved')
    INDEX idx_created (created_at),           -- tri chronologique
    CONSTRAINT pk_guestbook PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- SCRIPT DE MIGRATION — Base existante → schéma cible
-- À exécuter UNE SEULE FOIS sur une base déjà initialisée avec
-- l'ancien schéma (images_categories). Les nouvelles installations
-- utilisent directement le schéma ci-dessus.
-- ============================================================

-- 1. Ajouter category_id sur images
-- ALTER TABLE images
--     ADD COLUMN category_id INT UNSIGNED NULL,
--     ADD INDEX idx_category (category_id),
--     ADD CONSTRAINT fk_images_category
--         FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- 2. Ajouter cover_image_id sur categories
-- ALTER TABLE categories
--     ADD COLUMN cover_image_id INT UNSIGNED NULL,
--     ADD CONSTRAINT fk_categories_cover
--         FOREIGN KEY (cover_image_id) REFERENCES images(id) ON DELETE SET NULL;

-- 3. Migrer les associations depuis images_categories (max 1 par image)
-- UPDATE images i
--     JOIN images_categories ic ON ic.image_id = i.id
--     SET i.category_id = ic.category_id;

-- 4. Initialiser display_order : rang croissant par created_at DESC dans chaque galerie
-- UPDATE images i
--     JOIN (
--         SELECT id,
--             ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY created_at DESC) - 1 AS new_order
--         FROM images
--         WHERE category_id IS NOT NULL AND is_in_gallery = 1
--     ) ranked ON ranked.id = i.id
--     SET i.display_order = ranked.new_order;

-- 5. Supprimer la table de jointure devenue inutile
-- DROP TABLE images_categories;

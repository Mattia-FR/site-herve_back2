-- ============================================
-- SCHÉMA DE LA BASE DE DONNÉES - Site Artiste
-- ============================================

CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    refresh_token_hash TEXT,
    tagline VARCHAR(255),
    bio TEXT,
    profile_image_id INT UNSIGNED,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT uk_users_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE contact_messages (
    id INT UNSIGNED AUTO_INCREMENT,
    firstname VARCHAR(50),
    lastname VARCHAR(50),
    email VARCHAR(100) NOT NULL,
    ip VARCHAR(45),
    subject VARCHAR(200) NOT NULL,
    text TEXT NOT NULL,
    status ENUM('unread', 'read', 'archived', 'spam') DEFAULT 'unread',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_contact_messages_status (status),
    INDEX idx_contact_messages_created (created_at),
    CONSTRAINT pk_contact_messages PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE articles (
    id INT UNSIGNED AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    excerpt TEXT,
    content LONGTEXT NOT NULL,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    user_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL,
    featured_image_id INT UNSIGNED,
    INDEX idx_articles_status_updated (status, updated_at),
    INDEX idx_articles_updated_at (updated_at),
    INDEX idx_published (published_at),
    CONSTRAINT pk_articles PRIMARY KEY (id),
    CONSTRAINT uk_articles_slug UNIQUE (slug),
    CONSTRAINT fk_articles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE images (
    id INT UNSIGNED AUTO_INCREMENT,
    title VARCHAR(255),
    description TEXT,
    path VARCHAR(255) NOT NULL,
    alt_descr VARCHAR(255),
    is_in_gallery BOOLEAN DEFAULT FALSE,
    display_order SMALLINT UNSIGNED DEFAULT 0,
    user_id INT UNSIGNED NOT NULL,
    article_id INT UNSIGNED,
    variants JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_gallery (is_in_gallery),
    INDEX idx_display_order (display_order),
    CONSTRAINT pk_images PRIMARY KEY (id),
    CONSTRAINT fk_images_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_images_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Résolution de la dépendance circulaire articles <-> images
ALTER TABLE articles
    ADD CONSTRAINT fk_articles_featured_image FOREIGN KEY (featured_image_id) REFERENCES images(id) ON DELETE SET NULL;

ALTER TABLE users
    ADD CONSTRAINT fk_users_profile_image FOREIGN KEY (profile_image_id) REFERENCES images(id) ON DELETE SET NULL;

CREATE TABLE categories (
    id INT UNSIGNED AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    display_order SMALLINT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_categories PRIMARY KEY (id),
    CONSTRAINT uk_categories_name UNIQUE (name),
    CONSTRAINT uk_categories_slug UNIQUE (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE images_categories (
    image_id INT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category_id),
    CONSTRAINT pk_images_categories PRIMARY KEY (image_id, category_id),
    CONSTRAINT fk_images_categories_image FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
    CONSTRAINT fk_images_categories_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CONTENU PAGE D'ACCUEIL (singleton)
-- ============================================

CREATE TABLE site_settings (
    id TINYINT UNSIGNED NOT NULL DEFAULT 1,
    hero_text TEXT,
    quote_text TEXT,
    quote_author VARCHAR(100),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_site_settings PRIMARY KEY (id),
    CONSTRAINT chk_site_settings_single_row CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- LIVRE D'OR
-- ============================================

CREATE TABLE guestbook_entries (
    id INT UNSIGNED AUTO_INCREMENT,
    author_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    message TEXT NOT NULL,
    status ENUM('pending', 'approved', 'spam') DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_guestbook_status (status),
    INDEX idx_created (created_at),
    CONSTRAINT pk_guestbook PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

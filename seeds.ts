/**
 * Données de test insérées après création du schéma (init.ts).
 *
 * Couche : Script seed — utilisateurs, catégories, articles, images, messages, livre d'or.
 * Appel : runSeeds(connection) depuis init.ts ou npm run init:db.
 * Note : résout la dépendance circulaire articles ↔ featured_image_id en deux passes.
 */
import type { Connection } from "mysql2/promise";

export async function runSeeds(connection: Connection): Promise<void> {
  // ============================================
  // USERS (1 administrateur + 1 éditeur)
  // Mots de passe hashés avec Argon2id
  // ============================================
  await connection.query(`
    INSERT INTO users (username, email, password) VALUES
    ("admin", "admin@site-herve.local", "$argon2id$v=19$m=65536,t=3,p=4$2eNt3aySYfYyyervEcFtiQ$6wM6Qj0SggDgPTd0Ycnl5KJYZcIjeiRg87Tm2AZTUfI"),
    ("hervé", "herve@site-herve.local", "$argon2id$v=19$m=65536,t=3,p=4$wkio5piGN9BZtJAdkecJ3Q$tgbsy5tWsPXS5/bs7apwAqRGzupLzIay/rudaEMlPWU")
  `);

  // ============================================
  // CATEGORIES
  // ============================================
  await connection.query(`
    INSERT INTO categories (name, slug, display_order) VALUES
    ("Portraits", "portraits", 1),
    ("Paysages", "paysages", 2),
    ("Projets", "projets", 3),
    ("Croquis", "croquis", 4)
  `);

  // ============================================
  // ARTICLES - étape 1 : sans featured_image_id
  // (dépendance circulaire avec images, résolue après)
  // ============================================
  await connection.query(`
    INSERT INTO articles (title, slug, excerpt, content, status, user_id, featured_image_id, published_at) VALUES
    ("Bienvenue sur le site", "bienvenue-sur-le-site", "Présentation du site et des objectifs.", "Bienvenue sur ce site. Vous y trouverez des articles, une galerie et un espace d'échange. N'hésitez pas à parcourir les différentes sections et à me contacter pour toute question.", "published", 1, NULL, "2024-01-15 10:00:00"),
    ("Mon processus de création", "mon-processus-creation", "Chaque réalisation a son histoire. Je partage ici mon processus de création étape par étape : l'inspiration, les croquis, la composition et le rendu final. Découvrez comment une idée prend forme, des premières esquisses aux touches de finition, en passant par les choix de couleur, de matière et de lumière qui structurent chaque tableau.", "Chaque réalisation a son histoire. Je partage ici mon processus de création étape par étape : l'inspiration, les croquis, la composition et le rendu final. Découvrez comment une idée prend forme.", "published", 2, NULL, "2024-02-10 14:30:00"),
    ("Techniques et matériaux", "techniques-materiaux", "Cet article présente les techniques et matériaux que j'utilise au quotidien. Nous verrons ensemble les bases pour bien démarrer et progresser dans sa pratique artistique.", "Cet article présente les techniques et matériaux que j'utilise au quotidien. Nous verrons les bases pour bien démarrer et progresser dans sa pratique.", "published", 1, NULL, "2024-03-05 09:15:00"),
    ("Projet en cours", "projet-en-cours", "Travaux en cours.", "Voici un aperçu de mes projets actuels. Certains sont encore en phase d'étude, d'autres en cours de finalisation.", "published", 2, NULL, "2024-03-20 11:00:00"),
    ("Article à venir", "article-a-venir", "Brouillon d'un prochain article.", "Contenu en préparation. Cet article sera publié prochainement.", "draft", 1, NULL, NULL)
  `);

  // ============================================
  // IMAGES (toutes les images de uploads/gallery)
  // Requêtes paramétrées pour éviter les problèmes d'échappement / encodage.
  // Les 7 premières conservent titres/descriptions pour featured_image_id des articles.
  // ============================================
  const imageRows: [
    string | null,
    string | null,
    string,
    string | null,
    boolean,
    number,
    number,
    number | null,
  ][] = [
    [
      "Portrait",
      "Portrait réalisé aux crayons",
      "/uploads/gallery/portrait.jpg",
      "Portrait",
      true,
      1,
      1,
      1,
    ],
    ["Paysage", "Paysage à l'aquarelle", "/uploads/gallery/paysage.jpg", "Paysage", false, 0, 1, 1],
    [
      "Esquisse",
      "Croquis préparatoire",
      "/uploads/gallery/esquisse.jpg",
      "Esquisse",
      true,
      2,
      2,
      2,
    ],
    ["Détail", "Détail d'une réalisation", "/uploads/gallery/detail.jpg", "Détail", false, 0, 2, 2],
    [
      "Galerie 1",
      "Première image de galerie",
      "/uploads/gallery/galerie-1.jpg",
      "Galerie 1",
      true,
      3,
      1,
      3,
    ],
    [
      "Galerie 2",
      "Deuxième image de galerie",
      "/uploads/gallery/galerie-2.jpg",
      "Galerie 2",
      true,
      4,
      2,
      4,
    ],
    [
      "Hors article",
      "Image sans article lié",
      "/uploads/gallery/standalone.jpg",
      "Image standalone",
      true,
      5,
      1,
      null,
    ],
    ["4", "Image 4", "/uploads/gallery/4.jpg", "Image 4", true, 6, 1, null],
    ["5", "Image 5", "/uploads/gallery/5.jpg", "Image 5", true, 7, 1, null],
    ["6", "Image 6", "/uploads/gallery/6.jpg", "Image 6", true, 8, 1, null],
    ["7", "Image 7", "/uploads/gallery/7.jpg", "Image 7", true, 9, 1, null],
    ["8", "Image 8", "/uploads/gallery/8.jpg", "Image 8", true, 10, 1, null],
    ["9", "Image 9", "/uploads/gallery/9.jpg", "Image 9", true, 11, 1, null],
    ["Anne", "Portrait Anne", "/uploads/gallery/anne.jpg", "Anne", true, 12, 1, null],
    ["Batiste", "Portrait Batiste", "/uploads/gallery/batiste.jpg", "Batiste", true, 13, 1, null],
    [
      "Christophe",
      "Portrait Christophe",
      "/uploads/gallery/christophe.jpg",
      "Christophe",
      true,
      14,
      1,
      null,
    ],
    ["Erwan", "Portrait Erwan", "/uploads/gallery/erwan.jpg", "Erwan", true, 15, 1, null],
    [
      "François",
      "Portrait François",
      "/uploads/gallery/françois-.jpg",
      "François",
      true,
      16,
      1,
      null,
    ],
    [
      "Gérard A4",
      "Gérard format A4",
      "/uploads/gallery/gerard-a4.jpg",
      "Gérard A4",
      true,
      17,
      1,
      null,
    ],
    ["Gérard", "Portrait Gérard", "/uploads/gallery/gerard.jpg", "Gérard", true, 18, 1, null],
    ["Hervé", "Portrait Hervé", "/uploads/gallery/herve.jpg", "Hervé", true, 19, 1, null],
    [
      "Jacqueline",
      "Portrait Jacqueline",
      "/uploads/gallery/jacqueline.jpg",
      "Jacqueline",
      true,
      20,
      1,
      null,
    ],
    ["Jérôme", "Portrait Jérôme", "/uploads/gallery/jerome.jpg", "Jérôme", true, 21, 1, null],
    ["Julie", "Portrait Julie", "/uploads/gallery/julie.jpg", "Julie", true, 22, 1, null],
    ["Laure", "Portrait Laure", "/uploads/gallery/laure.jpg", "Laure", true, 23, 1, null],
    ["Magali", "Portrait Magali", "/uploads/gallery/magali.jpg", "Magali", true, 24, 1, null],
    ["Magalie", "Portrait Magalie", "/uploads/gallery/magalie.jpg", "Magalie", true, 25, 1, null],
    [
      "Matière 019",
      "Réalisation MATIERE019",
      "/uploads/gallery/MATIERE019.jpg",
      "MATIERE019",
      true,
      26,
      1,
      null,
    ],
    [
      "Ophélie A4",
      "Ophélie format A4",
      "/uploads/gallery/ophelie-a4.jpg",
      "Ophélie A4",
      true,
      27,
      1,
      null,
    ],
    [
      "Patricia",
      "Portrait Patricia",
      "/uploads/gallery/patricia.jpg",
      "Patricia",
      true,
      28,
      1,
      null,
    ],
    ["Pauline", "Portrait Pauline", "/uploads/gallery/pauline.jpg", "Pauline", true, 29, 1, null],
    [
      "Philippe",
      "Portrait Philippe",
      "/uploads/gallery/philippe.jpg",
      "Philippe",
      true,
      30,
      1,
      null,
    ],
    ["PUBL.013", "Publication 013", "/uploads/gallery/PUBL.013.jpg", "PUBL.013", true, 31, 1, null],
    ["PUBL003", "Publication 003", "/uploads/gallery/PUBL003.jpg", "PUBL003", true, 32, 1, null],
    ["PUBL005", "Publication 005", "/uploads/gallery/PUBL005.jpg", "PUBL005", true, 33, 1, null],
    ["PUBL008", "Publication 008", "/uploads/gallery/PUBL008.jpg", "PUBL008", true, 34, 1, null],
    ["PUBL009", "Publication 009", "/uploads/gallery/PUBL009.jpg", "PUBL009", true, 35, 1, null],
    ["PUBL011", "Publication 011", "/uploads/gallery/PUBL011.jpg", "PUBL011", true, 36, 1, null],
    ["PUBL012", "Publication 012", "/uploads/gallery/PUBL012.jpg", "PUBL012", true, 37, 1, null],
    ["SANSTIT1", "Sans titre 1", "/uploads/gallery/SANSTIT1.jpg", "SANSTIT1", true, 38, 1, null],
    ["SANSTIT2", "Sans titre 2", "/uploads/gallery/SANSTIT2.jpg", "SANSTIT2", true, 39, 1, null],
    ["SANSTIT3", "Sans titre 3", "/uploads/gallery/SANSTIT3.jpg", "SANSTIT3", true, 40, 1, null],
    ["SANSTIT4", "Sans titre 4", "/uploads/gallery/SANSTIT4.jpg", "SANSTIT4", true, 41, 1, null],
    ["SANSTIT5", "Sans titre 5", "/uploads/gallery/SANSTIT5.jpg", "SANSTIT5", true, 42, 1, null],
    ["SANSTIT6", "Sans titre 6", "/uploads/gallery/SANSTIT6.jpg", "SANSTIT6", true, 43, 1, null],
    ["SANSTIT7", "Sans titre 7", "/uploads/gallery/SANSTIT7.jpg", "SANSTIT7", true, 44, 1, null],
    ["SANSTIT8", "Sans titre 8", "/uploads/gallery/SANSTIT8.jpg", "SANSTIT8", true, 45, 1, null],
    ["SANSTITR", "Sans titre R", "/uploads/gallery/SANSTITR.jpg", "SANSTITR", true, 46, 1, null],
    ["Tag 046", "Tag 046", "/uploads/gallery/tag 046.jpg", "Tag 046", true, 47, 1, null],
    [
      "Sans titre",
      "Image sans titre",
      "/uploads/gallery/Untitled.jpg",
      "Sans titre",
      true,
      48,
      1,
      null,
    ],
    [
      "Vanessa 2 A4",
      "Vanessa 2 format A4",
      "/uploads/gallery/vanessa-2-a4.jpg",
      "Vanessa 2 A4",
      true,
      49,
      1,
      null,
    ],
    [
      "Vanessa A4",
      "Vanessa format A4",
      "/uploads/gallery/vanessa-A4.jpg",
      "Vanessa A4",
      true,
      50,
      1,
      null,
    ],
    ["Vanessa", "Portrait Vanessa", "/uploads/gallery/vanessa.jpg", "Vanessa", true, 51, 1, null],
    ["Willy", "Portrait Willy", "/uploads/gallery/willy.jpg", "Willy", true, 52, 1, null],
  ];

  // Insert ligne par ligne pour éviter tout problème de lot / paramètres
  const insertOne =
    "INSERT INTO images (title, description, path, alt_descr, is_in_gallery, display_order, user_id, article_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
  for (const row of imageRows) {
    await connection.query(insertOne, row);
  }

  const [rows] = await connection.query("SELECT COUNT(*) as cnt FROM images");
  const imageCount = Number((rows as { cnt: number }[])[0]?.cnt ?? 0);
  const expectedCount = imageRows.length;
  if (imageCount !== expectedCount) {
    throw new Error(
      `Seeds: expected ${expectedCount} rows in images, got ${imageCount}. Check INSERT into images.`
    );
  }

  // ============================================
  // ARTICLES - étape 2 : résolution de la dépendance circulaire
  // ============================================
  await connection.query("UPDATE articles SET featured_image_id = 1 WHERE id = 1");
  await connection.query("UPDATE articles SET featured_image_id = 3 WHERE id = 2");
  await connection.query("UPDATE articles SET featured_image_id = 5 WHERE id = 3");
  await connection.query("UPDATE articles SET featured_image_id = 6 WHERE id = 4");

  // ============================================
  // PROFIL PUBLIC ARTISTE (user id 2 = herve)
  // ============================================
  await connection.query(`
    UPDATE users SET
      first_name = "Hervé",
      last_name = "Petit",
      tagline = "Artiste peintre",
      bio = "Peintre passionné, j'explore les rapports entre la lumière, la matière et le portrait. Mon travail mêle techniques traditionnelles et recherches contemporaines pour donner vie à des compositions singulières.\n\nSur ce site, je partage mes réalisations, mon processus de création et les projets en cours. N'hésitez pas à parcourir la galerie et le blog pour découvrir mon univers.",
      hero_text = "Bienvenue sur ce site. Vous y trouverez des articles, une galerie et un espace d'échange. N'hésitez pas à parcourir les différentes sections et à me contacter pour toute question.",
      quote_text = "On comprendra un jour que Raphaël et Vermeer avaient déjà tout découvert en peinture. C'est pourquoi au lieu de persister fastidieusement à théoriser, pour tenter de redécouvrir la peinture... Peignons!",
      quote_author = "Salvador Dalí",
      profile_image_id = 21
    WHERE id = 2
  `);

  // ============================================
  // RELATIONS : Images <-> Categories
  // Répartition : 1=Portraits, 2=Paysages, 3=Projets, 4=Croquis
  // Chaque image a au moins une catégorie (données de test)
  // ============================================
  await connection.query(`
    INSERT INTO images_categories (image_id, category_id) VALUES
    (1, 1),
    (2, 2),
    (3, 4),
    (4, 3),
    (5, 2),
    (5, 3),
    (6, 3),
    (7, 1),
    (8, 3),
    (9, 3),
    (10, 3),
    (11, 3),
    (12, 3),
    (13, 3),
    (14, 1),
    (15, 1),
    (16, 1),
    (17, 1),
    (18, 1),
    (19, 1),
    (20, 1),
    (21, 1),
    (22, 1),
    (23, 1),
    (24, 1),
    (25, 1),
    (26, 1),
    (27, 1),
    (28, 3),
    (29, 1),
    (30, 1),
    (31, 1),
    (32, 1),
    (33, 3),
    (34, 3),
    (35, 3),
    (36, 3),
    (37, 3),
    (38, 3),
    (39, 3),
    (40, 3),
    (41, 3),
    (42, 3),
    (43, 3),
    (44, 3),
    (45, 3),
    (46, 3),
    (47, 3),
    (48, 3),
    (49, 3),
    (50, 3),
    (51, 4),
    (52, 4),
    (53, 1),
    (54, 1)
  `);

  // ============================================
  // CONTACT_MESSAGES
  // ============================================
  await connection.query(`
    INSERT INTO contact_messages (firstname, lastname, email, ip, subject, text, status) VALUES
    ("Jean", "Dupont", "jean.dupont@example.com", "192.168.1.100", "Question sur votre travail", "Bonjour, j'aimerais en savoir plus sur vos réalisations. Pourriez-vous me recontacter ?", "unread"),
    ("Marie", "Dubois", "marie.dubois@example.com", "192.168.1.101", "Demande d'information", "Bonjour, je suis intéressée par une collaboration. Pourrions-nous en discuter ?", "read"),
    ("Thomas", "Lefebvre", "thomas.lefebvre@example.com", "192.168.1.102", "Félicitations", "Bravo pour votre site et vos œuvres !", "unread"),
    ("Julie", "Garcia", "julie.garcia@example.com", "192.168.1.103", "Proposition", "Bonjour, j'organise une exposition et j'aimerais vous y inviter.", "read"),
    ("Bot", "Spam", "noreply@spam.example", "10.0.0.99", "Buy cheap watches", "Click here for amazing deals!!!", "spam")
  `);

  // ============================================
  // LIVRE D'OR (guestbook_entries)
  // ============================================
  await connection.query(`
    INSERT INTO guestbook_entries (author_name, email, message, status) VALUES
    ("Alice", "alice@example.com", "Super site, bravo pour les réalisations !", "approved"),
    ("Bruno", NULL, "Très inspirant, merci pour le partage.", "approved"),
    ("Claire", "claire@example.com", "J'attends la suite des articles avec impatience.", "approved"),
    ("Denis", "denis@example.com", "Message en attente de modération.", "pending"),
    ("Spammer", "viagra@spam.example", "Buy now!!! Cheap pills!!!", "spam"),
    ("Émilie", "emilie.martin@example.com", "Les portraits sont saisissants de justesse. On sent toute la personnalité du modèle.", "approved"),
    ("François", NULL, "Découvert votre travail par hasard — quelle belle surprise. La galerie mérite qu'on s'y attarde.", "approved"),
    ("Hélène", "helene.bernard@example.com", "L'aquarelle du paysage m'a particulièrement touchée. Les dégradés de lumière sont magnifiques.", "approved"),
    ("Isabelle", "isabelle.renard@example.com", "Bravo pour ce site si soigné. C'est un vrai plaisir de parcourir vos créations.", "approved"),
    ("Jacques", NULL, "Artiste de talent, continuez ainsi !", "approved"),
    ("Karine", "karine.lambert@example.com", "Votre article sur le processus de création est fascinant. J'aimerais voir une vidéo de vos croquis.", "approved"),
    ("Laurent", "laurent.dupuis@example.com", "Exposition locale l'an prochain ? Ce serait formidable de voir vos œuvres en vrai.", "approved"),
    ("Margot", NULL, "Les croquis préparatoires révèlent une main sûre et une grande sensibilité.", "approved"),
    ("Nicolas", "nicolas.perrin@example.com", "Site élégant et œuvres remarquables. Je reviendrai régulièrement.", "approved"),
    ("Odile", "odile.girard@example.com", "Le portrait d'Anne est stupéfiant — on dirait qu'elle va nous parler.", "approved"),
    ("Pascal", NULL, "Merci pour ce partage généreux de votre univers artistique.", "approved"),
    ("Quentin", "quentin.moreau@example.com", "Techniques et matériaux : un article très instructif pour un amateur comme moi.", "approved"),
    ("Rachel", "rachel.vidal@example.com", "Vos publications PUBL sont d'une grande force. Félicitations pour cette série.", "approved"),
    ("Sylvie", NULL, "Un site qui respire la passion et le métier. Chapeau !", "approved"),
    ("Thierry", "thierry.roux@example.com", "J'ai offert un de vos portraits à ma mère — elle en est restée bouche bée.", "approved"),
    ("Valérie", "valerie.costa@example.com", "La matière, la lumière, l'émotion : tout y est. Merci Hervé.", "approved"),
    ("Xavier", NULL, "Première visite aujourd'hui, certainement pas la dernière.", "approved"),
    ("Yasmine", "yasmine.elkadi@example.com", "Votre travail sur les rapports lumière-matière est remarquable. Très belle galerie.", "approved"),
    ("Zoé", "zoe.marchand@example.com", "Les croquis SANSTIT ont quelque chose d'immédiat et de vivant. J'adore.", "approved")
  `);
}

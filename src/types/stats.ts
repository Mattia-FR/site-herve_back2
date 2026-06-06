export interface AdminStats {
  articles: {
    published: number;
    draft: number;
  };
  categories: {
    total: number;
  };
  images: {
    in_gallery: number;
  };
  guestbook: {
    approved: number;
    pending: number;
  };
  messages: {
    unread: number;
  };
}

export interface SiteSettings {
  heroText: string | null;
  quoteText: string | null;
  quoteAuthor: string | null;
}

export interface SiteSettingsUpdateData {
  heroText?: string | null;
  quoteText?: string | null;
  quoteAuthor?: string | null;
}

export type GuestbookStatus = "pending" | "approved" | "spam";

export interface GuestbookEntry {
  id: number;
  author_name: string;
  email: string | null;
  message: string;
  status: GuestbookStatus;
  created_at: string;
}

export interface GuestbookCreateData {
  author_name: string;
  email?: string | null;
  message: string;
}

export interface GuestbookUpdateData {
  status: GuestbookStatus;
}

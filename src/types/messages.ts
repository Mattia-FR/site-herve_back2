export type MessageStatus = "unread" | "read" | "archived" | "spam";

export interface Message {
  id: number;
  firstname: string | null;
  lastname: string | null;
  email: string;
  ip: string | null;
  subject: string;
  text: string;
  status: MessageStatus;
  created_at: string;
}

export interface MessageCreateData {
  firstname?: string | null;
  lastname?: string | null;
  email: string;
  ip?: string | null;
  subject: string;
  text: string;
}

export interface MessageUpdateData {
  status?: MessageStatus;
}

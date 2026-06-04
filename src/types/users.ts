export interface User {
  id: number;
  username: string;
  email: string;
  tagline: string | null;
  bio: string | null;
  profile_image_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserCreateData {
  username: string;
  email: string;
  password: string;
}

export interface UserUpdateData {
  username?: string;
  email?: string;
  password?: string;
  tagline?: string | null;
  bio?: string | null;
  profile_image_id?: number | null;
}

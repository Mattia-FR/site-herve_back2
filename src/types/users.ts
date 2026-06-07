export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
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
  first_name?: string | null;
  last_name?: string | null;
  tagline?: string | null;
  bio?: string | null;
  profile_image_id?: number | null;
}

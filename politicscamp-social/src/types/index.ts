export type Party = "liberty" | "freedom";

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  party: Party;
  role: string;
  bio?: string | null;
  avatar_url?: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  is_breaking: boolean;
  created_at: string;
  author?: Profile;
  like_count?: number;
  comment_count?: number;
  has_liked?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

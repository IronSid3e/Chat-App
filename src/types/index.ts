export type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Channel = {
  id: string;
  name: string;
  is_direct_message: boolean;
  avatar_url: string | null;
  created_at: string;
  last_message?: Pick<Message, "id" | "content" | "image_url" | "created_at"> | null;
};

export type Message = {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  sender?: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
};

export type User = Profile;

import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials are missing! Please connect to Supabase first.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Hot score calculation
export const calculateHotScore = (
  ups: number, 
  downs: number, 
  createdAt: Date
): number => {
  const score = ups - downs;
  const s = score > 0 ? 1 : score < 0 ? -1 : 0;
  const z = Math.max(Math.abs(score), 1);
  const order = Math.log10(z);
  
  // 1134028003 is the Reddit epoch (Dec 8, 2005)
  const seconds = Math.floor(createdAt.getTime() / 1000) - 1134028003;
  
  return parseFloat((order + (s * (seconds / 45000))).toFixed(7));
};

// Types
export type Community = {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
  image_url: string | null;
  user_id: string | null;
  member_count: number;
  post_count: number;
  created_at: string;
  updated_at: string;
};

export type User = {
  id: string;
  email: string;
  username: string | null;
  profile_image_url: string | null;
  bio: string | null;
  karma_score: number;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  user_id: string | null;
  community_id: number;
  title: string;
  body: string | null;
  image_url: string | null;
  is_promoted: boolean;
  upvotes_count: number;
  downvotes_count: number;
  comments_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  // Join fields
  community_name?: string;
  community_display_name?: string;
  community_image_url?: string;
  username?: string | null;
  profile_image_url?: string | null;
  hot_score?: number;
};

export type Comment = {
  id: string;
  post_id: string;
  parent_comment_id: string | null;
  user_id: string | null;
  body: string;
  upvotes_count: number;
  downvotes_count: number;
  depth: number;
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
  // Join fields
  username?: string | null;
  profile_image_url?: string | null;
  // Nested comments
  replies?: Comment[];
};

export type Vote = {
  user_id: string;
  post_id: string;
  vote_type: number; // 1=upvote, -1=downvote
  created_at: string;
  updated_at: string;
};
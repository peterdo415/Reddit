/*
  # Initial Schema Setup

  1. Tables
    - communities
    - users
    - posts
    - comments
    - votes
    - user_communities

  2. Views
    - post_hot_scores for calculating trending posts

  3. Security
    - Row Level Security (RLS) policies for all tables
    - Secure user management triggers
*/

-- Helper functions for counter operations
CREATE OR REPLACE FUNCTION increment(x integer) RETURNS integer AS $$
BEGIN
  RETURN x + 1;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement(x integer) RETURNS integer AS $$
BEGIN
  RETURN GREATEST(0, x - 1);
END;
$$ LANGUAGE plpgsql;

-- Communities table
CREATE TABLE IF NOT EXISTS communities (
  id serial PRIMARY KEY,              -- コミュニティID
  name text NOT NULL UNIQUE,          -- internal identifier, ex: 'news'
  display_name text NOT NULL,         -- 表示名, ex: 'ニュース'
  description text,                   -- コミュニティ説明
  image_url text,                     -- コミュニティ画像URL（任意）
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- 作成者
  member_count int DEFAULT 0,         -- メンバー数キャッシュ（将来拡張用）
  post_count int DEFAULT 0,           -- 投稿数キャッシュ（将来拡張用）
  created_at timestamptz DEFAULT now(),-- 作成日時
  updated_at timestamptz DEFAULT now() -- 更新日時
);

-- Indexes for communities
CREATE INDEX IF NOT EXISTS idx_communities_name ON communities(name);
CREATE INDEX IF NOT EXISTS idx_communities_display_name ON communities USING gin(to_tsvector('english', display_name));
CREATE INDEX IF NOT EXISTS idx_communities_created_at ON communities(created_at DESC);

-- Users profile table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,  -- ユーザーUUID
  email text UNIQUE NOT NULL,                     -- 認証済みメールアドレス
  username text UNIQUE,                           -- ユーザー名（任意）
  profile_image_url text,                         -- プロフィール画像URL
  bio text,                                       -- 自己紹介
  karma_score int DEFAULT 0,                      -- カルマスコア（将来拡張用）
  created_at timestamptz DEFAULT now(),           -- 作成日時
  updated_at timestamptz DEFAULT now()            -- 更新日時
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_karma_score ON users(karma_score DESC);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),   -- 投稿UUID
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- 投稿者
  community_id int REFERENCES communities(id) ON DELETE CASCADE, -- コミュニティ
  title text NOT NULL,                            -- タイトル
  body text,                                      -- 本文（省略可）
  image_url text,                                 -- 画像URL（省略可）
  is_promoted boolean DEFAULT false,              -- 広告フラグ
  upvotes_count int DEFAULT 0,                    -- 賛成票数
  downvotes_count int DEFAULT 0,                  -- 反対票数
  comments_count int DEFAULT 0,                   -- コメント数キャッシュ
  view_count int DEFAULT 0,                       -- 閲覧数（将来拡張用）
  created_at timestamptz DEFAULT now(),           -- 作成日時
  updated_at timestamptz DEFAULT now()            -- 更新日時
);

-- Indexes for posts
CREATE INDEX IF NOT EXISTS idx_posts_community_created ON posts(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_hot_score ON posts((upvotes_count - downvotes_count) DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING gin(to_tsvector('english', title || ' ' || COALESCE(body, '')));
CREATE INDEX IF NOT EXISTS idx_posts_promoted ON posts(is_promoted, created_at DESC);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),   -- コメントUUID
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE, -- 対象投稿
  parent_comment_id uuid REFERENCES comments(id) ON DELETE CASCADE, -- 親コメント（階層対応）
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- コメント者
  body text NOT NULL,                              -- コメント本文
  upvotes_count int DEFAULT 0,                     -- コメント賛成票（将来拡張用）
  downvotes_count int DEFAULT 0,                   -- コメント反対票（将来拡張用）
  depth int DEFAULT 0,                             -- コメント階層深度
  created_at timestamptz DEFAULT now(),            -- 作成日時
  updated_at timestamptz DEFAULT now()             -- 更新日時
);

-- Indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent_created ON comments(parent_comment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_user_created ON comments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_depth ON comments(depth);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- 投票者
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE, -- 対象投稿
  vote_type smallint NOT NULL,     -- 1=upvote, -1=downvote
  created_at timestamptz DEFAULT now(), -- 投票日時
  updated_at timestamptz DEFAULT now(), -- 更新日時
  PRIMARY KEY (user_id, post_id)    -- 重複投票防止
);

-- Indexes for votes
CREATE INDEX IF NOT EXISTS idx_votes_post_type ON votes(post_id, vote_type);
CREATE INDEX IF NOT EXISTS idx_votes_user_created ON votes(user_id, created_at DESC);

-- User communities table
CREATE TABLE IF NOT EXISTS user_communities (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id int REFERENCES communities(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, community_id)
);

-- Indexes for user_communities
CREATE INDEX IF NOT EXISTS idx_user_communities_user ON user_communities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_communities_community ON user_communities(community_id);

-- Hot score view
CREATE OR REPLACE VIEW post_hot_scores AS
SELECT
  p.*,
  c.name AS community_name,
  c.display_name AS community_display_name,
  c.image_url AS community_image_url,
  u.username,
  u.profile_image_url,
  (
    LOG(GREATEST(ABS(p.upvotes_count - p.downvotes_count), 1)) / LN(10)
    + (
        CASE
          WHEN (p.upvotes_count - p.downvotes_count) > 0 THEN 1
          WHEN (p.upvotes_count - p.downvotes_count) < 0 THEN -1
          ELSE 0
        END
      ) * ((EXTRACT(EPOCH FROM p.created_at)::bigint - 1134028003) / 45000.0)
  ) AS hot_score
FROM posts p
LEFT JOIN communities c ON p.community_id = c.id
LEFT JOIN users u ON p.user_id = u.id;

-- Insert default communities
INSERT INTO communities (name, display_name, description, image_url)
VALUES
  ('news', 'ニュース', 'ニュースについての議論', 'https://images.pexels.com/photos/518543/pexels-photo-518543.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'),
  ('entertainment', 'エンターテイメント', '映画、テレビ、音楽などのエンタメ', 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'),
  ('tech', 'テクノロジー', 'テクノロジーとガジェットについて', 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'),
  ('sports', 'スポーツ', 'スポーツニュースと議論', 'https://images.pexels.com/photos/248547/pexels-photo-248547.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'),
  ('gaming', 'ゲーム', 'ビデオゲームについて', 'https://images.pexels.com/photos/275033/pexels-photo-275033.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_communities ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Communities policies
CREATE POLICY "Communities are viewable by everyone"
  ON communities FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Communities can be created by authenticated users"
  ON communities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Communities can be updated by their creator"
  ON communities FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users policies
CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Posts policies
CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Posts can be created by authenticated users"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Posts can be updated by their author"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Comments can be created by authenticated users"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Comments can be updated by their author"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Votes policies
CREATE POLICY "Votes are viewable by everyone"
  ON votes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Votes can be created by authenticated users"
  ON votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Votes can be updated by their creator"
  ON votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Votes can be deleted by their creator"
  ON votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User communities policies
CREATE POLICY "User communities are viewable by everyone"
  ON user_communities FOR SELECT
  TO public
  USING (true);

CREATE POLICY "User communities can be managed by the user"
  ON user_communities FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger function to update users table on auth.users changes
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'username', NEW.created_at, NEW.updated_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
/*
  # Initial database schema

  1. Tables
    - users
    - communities
    - posts
    - comments
    - votes
    - user_communities
    - post_hot_scores (view)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
*/

-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  username text UNIQUE,
  profile_image_url text,
  bio text,
  karma_score integer DEFAULT 0,
  password_hash text,
  email_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Communities table
CREATE TABLE communities (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  image_url text,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  member_count integer DEFAULT 0,
  post_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

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

-- Posts table
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  community_id integer REFERENCES communities(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  image_url text,
  is_promoted boolean DEFAULT false,
  upvotes_count integer DEFAULT 0,
  downvotes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

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

-- Comments table
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  body text NOT NULL,
  upvotes_count integer DEFAULT 0,
  downvotes_count integer DEFAULT 0,
  depth integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

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

-- Votes table
CREATE TABLE votes (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  vote_type smallint NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

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

-- User Communities table
CREATE TABLE user_communities (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  community_id integer REFERENCES communities(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, community_id)
);

ALTER TABLE user_communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User communities are viewable by everyone"
  ON user_communities FOR SELECT
  TO public
  USING (true);

CREATE POLICY "User communities can be managed by the user"
  ON user_communities FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email_verified ON users(email_verified);
CREATE INDEX idx_users_karma_score ON users(karma_score DESC);

CREATE INDEX idx_communities_name ON communities(name);
CREATE INDEX idx_communities_display_name ON communities USING gin(to_tsvector('english', display_name));
CREATE INDEX idx_communities_created_at ON communities(created_at DESC);

CREATE INDEX idx_posts_community_created ON posts(community_id, created_at DESC);
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX idx_posts_promoted ON posts(is_promoted, created_at DESC);
CREATE INDEX idx_posts_hot_score ON posts((upvotes_count - downvotes_count) DESC, created_at DESC);
CREATE INDEX idx_posts_search ON posts USING gin(to_tsvector('english', title || ' ' || COALESCE(body, '')));

CREATE INDEX idx_comments_post_created ON comments(post_id, created_at DESC);
CREATE INDEX idx_comments_parent_created ON comments(parent_comment_id, created_at DESC);
CREATE INDEX idx_comments_user_created ON comments(user_id, created_at DESC);
CREATE INDEX idx_comments_depth ON comments(depth);

CREATE INDEX idx_votes_post_type ON votes(post_id, vote_type);
CREATE INDEX idx_votes_user_created ON votes(user_id, created_at DESC);

CREATE INDEX idx_user_communities_user ON user_communities(user_id);
CREATE INDEX idx_user_communities_community ON user_communities(community_id);

-- Hot Score View
CREATE VIEW post_hot_scores AS
SELECT 
  p.*,
  c.name as community_name,
  c.display_name as community_display_name,
  c.image_url as community_image_url,
  u.username,
  u.profile_image_url,
  ROUND(
    CAST(
      LOG(GREATEST(ABS(p.upvotes_count - p.downvotes_count), 1)) + 
      SIGN(p.upvotes_count - p.downvotes_count) * 
      EXTRACT(EPOCH FROM p.created_at - '2005-12-08 07:46:43'::timestamp) / 45000
    AS NUMERIC
  ), 7) as hot_score
FROM posts p
JOIN communities c ON p.community_id = c.id
LEFT JOIN users u ON p.user_id = u.id;